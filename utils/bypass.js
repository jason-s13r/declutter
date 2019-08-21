module.exports = async tab => {
  await tab.evaluate(() => {
    (function() {
      const loopParse = (json, iterations) => {
        try {
          return JSON.parse(json);
        } catch (e) {
          let column = 0;
          let m = e.message.match(/position (\d+) ?/);
          if (m) {
            column = Number(m[1]);
          } else {
            m = e.message.match(/column (\d+) ?/);
            column = Number(m[1]) - 1;
          }
          const left = json.substring(0, column).replace(/,$/, '');
          const right = json.substring(column + 1);
          if (iterations <= 0) {
            return null;
          }
          return loopParse(left + right, iterations - 1);
        }
      };
      const ldParse = text => {
        const input = text.replace(/[\r\n]/g, '');
        const schemaInput = input.replace(/[\ ]/g, '');
        const schema = loopParse(schemaInput, schemaInput.length + 1);
        const json = loopParse(input, input.length + 1);
        if (!json) {
          return schema;
        }
        if (!schema) {
          return json;
        }
        return {
          ...json,
          '@context': schema['@context'],
          '@type': schema['@type']
        };
      };
      const ld = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map(e => ldParse(e.textContent))
        .find(l => {
          if (!l) {
            return false;
          }
          const isSchema = l['@context'] === 'http://schema.org';
          const isArticle = l['@type'] === 'Article';
          const hasPart = l.hasOwnProperty('hasPart');
          return isSchema && isArticle && hasPart;
        });

      const content = document.querySelector('.premium-content');

      if (!ld || !content) {
        return;
      }

      const selector = ld.hasPart.cssSelector;
      const inserted = content.parentElement.insertBefore(content.cloneNode(true), content);
      const [displayed, hidden] = [content, inserted];

      displayed.style.marginBottom = '75px';
      displayed.removeAttribute('id');
      displayed.classList.replace('premium-content', 'full-content');
      Array.from(displayed.querySelectorAll(selector)).forEach(e => {
        e.classList.remove(selector.substring(1));
        e.style = '';
      });

      hidden.style.opacity = 0.1;
      hidden.style.height = '1px';
      hidden.style.overflow = 'hidden';
    })();
  });
  await tab.waitFor(2000);
  await tab.waitForSelector('.full-content .loaded');
};
