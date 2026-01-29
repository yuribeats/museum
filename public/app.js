(function() {
  'use strict';

  var LIMIT = 20;
  var offset = 0;
  var loading = false;
  var allLoaded = false;
  var allImages = [];

  var gallery = document.getElementById('gallery');
  var loader = document.getElementById('loader');
  var sentinel = document.getElementById('sentinel');

  function renderBatch() {
    if (loading || allLoaded) return;
    loading = true;
    loader.classList.remove('hidden');

    var batch = allImages.slice(offset, offset + LIMIT);
    
    if (batch.length === 0) {
      allLoaded = true;
      loader.classList.add('hidden');
      loading = false;
      return;
    }

    var fragment = document.createDocumentFragment();

    batch.forEach(function(imageData) {
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
    offset += batch.length;

    if (offset >= allImages.length) {
      allLoaded = true;
    }

    loading = false;
    loader.classList.add('hidden');
  }

  fetch('/images.json')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      allImages = data.images || [];
      renderBatch();
    })
    .catch(function(err) {
      console.error('Failed to load images:', err);
    });

  var observer = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting && !loading && !allLoaded) {
      renderBatch();
    }
  }, { rootMargin: '400px' });

  observer.observe(sentinel);
})();
