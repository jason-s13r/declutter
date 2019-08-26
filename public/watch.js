(function() {
  document.querySelector('form').addEventListener('submit', e => {
    e.preventDefault();
    document.querySelector('html').classList.add('is-loading');
    document.querySelector('html').classList.remove('is-error');
    document.querySelector('html').classList.remove('is-playing');
    videojs('decluttered-video') && videojs('decluttered-video').pause();
    fetch('/watch', {
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
          return response.json();
        }
        throw response.statusText;
      })
      .then(details => {
        console.log('stream', details);
        const player = videojs('decluttered-video');
        player.src({
          src: details.streams[0] || ''
        });
        const overlay = `<div><h1>${[details.title, details.publisher]
          .filter(f => !!f && !!f.trim())
          .join(' &mdash; ')}</h2></div>`;
        player.overlay({
          overlays: [
            {
              start: 'loadstart',
              content: overlay,
              end: 'playing',
              align: 'top'
            },
            {
              start: 'pause',
              content: overlay,
              end: 'playing',
              align: 'top'
            }
          ]
        });
        player.play();
        document.querySelector('h1').innerText = details.title;
        document.querySelector('html').classList.add('is-playing');
        document.querySelector('html').classList.remove('is-loading');
      })
      .catch(status => {
        videojs('decluttered-video') && videojs('decluttered-video').pause();
        document.querySelector('.error').innerText = status;
        document.querySelector('html').classList.add('is-error');
        document.querySelector('html').classList.remove('is-loading');
        document.querySelector('html').classList.remove('is-playing');
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
