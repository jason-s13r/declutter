(function() {
  document.querySelector('form').addEventListener('submit', e => {
    e.preventDefault();
    document.querySelector('html').classList.add('is-loading');
    document.querySelector('html').classList.remove('is-error');
    fetch('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: e.target.url.value
      })
    })
      .then(response => {
        if (response.ok) {
          return response.text();
        }
        throw response.status;
      })
      .then(url => {
        window.location = url;
      })
      .catch(status => {
        let message = 'ERROR';

        switch (status) {
          case 400:
            message = 'Unsupported website.';
            break;
        }

        document.querySelector('.error').innerText = message;
        document.querySelector('html').classList.add('is-error');
        document.querySelector('html').classList.remove('is-loading');
      });
  });

  const query = window.location.search
    .substring(1)
    .split('&')
    .reduce((m, p) => {
      const [key, value] = p.split('=');
      return {
        ...m,
        [key]: decodeURIComponent(value)
      };
    }, {});
  if (!query.url) {
    return;
  }
  document.querySelector('input[name="url"]').value = query.url;
  document.querySelector('button').click();
})();
