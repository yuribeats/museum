(function() {
  'use strict';

  fetch('/fortunes.txt')
    .then(function(res) { return res.text(); })
    .then(function(text) {
      var fortunes = text.split('%').map(function(f) { return f.trim(); }).filter(Boolean);
      var fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
      var fortuneDiv = document.getElementById('fortune');
      fortuneDiv.textContent = fortune.replace(/\n/g, ' ').replace(/\s+/g, ' ').toUpperCase();
    });

  var gallery = document.getElementById('gallery');

  fetch('/images.json')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var images = data.images || [];
      if (images.length === 0) return;
      
      var randomIndex = Math.floor(Math.random() * images.length);
      var imageData = images[randomIndex];
      
      var tile = document.createElement('div');
      tile.className = 'tile';
      tile.style.cursor = 'pointer';
      tile.onclick = function() { location.reload(); };

      var img = document.createElement('img');
      img.src = imageData.url;
      img.alt = imageData.name || '';

      img.onerror = function() {
        tile.classList.add('error');
      };

      tile.appendChild(img);
      gallery.appendChild(tile);
    });
})();
