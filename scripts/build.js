#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

// ============================================================
// CONFIG
// ============================================================
const SITE_URL = 'https://fitlab-fukuoka.pages.dev';
const SITE_NAME = 'FitLab Fukuoka';
const SITE_DESC = '福岡のパーソナルトレーニング情報メディア。5toolgymのトレーナーが姿勢改善・ダイエット・ジム選びを徹底解説。';
const GA4_ID = 'G-28580FZYHB';

const CATEGORIES = [
  { slug: 'posture',   name: '姿勢改善',      desc: '猫背・反り腰・巻き肩など、姿勢の悩みをトレーナーが解説します。' },
  { slug: 'diet',      name: 'ダイエット',     desc: '科学的根拠のあるダイエット方法を現役パーソナルトレーナーが解説。' },
  { slug: 'training',  name: 'トレーニング',   desc: 'トレーニングの正しい知識と方法を、NCCA講師資格保有者が解説。' },
  { slug: 'gym',       name: 'ジム選び',       desc: '福岡でパーソナルジムを選ぶときのポイントを現役トレーナー目線で。' },
  { slug: 'nutrition', name: '栄養・食事',     desc: 'トレーニングの効果を最大化する食事・栄養の知識を解説。' },
  { slug: 'expert',    name: '福岡の専門家',   desc: '福岡で活躍する専門家との対談・コラボ記事。' },
];

const YAKUIN = {
  name: '5toolgym 薬院店',
  feature: 'パーソナルトレーニング＋24時間フリートレーニング',
  access: '薬院大通駅徒歩2分',
  reserveUrl: 'https://instagram.kanzashi.com/l/1uyf95d0BYo/kirei',
  lineUrl: 'https://lin.ee/Y1P0dZl',
};
const AKASAKA = {
  name: '5toolgym 赤坂・大濠公園店',
  feature: '完全個室パーソナルジム',
  access: '赤坂駅徒歩6分',
  reserveUrl: 'https://instagram.kanzashi.com/l/1wufb22dHU8/kirei',
  lineUrl: 'https://lin.ee/9aIBM3I',
};

const ROOT   = path.join(__dirname, '..');
const DIRS = {
  articles:       path.join(ROOT, 'articles'),
  public:         path.join(ROOT, 'public'),
  publicArticles: path.join(ROOT, 'public/articles'),
  publicCategory: path.join(ROOT, 'public/category'),
};

const CAT_SLUG_MAP = {
  '姿勢改善': 'posture', 'ダイエット': 'diet', 'トレーニング': 'training',
  'ジム選び': 'gym', '栄養・食事': 'nutrition', '福岡の専門家': 'expert',
};

// ============================================================
// CSS
// ============================================================
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:16px;scroll-behavior:smooth}
body{font-family:'Noto Sans JP',sans-serif;font-weight:400;color:#0a0a0a;background:#fff;line-height:1.8;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
a:hover{text-decoration:underline}
img{max-width:100%;height:auto;display:block}

/* Layout */
.wrap{max-width:900px;margin:0 auto;padding:0 20px}

/* Header */
.site-header{border-bottom:1px solid #e8e8e8;position:sticky;top:0;background:rgba(255,255,255,.97);backdrop-filter:blur(4px);z-index:100}
.site-header .wrap{display:flex;align-items:center;justify-content:space-between;height:56px}
.site-logo{font-size:1.05rem;font-weight:700;letter-spacing:.03em;color:#0a0a0a}
.site-logo em{font-style:normal;color:#00cc60}
.site-nav{display:flex;gap:24px}
.site-nav a{font-size:.82rem;color:#555}
.site-nav a:hover{color:#0a0a0a;text-decoration:none}

/* Footer */
.site-footer{margin-top:80px;border-top:1px solid #e8e8e8;padding:40px 0;font-size:.78rem;color:#888}
.footer-inner{max-width:900px;margin:0 auto;padding:0 20px;display:flex;flex-direction:column;gap:14px}
.footer-links{display:flex;gap:18px;flex-wrap:wrap}
.footer-links a{color:#888}
.footer-links a:hover{color:#0a0a0a}

/* Breadcrumb */
.breadcrumb{padding:12px 0;font-size:.78rem;color:#999;display:flex;gap:5px;align-items:center;flex-wrap:wrap}
.breadcrumb a{color:#999}
.breadcrumb a:hover{color:#0a0a0a}
.breadcrumb .sep{color:#ccc}

/* Section title */
.sec-title{font-size:1rem;font-weight:700;padding-bottom:7px;border-bottom:2px solid #0a0a0a;margin-bottom:22px}

/* Category badge */
.cat-badge{display:inline-block;font-size:.7rem;font-weight:700;padding:2px 8px;border-radius:3px;background:#e8fff3;color:#007a40}

/* Article grid */
.article-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(255px,1fr));gap:20px;margin-bottom:44px}
.article-card{border:1px solid #e8e8e8;border-radius:6px;overflow:hidden;transition:box-shadow .15s;display:block}
.article-card:hover{box-shadow:0 2px 12px rgba(0,0,0,.08);text-decoration:none}
.article-card-body{padding:14px}
.article-card .cat-badge{margin-bottom:8px}
.article-card h3{font-size:.88rem;font-weight:700;line-height:1.5;color:#0a0a0a}
.article-card .art-date{font-size:.73rem;color:#aaa;margin-top:7px}

/* Article list */
.article-list{list-style:none;margin-bottom:44px}
.article-list li{border-bottom:1px solid #e8e8e8;padding:18px 0;display:flex;gap:14px;align-items:flex-start}
.article-list li:last-child{border-bottom:none}
.article-list .cat-badge{flex-shrink:0;margin-top:2px}
.article-list .art-title{font-size:.92rem;font-weight:700;color:#0a0a0a}
.article-list .art-title:hover{color:#00884a;text-decoration:underline}
.article-list .art-date{font-size:.73rem;color:#aaa;margin-top:4px}

/* Category grid */
.cat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:44px}
.cat-card{border:1px solid #e8e8e8;border-radius:6px;padding:16px 12px;text-align:center;font-size:.82rem;font-weight:700;color:#0a0a0a;transition:background .12s,border-color .12s}
.cat-card:hover{background:#f5fff9;border-color:#00cc60;text-decoration:none}
.cat-icon{font-size:1.4rem;margin-bottom:5px}

/* Index hero */
.index-hero{padding:60px 0 44px;border-bottom:1px solid #e8e8e8}
.index-hero h1{font-size:clamp(1.5rem,4vw,2.3rem);font-weight:700;line-height:1.45;margin-bottom:14px}
.index-hero h1 em{font-style:normal;color:#00cc60}
.index-hero p{font-size:.95rem;color:#555;max-width:600px}

/* Article page header */
.art-header{padding:36px 0 28px}
.art-header .cat-badge{margin-bottom:10px}
.art-header h1{font-size:clamp(1.35rem,3.5vw,1.95rem);font-weight:700;line-height:1.45;margin-bottom:14px}
.art-meta{display:flex;gap:14px;font-size:.78rem;color:#999;align-items:center;flex-wrap:wrap}
.art-meta .author{font-weight:700;color:#555}

/* TOC */
.toc-box{background:#f8f8f8;border:1px solid #e8e8e8;border-left:3px solid #00ff7f;border-radius:4px;padding:18px 22px;margin:28px 0}
.toc-title{font-size:.82rem;font-weight:700;margin-bottom:10px;color:#555}
.toc-box ol{padding-left:18px}
.toc-box li{font-size:.85rem;margin-bottom:5px}
.toc-box a{color:#00884a}
.toc-box a:hover{text-decoration:underline}

/* Article body */
.art-body{padding:4px 0 36px}
.art-body h2{font-size:1.25rem;font-weight:700;margin:44px 0 14px;padding-bottom:7px;border-bottom:2px solid #0a0a0a}
.art-body h3{font-size:1.05rem;font-weight:700;margin:28px 0 10px;padding-left:10px;border-left:3px solid #00ff7f}
.art-body h4{font-size:.95rem;font-weight:700;margin:20px 0 7px}
.art-body p{margin-bottom:14px}
.art-body ul,.art-body ol{padding-left:22px;margin-bottom:14px}
.art-body li{margin-bottom:5px}
.art-body strong{font-weight:700}
.art-body blockquote{border-left:3px solid #e8e8e8;padding-left:14px;color:#666;margin:14px 0}
.art-body table{width:100%;border-collapse:collapse;margin-bottom:14px}
.art-body th,.art-body td{border:1px solid #e8e8e8;padding:8px 11px;font-size:.88rem}
.art-body th{background:#f8f8f8;font-weight:700}

/* Expert note */
.expert-note{background:#f8f8f8;border:1px solid #e8e8e8;padding:11px 15px;border-radius:4px;font-size:.8rem;color:#666;margin:14px 0}

/* FAQ accordion */
.faq-sec{margin:36px 0}
.faq-sec>h2{font-size:1.25rem;font-weight:700;margin-bottom:18px;padding-bottom:7px;border-bottom:2px solid #0a0a0a}
.faq-item{border:1px solid #e8e8e8;border-radius:6px;margin-bottom:7px;overflow:hidden}
.faq-q{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;cursor:pointer;font-weight:700;font-size:.92rem;background:#fafafa;user-select:none}
.faq-q:hover{background:#f5fff9}
.faq-q::after{content:'+';font-size:1.2rem;color:#00cc60;flex-shrink:0;margin-left:10px}
.faq-item.open .faq-q::after{content:'−'}
.faq-a{display:none;padding:14px 18px;font-size:.88rem;color:#333;line-height:1.9}
.faq-item.open .faq-a{display:block}

/* Related */
.related-sec{margin:44px 0 0;padding-top:28px;border-top:1px solid #e8e8e8}
.related-sec .sec-title{margin-bottom:18px}
.related-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}

/* CTA */
.cta-sec{margin:44px 0 0}
.cta-block{border-radius:8px;padding:24px 22px;margin-bottom:14px}
.cta-yakuin{background:#0a0a0a;color:#fff}
.cta-akasaka{background:#e8fff3;border:1px solid #00cc60;color:#0a0a0a}
.cta-block h3{font-size:.95rem;font-weight:700;margin-bottom:3px}
.cta-block p{font-size:.82rem;margin-bottom:14px}
.cta-yakuin p{color:rgba(255,255,255,.65)}
.cta-akasaka p{color:#444}
.cta-btns{display:flex;gap:9px;flex-wrap:wrap}
.btn-reserve{display:inline-block;background:#00ff7f;color:#0a0a0a;font-weight:700;font-size:.85rem;padding:9px 18px;border-radius:4px;transition:opacity .15s}
.btn-reserve:hover{opacity:.82;text-decoration:none}
.btn-line{display:inline-block;background:#06c755;color:#fff;font-weight:700;font-size:.85rem;padding:9px 18px;border-radius:4px;transition:opacity .15s}
.btn-line:hover{opacity:.82;text-decoration:none}
.cta-akasaka .btn-reserve{background:#0a0a0a;color:#fff}

/* Trainer page */
.trainer-hero{padding:44px 0;display:flex;gap:28px;align-items:flex-start;border-bottom:1px solid #e8e8e8;margin-bottom:36px}
.trainer-avatar{width:110px;height:110px;border-radius:50%;background:#e8e8e8;flex-shrink:0;overflow:hidden}
.trainer-name{font-size:1.5rem;font-weight:700;margin-bottom:3px}
.trainer-role{font-size:.85rem;color:#888;margin-bottom:14px}
.cred-list{list-style:none;display:flex;flex-direction:column;gap:5px}
.cred-list li{font-size:.85rem;padding-left:15px;position:relative}
.cred-list li::before{content:'✓';color:#00cc60;position:absolute;left:0;font-weight:700}
.philosophy-box{background:#0a0a0a;color:#fff;border-radius:8px;padding:22px;margin:28px 0}
.philosophy-box p{font-size:.92rem;line-height:2}
.philosophy-box strong{color:#00ff7f}

/* Category page header */
.cat-page-h{padding:36px 0 28px;border-bottom:1px solid #e8e8e8;margin-bottom:28px}
.cat-page-h h1{font-size:1.7rem;font-weight:700}
.cat-page-h p{color:#666;margin-top:7px;font-size:.9rem}

/* About page */
.about-sec{padding:44px 0}
.about-sec h1{font-size:1.9rem;font-weight:700;margin-bottom:22px}
.about-sec h2{font-size:1.1rem;font-weight:700;margin:28px 0 10px;padding-bottom:6px;border-bottom:2px solid #0a0a0a}
.about-sec p,.about-sec li{color:#333;margin-bottom:12px}
.about-sec ul{padding-left:20px}

/* Responsive */
@media(max-width:640px){
  .site-nav{display:none}
  .cat-grid{grid-template-columns:repeat(2,1fr)}
  .article-grid{grid-template-columns:1fr}
  .trainer-hero{flex-direction:column}
  .cta-btns{flex-direction:column}
  .related-grid{grid-template-columns:1fr}
}
`;

// ============================================================
// UTILS
// ============================================================
function ensureDirs() {
  Object.values(DIRS).forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });
}

function slugId(text) {
  return text.replace(/<[^>]+>/g, '').replace(/[^\w　-鿿゠-ヿ一-鿿]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function fmtDate(s) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return String(s);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// ============================================================
// READ ARTICLES
// ============================================================
function readArticles() {
  if (!fs.existsSync(DIRS.articles)) return [];
  return fs.readdirSync(DIRS.articles)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const raw = fs.readFileSync(path.join(DIRS.articles, f), 'utf8');
      const { data, content } = matter(raw);
      const slug = data.slug || f.replace('.md', '');
      return {
        slug,
        title:      data.title || 'Untitled',
        category:   data.category || 'トレーニング',
        catSlug:    CAT_SLUG_MAP[data.category] || 'training',
        description:data.description || '',
        date:       data.date ? String(data.date) : '2026-07-04',
        author:     data.author || '柴山智幸',
        expertName: data.expert_name || null,
        expertRole: data.expert_role || null,
        content,
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ============================================================
// HTML PARTS
// ============================================================
function head({ title, desc, canonical }) {
  const full = (title === SITE_NAME) ? SITE_NAME : `${title} | ${SITE_NAME}`;
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${full}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${full}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE_NAME}">
<meta name="twitter:card" content="summary">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap" rel="stylesheet">
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_ID}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4_ID}');</script>
<style>${CSS}</style>
</head>`;
}

function nav() {
  return `<header class="site-header">
<div class="wrap">
  <a href="/" class="site-logo">FitLab <em>Fukuoka</em></a>
  <nav class="site-nav">
    <a href="/category/posture.html">姿勢改善</a>
    <a href="/category/diet.html">ダイエット</a>
    <a href="/category/gym.html">ジム選び</a>
    <a href="/trainer.html">トレーナー</a>
    <a href="/about.html">About</a>
  </nav>
</div>
</header>`;
}

function footer() {
  const catLinks = CATEGORIES.map(c => `<a href="/category/${c.slug}.html">${c.name}</a>`).join('\n    ');
  return `<footer class="site-footer">
<div class="footer-inner">
  <div class="footer-links">
    <a href="/">ホーム</a>
    <a href="/about.html">About</a>
    <a href="/trainer.html">トレーナー</a>
    ${catLinks}
  </div>
  <p>© 2026 FitLab Fukuoka &nbsp;|&nbsp; 運営: 5toolgym（福岡市中央区）</p>
</div>
</footer>`;
}

function cta() {
  return `<div class="cta-sec">
  <div class="cta-block cta-yakuin">
    <h3>${YAKUIN.name}</h3>
    <p>${YAKUIN.feature} | ${YAKUIN.access}</p>
    <div class="cta-btns">
      <a href="${YAKUIN.reserveUrl}" class="btn-reserve" target="_blank" rel="noopener">体験予約（90分）</a>
      <a href="${YAKUIN.lineUrl}" class="btn-line" target="_blank" rel="noopener">LINEで相談</a>
    </div>
  </div>
  <div class="cta-block cta-akasaka">
    <h3>${AKASAKA.name}</h3>
    <p>${AKASAKA.feature} | ${AKASAKA.access}</p>
    <div class="cta-btns">
      <a href="${AKASAKA.reserveUrl}" class="btn-reserve" target="_blank" rel="noopener">体験予約（90分）</a>
      <a href="${AKASAKA.lineUrl}" class="btn-line" target="_blank" rel="noopener">LINEで相談</a>
    </div>
  </div>
</div>`;
}

function breadcrumb(crumbs) {
  const parts = crumbs.map((c, i) => {
    if (i === crumbs.length - 1) return `<span>${c.name}</span>`;
    return `<a href="${c.url}">${c.name}</a>`;
  });
  return `<nav class="breadcrumb" aria-label="パンくずリスト">${parts.join('<span class="sep">›</span>')}</nav>`;
}

// Build TOC from rendered HTML (looks for h2 with id attrs)
function buildTOC(html) {
  const items = [];
  const re = /<h2[^>]*id="([^"]*)"[^>]*>(.*?)<\/h2>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const txt = m[2].replace(/<[^>]+>/g, '');
    if (txt && !txt.includes('よくある質問')) items.push({ id: m[1], text: txt });
  }
  if (items.length < 3) return '';
  const lis = items.map(h => `<li><a href="#${h.id}">${h.text}</a></li>`).join('');
  return `<div class="toc-box"><p class="toc-title">目次</p><ol>${lis}</ol></div>`;
}

// Extract FAQ section and convert to accordion
function buildFAQ(html) {
  const faqRe = /<h2[^>]*>よくある質問<\/h2>([\s\S]*?)(?=<h2[^>]*>(?!よくある質問)|$)/i;
  const faqMatch = html.match(faqRe);
  if (!faqMatch) return { html, items: [] };

  const block = faqMatch[0];
  const items = [];
  const qaRe = /<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3|$)/gi;
  let qm;
  while ((qm = qaRe.exec(block)) !== null) {
    const q = qm[1].replace(/<[^>]+>/g, '').replace(/^Q[:：]\s*/i, '').trim();
    const a = qm[2].replace(/<h3[\s\S]*?<\/h3>/g, '').trim();
    if (q) items.push({ q, a });
  }
  if (!items.length) return { html, items: [] };

  const accordion = `<div class="faq-sec">
<h2>よくある質問</h2>
${items.map((item, i) => `<div class="faq-item" id="faq-${i}">
  <div class="faq-q" onclick="this.parentElement.classList.toggle('open')">${item.q}</div>
  <div class="faq-a">${item.a}</div>
</div>`).join('\n')}
</div>`;

  return { html: html.replace(block, accordion), items };
}

function relatedArticles(all, currentSlug, category) {
  const rel = all.filter(a => a.slug !== currentSlug && a.category === category).slice(0, 3);
  if (!rel.length) return '';
  const cards = rel.map(a => `<a href="/articles/${a.slug}.html" class="article-card">
  <div class="article-card-body">
    <span class="cat-badge">${a.category}</span>
    <h3>${a.title}</h3>
    <p class="art-date">${fmtDate(a.date)}</p>
  </div>
</a>`).join('');
  return `<div class="related-sec"><p class="sec-title">関連記事</p><div class="related-grid">${cards}</div></div>`;
}

// ============================================================
// JSON-LD
// ============================================================
function ld(obj) {
  return `<script type="application/ld+json">${JSON.stringify(obj, null, 2)}</script>`;
}

function ldWebSite() {
  return { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: SITE_URL, description: SITE_DESC, inLanguage: 'ja' };
}

function ldLocalBusinesses() {
  return [
    { '@context': 'https://schema.org', '@type': 'HealthClub', name: YAKUIN.name,
      address: { '@type': 'PostalAddress', streetAddress: '薬院3丁目13-22 新宝ビル3F', addressLocality: '福岡市中央区', addressRegion: '福岡県', postalCode: '810-0022', addressCountry: 'JP' },
      description: YAKUIN.feature },
    { '@context': 'https://schema.org', '@type': 'HealthClub', name: AKASAKA.name,
      address: { '@type': 'PostalAddress', streetAddress: '舞鶴3丁目2-7 K2ビル1階', addressLocality: '福岡市中央区', addressRegion: '福岡県', postalCode: '810-0073', addressCountry: 'JP' },
      description: AKASAKA.feature },
  ];
}

function ldArticle(a) {
  return { '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.description,
    author: { '@type': 'Person', name: a.author, url: `${SITE_URL}/trainer.html` },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    datePublished: a.date, mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/articles/${a.slug}.html` } };
}

function ldBreadcrumb(crumbs) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url ? `${SITE_URL}${c.url}` : undefined })) };
}

function ldFAQ(items) {
  if (!items.length) return null;
  return { '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: items.map(item => ({ '@type': 'Question', name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a.replace(/<[^>]+>/g, '') } })) };
}

function ldPerson() {
  return { '@context': 'https://schema.org', '@type': 'Person', name: '柴山智幸', alternateName: 'しばやまともゆき',
    jobTitle: 'パーソナルトレーナー・5toolgymオーナー',
    description: 'NCCA（全日本コンディショニングコーチ協会）講師。姿勢改善・コンディショニング指導を得意とするパーソナルトレーナー。',
    worksFor: [{ '@type': 'Organization', name: '5toolgym 薬院店' }, { '@type': 'Organization', name: '5toolgym 赤坂・大濠公園店' }],
    url: `${SITE_URL}/trainer.html` };
}

// ============================================================
// PAGE BUILDERS
// ============================================================
function buildIndex(articles) {
  const catIcons = { '姿勢改善': '🧍', 'ダイエット': '💪', 'トレーニング': '🏋️', 'ジム選び': '🔍', '栄養・食事': '🥗', '福岡の専門家': '👨‍⚕️' };
  const featured = articles.slice(0, 3);
  const latest = articles.slice(0, 9);

  const catCards = CATEGORIES.map(c => `<a href="/category/${c.slug}.html" class="cat-card">
  <div class="cat-icon">${catIcons[c.name] || '📄'}</div>
  <div>${c.name}</div>
</a>`).join('');

  const featCards = featured.map(a => `<a href="/articles/${a.slug}.html" class="article-card">
  <div class="article-card-body">
    <span class="cat-badge">${a.category}</span>
    <h3>${a.title}</h3>
    <p class="art-date">${fmtDate(a.date)}</p>
  </div>
</a>`).join('');

  const latestItems = latest.map(a => `<li>
  <span class="cat-badge">${a.category}</span>
  <div><a href="/articles/${a.slug}.html" class="art-title">${a.title}</a><p class="art-date">${fmtDate(a.date)}</p></div>
</li>`).join('');

  const html = `${head({ title: SITE_NAME, desc: SITE_DESC, canonical: `${SITE_URL}/` })}
<body>
${nav()}
<main>
<div class="wrap">
  <section class="index-hero">
    <h1>福岡のパーソナルジムで<br><em>楽に、強く、心地よく</em></h1>
    <p>5toolgymのトレーナーが姿勢改善・ダイエット・機能改善について現場の言葉で書くオウンドメディアです。</p>
  </section>
  <section style="padding:44px 0">
    <p class="sec-title">カテゴリ</p>
    <div class="cat-grid">${catCards}</div>
    ${featured.length ? `<p class="sec-title">注目記事</p><div class="article-grid">${featCards}</div>` : ''}
    ${latest.length ? `<p class="sec-title">最新記事</p><ul class="article-list">${latestItems}</ul>` : `<p style="color:#aaa;padding:60px 0;text-align:center">記事を準備中です。</p>`}
  </section>
</div>
</main>
${footer()}
${ld(ldWebSite())}
${ldLocalBusinesses().map(ld).join('\n')}
</body></html>`;

  fs.writeFileSync(path.join(DIRS.public, 'index.html'), html, 'utf8');
  console.log('✓ index.html');
}

function buildAbout() {
  const html = `${head({ title: 'FitLab Fukuokaについて', desc: 'FitLab Fukuokaは5toolgymのトレーナーが運営する福岡のパーソナルトレーニング情報メディアです。', canonical: `${SITE_URL}/about.html` })}
<body>
${nav()}
<main>
<div class="wrap">
  <section class="about-sec">
    <h1>FitLab Fukuokaについて</h1>
    <h2>このメディアの目的</h2>
    <p>FitLab Fukuokaは、福岡市中央区でパーソナルトレーニングジム「5toolgym」を運営するトレーナー・柴山智幸が書くオウンドメディアです。</p>
    <p>「運動を始めたいけど何から始めれば？」「姿勢が悪いのはトレーニングで直せる？」「パーソナルジムを選ぶポイントは？」——そういった疑問に、現場のトレーナーとして正直に答えるために作りました。</p>
    <h2>書いていること</h2>
    <p>姿勢改善・ダイエット・機能改善に関する記事を中心に、福岡のジム選びや専門家とのコラボ記事を公開しています。カテゴリは「姿勢改善」「ダイエット」「トレーニング」「ジム選び」「栄養・食事」「福岡の専門家」の6つです。</p>
    <h2>書いているトレーナー</h2>
    <p>柴山智幸（しばやまともゆき）。5toolgym薬院店・赤坂店のオーナートレーナー。NCCA（全日本コンディショニングコーチ協会）講師資格保有。姿勢改善・コンディショニング指導を得意としています。</p>
    <p>詳しくは<a href="/trainer.html" style="color:#00884a">トレーナープロフィール</a>をご覧ください。</p>
    <h2>5toolgymについて</h2>
    <ul>
      <li><strong>薬院店</strong>: パーソナルトレーニング＋24時間フリートレーニング | 薬院大通駅徒歩2分</li>
      <li><strong>赤坂・大濠公園店</strong>: 完全個室パーソナルジム | 赤坂駅徒歩6分</li>
    </ul>
    ${cta()}
  </section>
</div>
</main>
${footer()}
</body></html>`;

  fs.writeFileSync(path.join(DIRS.public, 'about.html'), html, 'utf8');
  console.log('✓ about.html');
}

function buildTrainer() {
  const html = `${head({ title: '柴山智幸｜5toolgymオーナートレーナー・NCCA講師', desc: 'NCCA講師資格保有。姿勢改善・機能改善指導を得意とする5toolgym薬院店・赤坂店のオーナートレーナー、柴山智幸のプロフィールページ。', canonical: `${SITE_URL}/trainer.html` })}
<body>
${nav()}
<main>
<div class="wrap">
  <div class="trainer-hero">
    <div class="trainer-avatar"></div>
    <div>
      <p class="trainer-name">柴山智幸</p>
      <p class="trainer-role">5toolgymオーナー・チーフトレーナー / NCCA講師</p>
      <ul class="cred-list">
        <li>NCCA（全日本コンディショニングコーチ協会）講師資格</li>
        <li>姿勢改善・機能改善指導</li>
        <li>コンディショニング指導</li>
        <li>5toolgym 薬院店・赤坂店 オーナー</li>
      </ul>
    </div>
  </div>

  <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:14px;padding-bottom:7px;border-bottom:2px solid #0a0a0a">指導のフィロソフィー</h2>
  <div class="philosophy-box">
    <p>「楽に、強く、心地よく」——これが5toolgymの哲学です。</p>
    <p>多くの方を見てきて気づいたのは、体型が変わらない方の多くは鍛え方が間違っているのではなく、<strong>カラダの使い方に問題がある</strong>ということ。姿勢が整っていないまま運動すると、むしろ痛みが出る。動きのクセを直さないと、何年通っても変わらない。</p>
    <p>だから私は、まず「機能を整える」ことを先にやります。カラダが本来持っている動きを取り戻す。その上で筋力・体力をつけていくことで、無理なく、長く続けられるカラダづくりができると考えています。</p>
  </div>

  <h2 style="font-size:1.1rem;font-weight:700;margin:28px 0 14px;padding-bottom:7px;border-bottom:2px solid #0a0a0a">指導内容</h2>
  <ul style="padding-left:20px;line-height:2.2;font-size:.92rem">
    <li><strong>姿勢改善</strong>：猫背・反り腰・巻き肩など、姿勢の根本から整える</li>
    <li><strong>機能改善指導</strong>：姿勢・動作パターンの根本的な改善</li>
    <li><strong>コンディショニング</strong>：カラダのコンディション管理とパフォーマンス向上</li>
    <li><strong>NCCA講師</strong>：コンディショニングコーチの育成にも携わる</li>
  </ul>

  <h2 style="font-size:1.1rem;font-weight:700;margin:28px 0 14px;padding-bottom:7px;border-bottom:2px solid #0a0a0a">執筆記事</h2>
  <p style="font-size:.9rem;color:#555;margin-bottom:22px">FitLab Fukuokaで公開している記事はすべて柴山智幸本人が執筆・監修しています。</p>

  ${cta()}
</div>
</main>
${footer()}
${ld(ldPerson())}
</body></html>`;

  fs.writeFileSync(path.join(DIRS.public, 'trainer.html'), html, 'utf8');
  console.log('✓ trainer.html');
}

function buildCategory(cat, all) {
  const articles = all.filter(a => a.catSlug === cat.slug);
  const isExpert = cat.slug === 'expert';

  let content;
  if (isExpert) {
    const withExpert = articles.filter(a => a.expertName);
    const rest       = articles.filter(a => !a.expertName);

    const expertCards = withExpert.map(a => `<a href="/articles/${a.slug}.html" class="article-card">
  <div class="article-card-body">
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">
      <div style="width:38px;height:38px;border-radius:50%;background:#e8fff3;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">👨‍⚕️</div>
      <div><p style="font-weight:700;font-size:.85rem;margin:0">${a.expertName}</p><p style="font-size:.75rem;color:#888;margin:0">${a.expertRole || ''}</p></div>
    </div>
    <h3>${a.title}</h3>
    <p class="art-date">${fmtDate(a.date)}</p>
  </div>
</a>`).join('');

    const restCards = rest.map(a => `<a href="/articles/${a.slug}.html" class="article-card">
  <div class="article-card-body">
    <span class="cat-badge">${a.category}</span>
    <h3>${a.title}</h3>
    <p class="art-date">${fmtDate(a.date)}</p>
  </div>
</a>`).join('');

    content = `${withExpert.length ? `<p class="sec-title">専門家コラボ記事</p><div class="article-grid">${expertCards}</div>` : ''}
${rest.length ? `<p class="sec-title">関連記事</p><div class="article-grid">${restCards}</div>` : ''}`;
  } else {
    const cards = articles.map(a => `<a href="/articles/${a.slug}.html" class="article-card">
  <div class="article-card-body">
    <span class="cat-badge">${a.category}</span>
    <h3>${a.title}</h3>
    <p class="art-date">${fmtDate(a.date)}</p>
  </div>
</a>`).join('');
    content = articles.length ? `<div class="article-grid">${cards}</div>` : `<p style="color:#aaa;padding:60px 0;text-align:center">このカテゴリの記事を準備中です。</p>`;
  }

  const crumbs = [{ name: 'ホーム', url: '/' }, { name: cat.name }];
  const html = `${head({ title: `${cat.name}の記事一覧`, desc: cat.desc, canonical: `${SITE_URL}/category/${cat.slug}.html` })}
<body>
${nav()}
<main>
<div class="wrap">
  ${breadcrumb(crumbs)}
  <div class="cat-page-h">
    <h1>${cat.name}</h1>
    <p>${cat.desc}</p>
  </div>
  ${content}
  ${cta()}
</div>
</main>
${footer()}
</body></html>`;

  fs.writeFileSync(path.join(DIRS.publicCategory, `${cat.slug}.html`), html, 'utf8');
  console.log(`✓ category/${cat.slug}.html`);
}

function addHeadingIds(html) {
  const counts = {};
  return html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, depth, inner) => {
    const raw = inner.replace(/<[^>]+>/g, '');
    const base = slugId(raw);
    const id = counts[base] ? `${base}-${counts[base]++}` : base;
    if (!counts[base]) counts[base] = 1;
    return `<h${depth} id="${id}">${inner}</h${depth}>`;
  });
}

function buildArticle(a, all) {
  const rawHtml = addHeadingIds(marked.parse(a.content));
  const toc = buildTOC(rawHtml);
  const { html: processedHtml, items: faqItems } = buildFAQ(rawHtml);

  const crumbs = [
    { name: 'ホーム', url: '/' },
    { name: a.category, url: `/category/${a.catSlug}.html` },
    { name: a.title },
  ];

  const expertNote = a.expertName
    ? `<p class="expert-note">※本記事は取材・対談をもとに構成しています。協力: ${a.expertName}（${a.expertRole || ''}）</p>`
    : '';

  const scripts = [ld(ldArticle(a)), ld(ldBreadcrumb(crumbs))];
  if (faqItems.length) scripts.push(ld(ldFAQ(faqItems)));

  const html = `${head({ title: a.title, desc: a.description, canonical: `${SITE_URL}/articles/${a.slug}.html` })}
<body>
${nav()}
<main>
<div class="wrap">
  ${breadcrumb(crumbs)}
  <article>
    <div class="art-header">
      <span class="cat-badge"><a href="/category/${a.catSlug}.html" style="color:inherit">${a.category}</a></span>
      <h1>${a.title}</h1>
      <div class="art-meta">
        <span class="author">著者: ${a.author}</span>
        <span>${fmtDate(a.date)}</span>
      </div>
    </div>
    ${expertNote}
    ${toc}
    <div class="art-body">${processedHtml}</div>
  </article>
  ${relatedArticles(all, a.slug, a.category)}
  ${cta()}
</div>
</main>
${footer()}
${scripts.join('\n')}
</body></html>`;

  fs.writeFileSync(path.join(DIRS.publicArticles, `${a.slug}.html`), html, 'utf8');
  console.log(`✓ articles/${a.slug}.html`);
}

function buildSitemap(articles) {
  const urls = [
    { loc: `${SITE_URL}/`, priority: '1.0' },
    { loc: `${SITE_URL}/about.html`, priority: '0.6' },
    { loc: `${SITE_URL}/trainer.html`, priority: '0.8' },
    ...CATEGORIES.map(c => ({ loc: `${SITE_URL}/category/${c.slug}.html`, priority: '0.7' })),
    ...articles.map(a => ({ loc: `${SITE_URL}/articles/${a.slug}.html`, priority: '0.8' })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>weekly</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(DIRS.public, 'sitemap.xml'), xml, 'utf8');
  console.log('✓ sitemap.xml');
}

function buildRobots() {
  fs.writeFileSync(path.join(DIRS.public, 'robots.txt'),
    `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml`, 'utf8');
  console.log('✓ robots.txt');
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('Building FitLab Fukuoka...\n');
  ensureDirs();
  const articles = readArticles();
  console.log(`Found ${articles.length} article(s)\n`);

  buildIndex(articles);
  buildAbout();
  buildTrainer();
  CATEGORIES.forEach(cat => buildCategory(cat, articles));
  articles.forEach(a => buildArticle(a, articles));
  buildSitemap(articles);
  buildRobots();

  console.log(`\nBuild complete. ${articles.length} articles, ${CATEGORIES.length} categories.`);
  console.log(`Output: ${DIRS.public}`);
}

main().catch(err => { console.error(err); process.exit(1); });
