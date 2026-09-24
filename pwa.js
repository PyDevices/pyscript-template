(function () {
  var installButton = document.getElementById('install');
  var deferredPrompt = null;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', {scope: './'}).catch(console.error);
    // Hand the worker what this page already loaded (see sw.js 'message').
    // Twice: once when it is ready, and again after the app has had time to
    // pull its packages.
    var sendLoaded = function () {
      navigator.serviceWorker.ready.then(function (registration) {
        if (!registration.active) return;
        var urls = performance.getEntriesByType('resource').map(function (entry) {
          return entry.name;
        }).filter(function (url) {
          return url.indexOf('http') === 0;
        });
        urls.push(location.href);
        registration.active.postMessage({type: 'cache-urls', urls: urls});
      });
    };
    sendLoaded();
    window.addEventListener('load', function () { setTimeout(sendLoaded, 15000); });
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener('click', function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.finally(function () {
      deferredPrompt = null;
      installButton.hidden = true;
    });
  });

  // main.py may say what it is doing; if it does not (an example dropped in
  // as main.py), do not leave "Loading Python…" up once the script has run.
  window.addEventListener('py:all-done', function () {
    var status = document.getElementById('status');
    if (status && status.textContent === 'Loading Python…') status.textContent = 'Running.';
  });

  window.addEventListener('appinstalled', function () {
    installButton.hidden = true;
  });
})();
