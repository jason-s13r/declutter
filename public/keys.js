(function () {
  function fetchLinks() {
    return fetch("/keys.json")
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw response.statusText;
      })
      .then((pages) => {
        if (!pages) {
          return;
        }
        const list = pages.reverse();
        const section = document.querySelector("section.submitted-links");
        section.innerHTML = "";
        for (const page of list) {
          if (!page) {
            continue;
          }
          const article = document.createElement("article");
          const title = document.createElement("a");
          title.classList.add("is-title");
          title.innerText = page.title;
          title.title = page.title;
          if (page.title.length > 140) {
            title.innerText = page.title.substring(0, 140) + "...";
          }
          title.href = page.url;

          const publisher = document.createElement("a");
          publisher.classList.add("is-publisher");
          publisher.innerText = new URL(page.author_url).host;
          publisher.href = page.author_url;
          publisher.title = page.author_url;

          article.appendChild(title);
          article.appendChild(publisher);
          section.appendChild(article);
        }
      })
      .catch(() => {
        document.querySelector("section.submitted-links").innerHTML = "";
      });
  }

  fetchLinks().then(() => {
    setInterval(fetchLinks, 5 * 60 * 1000);
  });
})();
