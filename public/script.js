(function () {
  document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    document.querySelector("html").classList.add("is-loading");
    document.querySelector("html").classList.remove("is-error");
    fetch("/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: e.target.url.value,
      }),
    })
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw response.statusText;
      })
      .then((url) => {
        window.location = url;
      })
      .catch((status) => {
        console.log("status", status);
        document.querySelector(".error").innerText = (status || "")
          .replace(/Gateway/i, "")
          .trim();
        document.querySelector("html").classList.add("is-error");
        document.querySelector("html").classList.remove("is-loading");
      });
  });

  const query = window.location.search
    .substring(1)
    .split("&")
    .reduce((m, p) => {
      const [key, value] = p.split("=");
      return {
        ...m,
        [key]: decodeURIComponent(value),
      };
    }, {});
  if (!query.url) {
    return;
  }
  document.querySelector('input[name="url"]').value = query.url;
  document.querySelector("button").click();
})();

(function () {
  function fetchLinks() {
    return fetch("/keys")
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
        const list = pages.reverse().slice(0, 10);
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
          if (page.title.length > 75) {
            title.innerText = page.title.substring(0, 75) + "...";
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
