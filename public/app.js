(function() {
  'use strict';

  var gallery = document.getElementById('gallery');

  var fortunes = [
    "A journey of a thousand miles begins with a single step.",
    "Fortune favors the bold.",
    "The best time to plant a tree was twenty years ago. The second best time is now.",
    "Your patience will be rewarded.",
    "Good things come to those who wait.",
    "A smile is your passport into the hearts of others.",
    "The only way to do great work is to love what you do.",
    "Believe you can and you're halfway there.",
    "Every moment is a fresh beginning.",
    "What you seek is seeking you.",
    "The obstacle is the path.",
    "Be the change you wish to see in the world.",
    "In the middle of difficulty lies opportunity.",
    "Your future is created by what you do today.",
    "The quieter you become, the more you can hear.",
    "Do not wait to strike till the iron is hot; make it hot by striking.",
    "A person who never made a mistake never tried anything new.",
    "The best revenge is massive success.",
    "Life is what happens when you're busy making other plans.",
    "Stay hungry. Stay foolish."
  ];

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

      // Add fortune cookie saying
      var fortuneIndex = Math.floor(Math.random() * fortunes.length);
      var fortuneText = fortunes[fortuneIndex];

      var fortuneContainer = document.createElement('div');
      fortuneContainer.className = 'fortune';

      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 100 12');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.style.width = '100%';
      svg.style.height = 'auto';
      svg.style.display = 'block';

      var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', '10');
      text.setAttribute('font-family', 'Arial, sans-serif');
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('font-size', '10');
      text.setAttribute('fill', '#000');
      text.setAttribute('textLength', '100');
      text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
      text.textContent = fortuneText;

      svg.appendChild(text);
      fortuneContainer.appendChild(svg);
      gallery.appendChild(fortuneContainer);
    })
    .catch(function(err) {
      console.error('Failed to load images:', err);
    });
})();
