#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const ARTICLES_DIR = path.join(__dirname, '../articles');

// ============================================================
// 30 ARTICLE THEMES
// ============================================================
const ARTICLE_THEMES = [
  // ─── Priority A (10) ───────────────────────────────────────
  {
    slug: 'yakuin-odori-eki-personal-gym',
    title: '薬院大通駅のパーソナルジム徹底比較｜選び方と5toolgymの特徴',
    category: 'ジム選び',
    priority: 'A',
    keywords: ['薬院大通駅', 'パーソナルジム', '比較', '福岡'],
    target: '薬院大通駅周辺でパーソナルジムを探している人',
    must_include: '薬院大通駅から通えるジムの公正な比較。体性感覚トレーニングの特徴。24時間フリートレーニングの利便性。比較軸は①指導の専門性②マンツーマンか③設備④料金⑤24時間利用',
    related_questions: [
      '薬院大通駅近くのパーソナルジムの料金相場は？',
      'パーソナルジムと一般ジムの違いは何ですか？',
      '体験だけ申し込むことはできますか？',
      '薬院大通駅から5toolgymまでの行き方は？',
    ],
  },
  {
    slug: 'yakuin-eki-personal-gym',
    title: '薬院駅のパーソナルジム比較｜福岡市中央区で選ぶポイント',
    category: 'ジム選び',
    priority: 'A',
    keywords: ['薬院駅', 'パーソナルジム', '比較', '福岡市中央区'],
    target: '薬院駅近くでパーソナルジムを探している人',
    must_include: '薬院エリアのジム比較。通いやすさ。専門性の見分け方。薬院駅と薬院大通駅の違いも整理',
    related_questions: [
      '薬院駅近くにはどんなパーソナルジムがありますか？',
      'パーソナルジムの体験はどんなことをしますか？',
      '薬院と薬院大通の違いは？どちらが通いやすい？',
      '入会前に確認すべきことは何ですか？',
    ],
  },
  {
    slug: 'akasaka-eki-personal-gym',
    title: '赤坂駅のパーソナルジム比較｜完全個室の価値とは',
    category: 'ジム選び',
    priority: 'A',
    keywords: ['赤坂駅', 'パーソナルジム', '完全個室', '福岡'],
    target: '赤坂駅近くで完全個室のパーソナルジムを探している人',
    must_include: '完全個室の価値とメリット。赤坂エリアのジム比較。プライバシーを重視するターゲットへの訴求。フェアな比較',
    related_questions: [
      '完全個室と半個室の違いは何ですか？',
      '赤坂駅から5toolgymまでの行き方は？',
      '完全個室のパーソナルジムはなぜ料金が高めなの？',
      '一人でも安心して通えますか？',
    ],
  },
  {
    slug: 'ohori-koen-personal-gym',
    title: '大濠公園駅のパーソナルジム｜公園ランと組み合わせた理想の運動習慣',
    category: 'ジム選び',
    priority: 'A',
    keywords: ['大濠公園駅', 'パーソナルジム', '大濠公園', '運動習慣'],
    target: '大濠公園エリアで運動を始めたい人・大濠ランと組み合わせたい人',
    must_include: '大濠公園での有酸素運動とパーソナルジムの組み合わせ効果。大濠公園駅からのアクセス。機能改善の観点からの提案',
    related_questions: [
      '大濠公園でのランニングとパーソナルジムは組み合わせられますか？',
      '大濠公園駅から5toolgym赤坂店までの行き方は？',
      '週1回のパーソナルトレーニングと自主練の組み合わせ方は？',
      '初心者でも大丈夫ですか？',
    ],
  },
  {
    slug: 'yakuin-5toolgym-taiken',
    title: '5toolgym薬院店の体験レポート｜予約から当日の流れを完全解説',
    category: 'ジム選び',
    priority: 'A',
    keywords: ['5toolgym', '薬院', '体験', '流れ'],
    target: '5toolgym薬院店の体験を申し込もうか迷っている人',
    must_include: '体験の具体的な流れ（カウンセリング→アセスメント→トレーニング）。体験料金13,200円と当日入会で無料の仕組み。当日の服装・持ち物。よくある不安の解消',
    related_questions: [
      '体験は何分くらいかかりますか？',
      '体験の当日は何を持っていけばいいですか？',
      '体験後に強引な勧誘はありますか？',
      '体験だけで終わりにすることはできますか？',
    ],
  },
  {
    slug: 'akasaka-5toolgym-kojinshitsu',
    title: '5toolgym赤坂・大濠公園店｜完全個室パーソナルジムの全貌',
    category: 'ジム選び',
    priority: 'A',
    keywords: ['5toolgym', '赤坂', '完全個室', 'パーソナルジム'],
    target: '5toolgym赤坂店に興味がある人・完全個室を求めている人',
    must_include: '完全個室の空間・設備の詳細。プライバシーへのこだわり。赤坂店でできること。体験の流れ。薬院店との違い',
    related_questions: [
      '完全個室とはどういう意味ですか？',
      '赤坂店の体験料金は？',
      '薬院店と赤坂店の違いは？',
      '女性一人でも安心ですか？',
    ],
  },
  {
    slug: 'fukuoka-chuo-ku-personal-gym',
    title: '福岡市中央区のパーソナルジム比較2026年版｜目的別おすすめ',
    category: 'ジム選び',
    priority: 'A',
    keywords: ['福岡市中央区', 'パーソナルジム', '比較', '2026'],
    target: '福岡市中央区でパーソナルジムを探している人',
    must_include: '中央区のジム比較（料金・特徴・立地）。目的別（ダイエット・姿勢・機能改善）のおすすめ。5toolgymの立ち位置をフェアに説明',
    related_questions: [
      '福岡市中央区のパーソナルジムの平均料金は？',
      '目的によってジムの選び方は変わりますか？',
      '福岡市中央区で女性向けのパーソナルジムは？',
      '無料体験があるジムはどこですか？',
    ],
  },
  {
    slug: 'seikotsu-in-personal-gym',
    title: '整骨院とパーソナルジムを併用すべき理由｜福岡の専門家が語る姿勢改善の正しい順番',
    category: '福岡の専門家',
    priority: 'A',
    keywords: ['整骨院', 'パーソナルジム', '姿勢改善', '福岡'],
    target: '整骨院通いに限界を感じている人・姿勢改善の順番を知りたい人',
    must_include: '整骨院とパーソナルジムの役割の違い。組み合わせ方3パターン。コスト・タイミングの考え方。対談形式パートを挿入',
    related_questions: [
      '整骨院に通っても姿勢が改善しない理由は？',
      'パーソナルジムに通う前に整骨院に行くべき？',
      '整骨院とパーソナルジムを同時並行してもいい？',
      '腰痛があってもパーソナルジムに通えますか？',
    ],
  },
  {
    slug: 'nutritionist-lowfat-personal-gym',
    title: '管理栄養士×パーソナルジム｜ローファット食事法の正しい取り入れ方',
    category: '福岡の専門家',
    priority: 'A',
    keywords: ['管理栄養士', 'ローファット', 'ダイエット', 'パーソナルジム'],
    target: 'ローファット食事法に興味がある人・食事改善とトレーニングを組み合わせたい人',
    must_include: 'ローファット食事法の基礎。管理栄養士視点での正しい取り入れ方。トレーニングとの相乗効果。対談形式パートを挿入',
    related_questions: [
      'ローファットとローカーボはどちらが効果的？',
      '食事制限だけでダイエットはできますか？',
      'パーソナルジムで食事指導も受けられますか？',
      'ローファット中に食べていいものと食べてはいけないものは？',
    ],
  },
  {
    slug: 'pilates-personal-gym',
    title: 'マシンピラティス×パーソナルトレーニング｜組み合わせると何が変わるか',
    category: '福岡の専門家',
    priority: 'A',
    keywords: ['マシンピラティス', 'パーソナルトレーニング', '組み合わせ', '違い'],
    target: 'マシンピラティスに通っているが効果に限界を感じている人',
    must_include: 'ピラティスとパーソナルトレーニングの役割の違い。組み合わせ効果。体性感覚との接続。対談形式パートを挿入',
    related_questions: [
      'ピラティスとパーソナルトレーニングの違いは何ですか？',
      'マシンピラティスをやっているのになぜ姿勢が変わらないことがあるの？',
      'ピラティスからパーソナルトレーニングに切り替えるタイミングは？',
      '両方通うのはコスト的にどうですか？',
    ],
  },

  // ─── Priority B (11) ───────────────────────────────────────
  {
    slug: 'taikan-kankaku-training',
    title: '体性感覚トレーニングとは｜なぜ「感じながら動く」が姿勢改善に効くのか',
    category: 'トレーニング',
    priority: 'B',
    keywords: ['体性感覚', 'トレーニング', '姿勢改善', '機能改善'],
    target: '体性感覚トレーニングに興味がある人・一般的なトレーニングで成果が出なかった人',
    must_include: '体性感覚とは何か（固有受容感覚・触覚・前庭感覚）。なぜ重要か。具体的なトレーニング例と日常への応用',
    related_questions: [
      '体性感覚トレーニングと普通の筋トレの違いは？',
      '体性感覚を鍛えるとどんな効果がありますか？',
      '自宅でもできる体性感覚トレーニングはありますか？',
      '体性感覚トレーニングは何歳からでもできますか？',
    ],
  },
  {
    slug: 'kino-kaizen-personal-training',
    title: '機能改善パーソナルトレーニングとは｜筋トレとの違いと選ぶべき人',
    category: 'トレーニング',
    priority: 'B',
    keywords: ['機能改善', 'パーソナルトレーニング', '筋トレ', '違い'],
    target: '機能改善とは何かを知りたい人・筋トレ以外のアプローチを探している人',
    must_include: '機能改善の定義。筋トレとの比較。向いている人の特徴。5toolgymでの指導事例（匿名）',
    related_questions: [
      '機能改善パーソナルトレーニングはどんな人に向いていますか？',
      '筋トレをしていない人でも機能改善はできますか？',
      '機能改善とリハビリの違いは？',
      '成果が出るまでどのくらいかかりますか？',
    ],
  },
  {
    slug: 'ncca-trainer-toha',
    title: 'NCCA認定トレーナーとは｜資格の内容と選ぶ理由',
    category: 'トレーニング',
    priority: 'B',
    keywords: ['NCCA', '認定トレーナー', '資格', '選び方'],
    target: 'パーソナルトレーナーの資格について知りたい人',
    must_include: 'NCCAとは何か。カリキュラムの特徴。体性感覚・コンディショニング重視の背景。NSCA・NESTAとの比較',
    related_questions: [
      'NCCAとNSCA・NESTAの違いは何ですか？',
      'トレーナー選びで資格は重要ですか？',
      'NCCA講師とはどんな資格ですか？',
      '資格よりも経験が大事では？',
    ],
  },
  {
    slug: 'shisei-kaizen-personal-training-fukuoka',
    title: '姿勢改善パーソナルトレーニング福岡｜猫背・反り腰を根本から整える方法',
    category: '姿勢改善',
    priority: 'B',
    keywords: ['姿勢改善', 'パーソナルトレーニング', '福岡', '猫背'],
    target: '姿勢が悪いと言われている人・猫背や反り腰を改善したい人',
    must_include: '姿勢が悪くなるメカニズム。パーソナルトレーニングで姿勢が改善する理由。具体的な方法論と期間の目安',
    related_questions: [
      '姿勢が悪い原因は筋肉不足だけですか？',
      'ストレッチだけで姿勢は改善できますか？',
      '姿勢改善に必要な期間は？',
      '自宅でできる姿勢改善エクサイズはありますか？',
    ],
  },
  {
    slug: 'desk-work-shisei-kaizen',
    title: 'デスクワーカーの姿勢改善実例｜半年で変わった3つのポイント',
    category: '姿勢改善',
    priority: 'B',
    keywords: ['デスクワーク', '姿勢改善', '実例', '猫背'],
    target: 'デスクワークで肩こり・猫背に悩んでいる人',
    must_include: 'デスクワークで起きやすい姿勢の問題。改善の実例（匿名）。具体的なトレーニングアプローチと日常習慣',
    related_questions: [
      'デスクワークの姿勢を改善するためにまず何をすべきですか？',
      'パソコン作業中にできる姿勢改善習慣は？',
      '姿勢改善に効果的なストレッチのタイミングは？',
      'スタンディングデスクは姿勢改善に効果的ですか？',
    ],
  },
  {
    slug: 'body-tension-shisei',
    title: 'ボディテンションと姿勢の関係｜「力が入らない状態」が姿勢を崩す理由',
    category: '姿勢改善',
    priority: 'B',
    keywords: ['ボディテンション', '姿勢', '体幹', '機能改善'],
    target: '姿勢が崩れる根本原因を知りたい人・トレーニングしても改善しない人',
    must_include: 'ボディテンションとは何か。全身の張力と姿勢の関係。具体的な改善アプローチ',
    related_questions: [
      'ボディテンションとはどういう意味ですか？',
      'ボディテンションが低いとどうなりますか？',
      'ボディテンションを高めるためのトレーニングは？',
      '姿勢改善とボディテンションはどう関係していますか？',
    ],
  },
  {
    slug: 'hirao-eki-personal-gym',
    title: '平尾駅のパーソナルジム比較｜薬院との違いと選ぶポイント',
    category: 'ジム選び',
    priority: 'B',
    keywords: ['平尾駅', 'パーソナルジム', '比較', '福岡'],
    target: '平尾駅周辺でパーソナルジムを探している人',
    must_include: '平尾駅周辺のジム比較。薬院・天神との比較。通いやすさの観点。フェアな比較',
    related_questions: [
      '平尾駅から通えるパーソナルジムは？',
      '平尾から薬院大通駅は何分くらいですか？',
      'パーソナルジムを選ぶときに通いやすさ以外で重要なことは？',
      '平尾エリアで女性向けのパーソナルジムは？',
    ],
  },
  {
    slug: 'tenjin-eki-personal-gym',
    title: '天神駅・天神南のパーソナルジム比較｜福岡の主要エリアで選ぶ',
    category: 'ジム選び',
    priority: 'B',
    keywords: ['天神', 'パーソナルジム', '比較', '福岡'],
    target: '天神エリアでパーソナルジムを探している人',
    must_include: '天神エリアのジム比較。料金帯。目的別おすすめ。5toolgymへのアクセスも紹介。フェアな比較',
    related_questions: [
      '天神駅周辺にパーソナルジムはいくつありますか？',
      '天神のパーソナルジムの料金相場は？',
      '天神から5toolgymまでのアクセスは？',
      '天神エリアで24時間通えるパーソナルジムは？',
    ],
  },
  {
    slug: 'yoga-body-tension',
    title: 'ヨガとパーソナルトレーニングの相乗効果｜柔軟性と機能を同時に高める',
    category: '福岡の専門家',
    priority: 'B',
    keywords: ['ヨガ', 'パーソナルトレーニング', '相乗効果', '柔軟性'],
    target: 'ヨガに通っているが物足りなさを感じている人・ヨガとジムを組み合わせたい人',
    must_include: 'ヨガとパーソナルトレーニングの違い。組み合わせ効果。体性感覚との接続。対談形式パートを挿入',
    related_questions: [
      'ヨガとパーソナルトレーニングはどちらを先に始めるべき？',
      'ヨガで柔軟性がついてもなぜ姿勢が改善しないことがあるの？',
      '両方続けるにはコストがかかる。どうやって判断すればいい？',
      'ヨガインストラクターが推奨するパーソナルトレーニングの種類は？',
    ],
  },
  {
    slug: 'beauty-health-collab',
    title: '美容と健康の交差点｜肌・髪・体型を同時に整えるためのアプローチ',
    category: '福岡の専門家',
    priority: 'B',
    keywords: ['美容', '健康', '体型', 'アプローチ'],
    target: '美容と健康の両立を目指している人',
    must_include: '美容と運動の関係。睡眠・栄養・運動の三角形。具体的なアプローチ。対談形式パートを挿入',
    related_questions: [
      '運動で肌がきれいになるって本当ですか？',
      'ダイエットと美容を両立するためのポイントは？',
      '過度な食事制限が美容に悪影響を与える理由は？',
      '体型改善と美容ケアはどちらを優先すべき？',
    ],
  },
  {
    slug: 'doctor-yobou-igaku',
    title: '予防医学とパーソナルジム｜医師が語る「運動習慣がない人が病気になる理由」',
    category: '福岡の専門家',
    priority: 'B',
    keywords: ['予防医学', 'パーソナルジム', '運動習慣', '医師'],
    target: '健康のために運動を始めようとしている人・予防医学に興味がある人',
    must_include: '予防医学と運動の関係。慢性疾患リスクの低減。医師視点からのパーソナルジム推奨。対談形式パートを挿入',
    related_questions: [
      '運動習慣がない人が病気になりやすい理由は？',
      '予防医学の観点から週何回運動すべきですか？',
      'ジムに通うことで保険料は安くなりますか？',
      'パーソナルトレーニングは医療行為ですか？',
    ],
  },

  // ─── Priority C (9) ────────────────────────────────────────
  {
    slug: 'sorikoshi-kaizen-fukuoka',
    title: '反り腰を整えるトレーニング｜福岡のパーソナルトレーナーが解説する根本原因',
    category: '姿勢改善',
    priority: 'C',
    keywords: ['反り腰', '改善', 'トレーニング', '福岡'],
    target: '反り腰で腰痛に悩んでいる人',
    must_include: '反り腰のメカニズム。悪化する日常習慣。整えるためのエクサイズ5選。専門家の指導の重要性',
    related_questions: [
      '反り腰は自分で直せますか？',
      '反り腰と腰痛の関係は？',
      '反り腰を整えるストレッチはありますか？',
      '反り腰改善にはどのくらいの期間がかかりますか？',
    ],
  },
  {
    slug: 'katakori-shisei-kaizen-fukuoka',
    title: '肩こりと姿勢の関係｜福岡のトレーナーが教える根本から整える方法',
    category: '姿勢改善',
    priority: 'C',
    keywords: ['肩こり', '姿勢改善', '福岡', 'トレーニング'],
    target: '慢性的な肩こりに悩んでいる人',
    must_include: '肩こりと姿勢の関係（胸椎・肩甲骨）。整えるためのトレーニング。デスクワーカー向け実践例',
    related_questions: [
      '肩こりの根本原因は何ですか？',
      'マッサージに行っても肩こりが再発する理由は？',
      '肩こりに効くストレッチは？',
      'パーソナルジムで肩こりは改善できますか？',
    ],
  },
  {
    slug: 'josei-diet-fukuoka-personal',
    title: '女性のダイエットにパーソナルジムが向いている理由｜福岡の事例から',
    category: 'ダイエット',
    priority: 'C',
    keywords: ['女性', 'ダイエット', 'パーソナルジム', '福岡'],
    target: '女性でダイエットを考えている人・一人では続かない人',
    must_include: '女性特有のダイエットの難しさ。ホルモンの影響。パーソナルジムのサポートの価値。匿名事例',
    related_questions: [
      '女性のダイエットが難しい理由は何ですか？',
      '生理周期とダイエットの関係は？',
      'パーソナルジムで短期間でどのくらい変わりますか？',
      '女性でも筋トレすると体が大きくなりますか？',
    ],
  },
  {
    slug: '40dai-shisei-diet',
    title: '40代の姿勢とダイエット｜「若い頃と同じ方法が通用しない」理由',
    category: 'ダイエット',
    priority: 'C',
    keywords: ['40代', '姿勢', 'ダイエット', '代謝'],
    target: '40代で体型の変化を感じている人',
    must_include: '40代の身体の変化（代謝・ホルモン・筋肉量）。若い頃との違い。40代に合ったアプローチ',
    related_questions: [
      '40代から運動を始めるのは遅いですか？',
      '40代でダイエットが難しくなる理由は？',
      '40代に適したトレーニング強度は？',
      '更年期のダイエットで気をつけることは？',
    ],
  },
  {
    slug: 'taiken-kogo-shinai-checklist',
    title: 'パーソナルジムの体験で後悔しない5つの確認事項',
    category: 'ジム選び',
    priority: 'C',
    keywords: ['パーソナルジム', '体験', '確認事項', '後悔しない'],
    target: 'パーソナルジムの体験に行く前に確認したい人',
    must_include: '体験で確認すべき5つのポイント。よくある失敗パターン。5toolgymでの体験の透明性をフェアに説明',
    related_questions: [
      'パーソナルジムの体験で聞くべき質問は？',
      '体験後に断りにくくなりませんか？',
      '体験料金は入会後に返金されますか？',
      '体験だけで効果はわかりますか？',
    ],
  },
  {
    slug: 'pfc-lowfat-shokuji',
    title: 'PFCバランスとローファット食事法｜パーソナルトレーナーが教える基本の食事戦略',
    category: '栄養・食事',
    priority: 'C',
    keywords: ['PFC', 'ローファット', '食事法', 'ダイエット'],
    target: '食事改善でダイエットしたい人・PFCバランスを知りたい人',
    must_include: 'PFCとは何か。ローファットの基本。トレーニングと組み合わせる際のポイント。外食での実践例',
    related_questions: [
      'PFCバランスとは何ですか？',
      'ローファットダイエットで食べてはいけないものは？',
      'タンパク質はどのくらい摂ればいいですか？',
      '外食でもPFCバランスを意識できますか？',
    ],
  },
  {
    slug: 'taikan-training-shisei',
    title: '体幹トレーニングで姿勢が整う本当の理由｜プランクだけではダメな理由',
    category: 'トレーニング',
    priority: 'C',
    keywords: ['体幹トレーニング', '姿勢改善', 'プランク', '機能改善'],
    target: '体幹トレーニングをしているが姿勢が変わらない人',
    must_include: '体幹の正しい定義。プランクの限界。姿勢改善に必要な動的な体幹トレーニング。具体例',
    related_questions: [
      'プランクをやっても姿勢が改善しない理由は？',
      '体幹とコアの違いは？',
      '体幹トレーニングをやりすぎると逆効果になりますか？',
      '動的な体幹トレーニングの例を教えてください',
    ],
  },
  {
    slug: 'squat-hiza-itami',
    title: 'スクワットで膝が痛い原因と解決策｜フォームと体性感覚の視点から',
    category: 'トレーニング',
    priority: 'C',
    keywords: ['スクワット', '膝痛', 'フォーム', '体性感覚'],
    target: 'スクワットで膝に痛みを感じる人',
    must_include: '膝痛の原因（アライメント・体性感覚の欠如）。フォームのチェック方法。整えるためのエクサイズ',
    related_questions: [
      'スクワットで膝が痛くなるのはフォームが悪いから？',
      '膝痛があってもスクワットはできますか？',
      'スクワットの代わりにできるトレーニングは？',
      '膝痛の改善にはどのくらいかかりますか？',
    ],
  },
  {
    slug: 'walking-shisei-kaizen',
    title: '歩き方で姿勢が変わる｜ウォーキングフォームを整えるだけで変わること',
    category: '姿勢改善',
    priority: 'C',
    keywords: ['ウォーキング', '姿勢改善', '歩き方', '体性感覚'],
    target: 'ウォーキングで姿勢を整えたい人・歩くと疲れやすい人',
    must_include: '歩き方と姿勢の関係。ウォーキングフォームの整え方。体性感覚を使った歩き方の改善',
    related_questions: [
      '歩き方を変えるにはどうすればいいですか？',
      'ウォーキングは姿勢改善に効果がありますか？',
      '靴選びと姿勢の関係は？',
      '毎日何歩歩けば健康になりますか？',
    ],
  },
];

// ============================================================
// GENERATION LOGIC
// ============================================================
function getUngeneratedThemes() {
  if (!fs.existsSync(ARTICLES_DIR)) fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  const existing = new Set(
    fs.readdirSync(ARTICLES_DIR)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''))
  );
  return ARTICLE_THEMES.filter(t => !existing.has(t.slug));
}

function selectNextTheme(ungenerated) {
  for (const p of ['A', 'B', 'C']) {
    const theme = ungenerated.find(t => t.priority === p);
    if (theme) return theme;
  }
  return null;
}

function buildPrompt(theme) {
  const today = new Date().toISOString().split('T')[0];
  const isExpert = theme.category === '福岡の専門家';
  const isGymComp = theme.category === 'ジム選び' && (
    theme.slug.includes('eki') || theme.slug.includes('chuo')
  );

  const expertInstructions = isExpert ? `
【専門家コラボ記事の追加要件】
- 記事中盤に対談形式のパートを入れる（「── 柴山：〜」「── 専門家：〜」形式）
- 専門家の名前・役職は架空でよい
- 末尾近くに「※本記事は取材・対談をもとに構成しています」の注記を入れる
- front-matterにexpert_name・expert_roleを含める` : '';

  const comparisonInstructions = isGymComp ? `
【比較記事の追加要件】
- 他ジムも公正に紹介する（ジム名は架空でよいがURLはhttps://example.comでよい）
- 比較軸: ①指導の専門性②完全マンツーマンか③設備④料金⑤24時間利用
- 「5toolgymが最高」とは書かない。フェアな比較で読者の信頼を得る` : '';

  return `あなたは柴山智幸（しばやまともゆき）です。福岡でパーソナルトレーニングジム「5toolgym」（薬院店・赤坂店）を経営しているオーナートレーナーで、NCCA（全日本コンディショニングコーチ協会）の講師資格を持っています。専門は体性感覚トレーニングと機能改善指導。ジム哲学は「楽に、強く、心地よく」。

以下の仕様でMarkdown記事を書いてください。

## 記事情報
- タイトル: ${theme.title}
- カテゴリ: ${theme.category}
- 対象読者: ${theme.target}
- キーワード: ${theme.keywords.join('、')}
- 必ず含める内容: ${theme.must_include}

## 文章要件
- 文字数: 4500〜5500文字（本文のみ。front-matter・見出しを除く）
- です・ます調、専門家だが親しみやすいトーン
- 「正しい体の使い方」という表現は使わない（「カラダの動きを整える」等に言い換える）
- 競技・ストイック・意識高い系のトーンは避ける
- 日常の場面で語る（横断歩道・旅行・荷物・翌日など）
- 「絶対」「必ず改善」等の薬機法・景表法に抵触する断言表現は使わない

## 構成要件
1. 冒頭に「この記事でわかること」箇条書き（3〜5項目）
2. h2が5〜7個、各h2の下にh3が2〜3個
3. 体性感覚・機能改善の専門的視点を随所に自然に挿入
4. 「楽に、強く、心地よく」をどこかに1〜2箇所自然に挿入
5. 末尾に「## よくある質問」セクション（FAQ4問、各回答200文字以上）
   - 各質問は「### Q: 質問文」の形式で書く
${expertInstructions}${comparisonInstructions}

## FAQ（必ず以下の質問を使う）
${theme.related_questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

## front-matter（記事の先頭に必ずこれを付ける）
\`\`\`
---
title: "${theme.title}"
slug: "${theme.slug}"
category: "${theme.category}"
description: "（記事内容から120〜160文字のメタディスクリプションを生成）"
date: "${today}"
author: "柴山智幸"
${isExpert ? `expert_name: "（専門家の氏名・架空でよい）"\nexpert_role: "（専門家の役職・架空でよい）"` : ''}
---
\`\`\`

front-matterから始まり、全文Markdownで出力してください。HTMLタグは使わないこと。`;
}

async function generateArticle() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is not set.');
    process.exit(1);
  }

  const ungenerated = getUngeneratedThemes();
  if (ungenerated.length === 0) {
    console.log('All 30 themes have been generated!');
    return;
  }

  const theme = selectNextTheme(ungenerated);
  console.log(`\nGenerating: [Priority ${theme.priority}] ${theme.title}`);
  console.log(`Remaining: ${ungenerated.length} theme(s)\n`);

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    messages: [{ role: 'user', content: buildPrompt(theme) }],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude API');

  const text = block.text;
  const outPath = path.join(ARTICLES_DIR, `${theme.slug}.md`);
  fs.writeFileSync(outPath, text, 'utf8');

  console.log(`✓ Saved: articles/${theme.slug}.md`);
  console.log(`  Characters: ${text.length}`);
  console.log(`  Tokens used: input=${message.usage.input_tokens} output=${message.usage.output_tokens}`);
}

generateArticle().catch(err => {
  console.error('Generation failed:', err.message);
  process.exit(1);
});
