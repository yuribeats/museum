(function() {
  'use strict';

  function updateBtcPrice() {
    fetch('https://api.coindesk.com/v1/bpi/currentprice/USD.json')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var price = Math.round(data.bpi.USD.rate_float).toLocaleString();
        document.getElementById('btc-text').textContent = 'BTC: $' + price;
      })
      .catch(function() {
        document.getElementById('btc-text').textContent = 'BTC: ---';
      });
  }
  updateBtcPrice();
  setInterval(updateBtcPrice, 60000);

  fetch('/fortunes.txt')
    .then(function(res) { return res.text(); })
    .then(function(text) {
      var fortunes = text.split('%').map(function(f) { return f.trim(); }).filter(Boolean);
      var fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
      var fortuneDiv = document.getElementById('fortune');
      
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 100 20');
      svg.setAttribute('preserveAspectRatio', 'none');
      
      var textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textEl.setAttribute('x', '0');
      textEl.setAttribute('y', '16');
      textEl.setAttribute('font-family', 'Arial Black, Arial, sans-serif');
      textEl.setAttribute('font-weight', '900');
      textEl.setAttribute('font-size', '14');
      textEl.setAttribute('fill', '#000');
      textEl.setAttribute('textLength', '100');
      textEl.setAttribute('lengthAdjust', 'spacingAndGlyphs');
      textEl.textContent = fortune.replace(/\n/g, ' ').replace(/\s+/g, ' ');
      
      svg.appendChild(textEl);
      fortuneDiv.appendChild(svg);
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
