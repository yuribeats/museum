(function() {
  'use strict';

  var LIMIT = 20;
  var offset = 0;
  var loading = false;
  var allLoaded = false;
  var retryCount = 0;
  var MAX_RETRIES = 3;

  var gallery = document.getElementById('gallery');
  var loader = document.getElementById('loader');
  var sentinel = document.getElementById('sentinel');

  if (!gallery || !loader || !sentinel) {
    console.error('Museum: Required elements not found');
    return;
  }

  function loadImages() {
    if (loading || allLoaded) return;

    loading = true;
    loader.classList.remove('hidden');

    var url = '/api/images?offset=' + offset + '&limit=' + LIMIT;

    fetch(url)
      .then(function(response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json();
      })
      .then(function(data) {
        retryCount = 0;

        if (!data.images || data.images.length === 0) {
          allLoaded = true;
          loader.classList.add('hidden');
          return;
        }

        var fragment = document.createDocumentFragment();

        data.images.forEach(function(imageData) {
          var tile = document.createElement('div');
          tile.className = 'tile';

          var img = document.createElement('img');
          img.src = imageData.url;
          img.alt = imageData.name || '';
          img.loading = 'lazy';
          img.decoding = 'async';

          img.onerror = function() {
            tile.classList.add('error');
          };

          tile.appendChild(img);
          fragment.appendChild(tile);
        });

        gallery.appendChild(fragment);
        offset += data.images.length;

        if (offset >= data.total) {
          allLoaded = true;
        }
      })
      .catch(function(error) {
        console.error('Museum: Failed to load images:', error.message);
        retryCount++;

        if (retryCount < MAX_RETRIES) {
          setTimeout(function() {
            loading = false;
            loadImages();
          }, 1000 * retryCount);
          return;
        }
      })
      .finally(function() {
        loading = false;
        loader.classList.add('hidden');
      });
  }

  var observer = new IntersectionObserver(
    function(entries) {
      if (entries[0].isIntersecting && !loading && !allLoaded) {
        loadImages();
      }
    },
    {
      rootMargin: '400px',
      threshold: 0
    }
  );

  observer.observe(sentinel);

  loadImages();
})();
