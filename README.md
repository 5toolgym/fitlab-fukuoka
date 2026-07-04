# FitLab Fukuoka

5toolgym（福岡のパーソナルトレーニングジム）が運営するオウンドメディア。

**URL**: https://fitlab-fukuoka.pages.dev

---

## セットアップ

```bash
npm install
```

## ビルド

```bash
npm run build
# → public/ に全HTMLが生成される
```

## 記事生成（Claude API使用）

```bash
ANTHROPIC_API_KEY=your_key_here npm run generate
# → articles/ に Markdown記事が1本生成され、自動的にビルドも走る
```

## プロジェクト構造

```
fitlab-fukuoka/
├── articles/          # Markdown記事（自動生成 or 手書き）
├── scripts/
│   ├── build.js       # 静的サイトビルド
│   └── generate-article.js  # 記事自動生成
├── outreach/          # 営業用メール文・チェックリスト
├── public/            # ビルド出力（Cloudflare Pagesが配信）
├── .github/workflows/ # 週3回自動生成ワークフロー
└── package.json
```

## GitHub Actions（自動デプロイ）

月・水・金 朝9時（JST）に自動実行:
1. `generate-article.js` で記事1本生成
2. `build.js` でサイト全体ビルド
3. git commit & push
4. Cloudflare Pages にデプロイ

### 必要な GitHub Secrets

| Secret名 | 説明 |
|---------|------|
| `ANTHROPIC_API_KEY` | Claude API キー |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API トークン |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare アカウント ID |

## Cloudflare Pages 設定

- プロジェクト名: `fitlab-fukuoka`
- ビルドコマンド: `node scripts/build.js`
- 出力ディレクトリ: `public`
