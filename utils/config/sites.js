module.exports = [
  {
    userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
    host: /(www\.)?newshub\.co\.nz/,
    publisher: 'Newshub',
    premium: '',
    selectors: {
      authorName: 'article .c-ArticleHeader-authorName',
      content: 'article .c-ArticleBody',
      title: 'article h1.c-ArticleHeader-title',
      publisher: '',
      premium: '',
      bad: '.AdWrapper,.video-js :not(video)'
    },
    timeout: 30000,
    waitUntil: 'domcontentloaded'
  },
  {
    userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
    host: /(www\.)?newsroom\.co\.nz/,
    publisher: 'Newsroom',
    premium: '',
    selectors: {
      authorName: '.content-author a h3',
      content: '.article_content',
      title: 'h1',
      publisher: '',
      premium: '',
      bad: 'h1'
    },
    timeout: 30000,
    waitUntil: 'domcontentloaded'
  },
  {
    userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
    host: /(www\.)?noted\.co\.nz/,
    publisher: 'Noted',
    premium: '',
    selectors: {
      authorName: '.article-container .author',
      content: '.article-container',
      title: '.article-container h1',
      publisher: '',
      premium: '',
      bad: '.article-details,.article-byline,.tag-list-content,.article-social-share'
    },
    timeout: 30000,
    waitUntil: 'domcontentloaded'
  },
  {
    userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
    host: /(www\.)?nzherald\.co\.nz/,
    publisher: 'NZ Herald',
    premium: ' Premium',
    selectors: {
      authorName: '.author-title,.author span',
      content: '.full-content',
      title: 'h1',
      publisher: '.syndicator-name',
      premium: '.premium-content',
      bad: '.related-header,.related-articles-container,.ad-container,.video-js :not(video)'
    },
    timeout: 60000,
    waitUntil: 'networkidle0'
  },
  {
    userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
    host: /(www\.)?r(adio)?nz\.co\.nz/,
    publisher: 'Radio NZ',
    premium: '',
    selectors: {
      authorName: '.author-name',
      content: '.article__body',
      title: 'h1',
      publisher: '.prog-name',
      premium: '',
      bad: '.c-play-controller'
    },
    timeout: 30000,
    waitUntil: 'domcontentloaded'
  },
  {
    userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
    host: /(www\.)?stuff\.co\.nz/,
    publisher: 'Stuff',
    premium: '',
    selectors: {
      authorName: '.sics-component__byline__author',
      content: '.sics-component__story',
      title: 'h1',
      publisher: '.sics-component__story__source',
      premium: '',
      bad: [
        '.sics-component__story__source',
        '.sics-component__sharebar',
        '.bigbyline-container',
        '.video-js :not(video)',
        '.display-ad--border-container'
      ].join(',')
    },
    timeout: 60000,
    waitUntil: 'networkidle0'
  },
  {
    userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
    host: /(www\.)?thespinoff\.co\.nz/,
    publisher: 'The Spinoff',
    premium: '',
    selectors: {
      authorName: 'article.post .entry-inner .entry-meta .author',
      content: 'article.post .entry-inner .entry-content',
      title: 'article.post .entry-inner .entry-title',
      publisher: '',
      premium: '',
      bad: '.the-spinoff-club-interruptive,#mc_embed_signup'
    },
    timeout: 30000,
    waitUntil: 'domcontentloaded'
  },
  {
    userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
    host: /(www\.)?odt\.co\.nz/,
    publisher: 'Otago Daily Times',
    premium: '',
    selectors: {
      authorName: '.byline a,.byline',
      content: 'article.node-story ',
      title: 'h1.page-header',
      publisher: '',
      premium: '',
      bad: [
        '.pane-odt-promotion-promoted-items',
        '.breadcrumb-wrapper',
        '.share-icons-header',
        '.sharethis-buttons',
        '.byline,header',
        'footer',
        '#related-stories',
        '.comment-count-footer',
        '.comment-wrapper'
      ].join(',')
    },
    timeout: 30000,
    waitUntil: 'domcontentloaded'
  },
  {
    userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
    host: /(www\.)?theguardian\.com/,
    publisher: 'The Guardian',
    premium: '',
    selectors: {
      authorName: '.byline',
      content: '.content__article-body',
      title: 'h1.content__headline',
      publisher: '',
      premium: '',
      bad: ['.contributions__epic', 'aside', '.submeta'].join(',')
    },
    timeout: 30000,
    waitUntil: 'domcontentloaded'
  }
];
