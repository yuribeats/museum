(function() {
  'use strict';

  fetch('/fortunes.txt')
    .then(function(res) { return res.text(); })
    .then(function(text) {
      var fortunes = text.split('%').map(function(f) { return f.trim(); }).filter(Boolean);
      var fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
      
      // Remove emdash and everything after it
      fortune = fortune.split('―')[0].split('—')[0].split('--')[0].trim();
      
      // Remove quotes and periods
      fortune = fortune.replace(/"/g, '').replace(/"/g, '').replace(/"/g, '').replace(/\./g, '');
      
      var fortuneText = fortune.replace(/\n/g, ' ').replace(/\s+/g, ' ').toUpperCase();
      
      var fortuneDiv = document.getElementById('fortune');
      fortuneDiv.innerHTML = '';
      
      var words = fortuneText.split(' ');
      var lines = [];
      
      // Max 5 words per line
      for (var i = 0; i < words.length; i += 5) {
        var line = words.slice(i, i + 5).join(' ');
        lines.push(line);
      }
      
      // Create SVG for only the final line
      var lastLine = lines[lines.length - 1];
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 100 12');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.style.width = '100%';
      svg.style.height = 'auto';
      svg.style.display = 'block';
      
      var textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textEl.setAttribute('x', '0');
      textEl.setAttribute('y', '10');
      textEl.setAttribute('font-family', 'Arial Black, Arial, sans-serif');
      textEl.setAttribute('font-weight', '900');
      textEl.setAttribute('font-size', '12');
      textEl.setAttribute('fill', '#000');
      textEl.setAttribute('textLength', '100');
      textEl.setAttribute('lengthAdjust', 'spacingAndGlyphs');
      textEl.textContent = lastLine;
      
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
