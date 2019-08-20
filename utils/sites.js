module.exports = [
  {
    host: /(www\.)?nzherald\.co\.nz/,
    publisher: 'NZ Herald',
    premium: ' Premium',
    selectors: {
      authorName: '.author-title,.author span',
      content: '.full-content,.premium-content',
      title: 'h1',
      publisher: '.syndicator-name',
      premium: '.premium-content',
      bad: '.related-header,.related-articles-container,.ad-container'
    }
  },
  {
    host: /(www\.)?stuff\.co\.nz/,
    publisher: 'Stuff',
    premium: '',
    selectors: {
      authorName: '.sics-component__byline__author',
      content: '.sics-component__story',
      title: 'h1',
      publisher: '.sics-component__story__source',
      premium: '',
      bad: '.sics-component__story__source,.sics-component__sharebar'
    }
  },
  {
    host: /(www\.)?r(adio)?nz\.co\.nz/,
    publisher: 'Radio NZ',
    premium: '',
    selectors: {
      authorName: '.author-name',
      content: '.article__body',
      title: 'h1',
      publisher: '.prog-name',
      premium: '',
      bad: ''
    }
  },
  {
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
    }
  },
  {
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
    }
  }
];
