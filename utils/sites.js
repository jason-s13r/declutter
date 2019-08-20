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
  }
];
