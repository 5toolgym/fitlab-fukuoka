#!/usr/bin/env node
// ============================================================
// check-articles.mjs
//
// Quality gate for articles/*.md. Runs after article generation
// and before the build/commit/push steps in
// .github/workflows/auto-generate.yml, so that a bad article
// (e.g. one containing fabricated gyms or dummy URLs) never
// reaches the built site or the git history.
//
// Usage: node scripts/check-articles.mjs
// Exits with code 1 and prints all violations if any are found.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = path.join(__dirname, '../articles');

function readArticleFiles() {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  return fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md'));
}

function checkArticles() {
  const errors = [];
  const files = readArticleFiles();

  for (const file of files) {
    const filePath = path.join(ARTICLES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // 架空ジム・ダミーURL混入をブロック
    const bannedPatterns = [/架空/, /example\.com/, /ダミー/, /仮の(?:ジム|店舗|店名)/];
    const hit = bannedPatterns.find((re) => re.test(content));
    if (hit) errors.push(`${file}: 架空ジム/ダミー表記の疑い（${hit.source}）`);
  }

  return errors;
}

function main() {
  console.log('Checking articles for fabricated gyms / dummy URLs...\n');
  const errors = checkArticles();

  if (errors.length > 0) {
    console.error(`✗ ${errors.length} article(s) failed validation:\n`);
    errors.forEach((e) => console.error(`  - ${e}`));
    console.error('\n記事内に架空のジム名・店舗名・ダミーURL（example.com等）が含まれています。');
    console.error('実在を確認できないジムは固有名を出さず一般化してください。');
    process.exit(1);
  }

  console.log('✓ All articles passed validation.');
}

main();
