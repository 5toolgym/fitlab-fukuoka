/**
 * update-gym-data.js
 * 
 * 比較記事内の架空ジム（example.comリンク or （架空）タグ）を
 * Claude API + web_searchで検索した実在ジムデータに自動差し替えするスクリプト。
 * 
 * 実行方法:
 *   ANTHROPIC_API_KEY=xxx node scripts/update-gym-data.js
 * 
 * GitHub Actionsでの実行:
 *   毎月1日の朝8時（JST）に自動実行。比較記事を全件チェックし、
 *   架空ジムが残っていれば差し替えてコミット・デプロイする。
 */

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.join(__dirname, '../articles');
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY が設定されていません');
  process.exit(1);
}

// 架空ジムの検出パターン
const FAKE_GYM_PATTERNS = [
  /（架空）/,
  /https:\/\/example\.com\//,
];

function hasFakeGym(content) {
  return FAKE_GYM_PATTERNS.some(pattern => pattern.test(content));
}

function extractAreaFromTitle(title) {
  // タイトルからエリア名を抽出（例: 「薬院大通駅のパーソナルジム...」→「薬院大通駅」）
  const match = title.match(/^(.+?駅|.+?エリア|.+?周辺)/);
  return match ? match[1] : null;
}

async function fixArticleWithClaude(filePath, content) {
  const titleMatch = content.match(/^title:\s*"(.+?)"/m);
  const title = titleMatch ? titleMatch[1] : path.basename(filePath);
  const area = extractAreaFromTitle(title) || '薬院大通駅';

  console.log(`  → Claude APIで実在ジムを検索中... (エリア: ${area})`);

  const prompt = `
以下のMarkdown記事には、架空のジム名・架空のURLが含まれています（「（架空）」タグ、またはexample.comのURL）。
これらを、${area}周辺の実在するパーソナルジムの正確な情報に差し替えてください。

【重要なルール】
- web_searchを使って実在ジムを必ず検索してから情報を入力すること
- 架空のジム名・URLは完全に削除し、実在するジム名・公式URLに置き換える
- 比較表の内容（指導専門性・マンツーマン可否・設備・料金・24時間利用）も実際の情報で埋める
- 料金が不明な場合は「公式サイトに要確認」と記載する
- 5toolgymは変更しない
- 記事の他の部分（5toolgymの説明・FAQ・アクセスなど）は変更しない
- 出力はMarkdown全文をそのまま返すこと（front-matter含む）
- 余計な説明文は不要。Markdownのみを返すこと

【対象記事】
${content}
`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
        }
      ],
      messages: [
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API エラー: ${response.status} ${err}`);
  }

  const data = await response.json();

  // テキストブロックを結合
  const updatedContent = data.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n')
    .trim();

  // Markdownとして有効かチェック（front-matterが残っているか）
  if (!updatedContent.includes('---') || !updatedContent.includes('title:')) {
    throw new Error('APIからの返答がMarkeid形式ではありません');
  }

  return updatedContent;
}

async function main() {
  console.log('=== update-gym-data.js 開始 ===\n');

  if (!fs.existsSync(ARTICLES_DIR)) {
    console.log(`articles/ ディレクトリが見つかりません: ${ARTICLES_DIR}`);
    process.exit(0);
  }

  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md'));
  console.log(`記事ファイル数: ${files.length}`);

  let fixedCount = 0;

  for (const file of files) {
    const filePath = path.join(ARTICLES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    if (!hasFakeGym(content)) {
      continue; // 架空ジムなし → スキップ
    }

    console.log(`\n[要修正] ${file}`);

    try {
      const updatedContent = await fixArticleWithClaude(filePath, content);

      // 修正後も架空ジムが残っていないか確認
      if (hasFakeGym(updatedContent)) {
        console.log(`  ⚠️  修正後も架空ジムが残っています。手動確認が必要です: ${file}`);
        continue;
      }

      fs.writeFileSync(filePath, updatedContent, 'utf-8');
      console.log(`  ✅ 修正完了: ${file}`);
      fixedCount++;

      // API負荷軽減のため3秒待機
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (err) {
      console.error(`  ❌ エラー (${file}): ${err.message}`);
    }
  }

  console.log(`\n=== 完了: ${fixedCount}件 修正 ===`);

  // 修正がなければ exit 0 のまま（git commitは不要）
  process.exit(fixedCount > 0 ? 0 : 0);
}

main();
