(function() {
  'use strict';

  // Load html2canvas
  var script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  document.head.appendChild(script);

  fetch('/fortunes.txt')
    .then(function(res) { return res.text(); })
    .then(function(text) {
      var fortunes = text.split('%').map(function(f) { return f.trim(); }).filter(Boolean);
      var fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
      
      fortune = fortune.split('―')[0].split('—')[0].split('--')[0].trim();
      
      // Remove all characters except letters and spaces
      fortune = fortune.replace(/[^a-zA-Z\s]/g, ' ');
      
      var fortuneText = fortune.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
      
      var fortuneDiv = document.getElementById('fortune');
      fortuneDiv.innerHTML = '';
      
      var words = fortuneText.split(' ');
      var lines = [];
      
      for (var i = 0; i < words.length; i += 5) {
        var line = words.slice(i, i + 5).join(' ');
        lines.push(line);
      }
      
      var lastLine = lines[lines.length - 1];
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 100 22');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.style.width = '100%';
      svg.style.height = 'auto';
      svg.style.display = 'block';
      svg.style.opacity = '0';
      svg.style.transform = 'translateY(8px)';
      svg.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      
      var textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textEl.setAttribute('x', '0');
      textEl.setAttribute('y', '19');
      textEl.setAttribute('font-family', 'Arial Black, Arial, sans-serif');
      textEl.setAttribute('font-weight', '900');
      textEl.setAttribute('font-size', '22');
      textEl.setAttribute('fill', '#000');
      textEl.setAttribute('textLength', '100');
      textEl.setAttribute('lengthAdjust', 'spacingAndGlyphs');
      textEl.textContent = lastLine;
      
      svg.appendChild(textEl);
      fortuneDiv.appendChild(svg);
      
      setTimeout(function() {
        svg.style.opacity = '1';
        svg.style.transform = 'translateY(0)';
      }, 400);
    });

  var gallery = document.getElementById('gallery');
  var header = document.querySelector('header');

  // Screenshot function
  function takeScreenshot() {
    if (typeof html2canvas === 'undefined') return;
    
    // Flash effect
    var flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;opacity:0;z-index:9999;pointer-events:none;transition:opacity 0.1s';
    document.body.appendChild(flash);
    
    requestAnimationFrame(function() {
      flash.style.opacity = '1';
      setTimeout(function() {
        flash.style.opacity = '0';
        setTimeout(function() {
          flash.remove();
        }, 100);
      }, 100);
    });
    
    html2canvas(document.body, {
      backgroundColor: '#ffffff',
      scale: 2
    }).then(function(canvas) {
      var link = document.createElement('a');
      link.download = 'public-' + Date.now() + '.png';
      link.href = canvas.toDataURL();
      link.click();
    });
  }

  // Click header to screenshot
  header.style.cursor = 'pointer';
  header.onclick = takeScreenshot;

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
      tile.style.overflow = 'hidden';
      
      var img = document.createElement('img');
      img.src = imageData.url;
      img.alt = imageData.name || '';
      
      img.style.opacity = '0';
      img.style.transform = 'scale(0.96)';
      img.style.transformOrigin = 'center center';
      img.style.transition = 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
      
      img.onload = function() {
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            img.style.opacity = '1';
            img.style.transform = 'scale(1)';
          });
        });
      };
      
      // Click image: scale down, fade out, then reload
      tile.onclick = function() {
        img.style.opacity = '0';
        img.style.transform = 'scale(0.98)';
        img.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        
        var fortuneSvg = document.querySelector('#fortune svg');
        if (fortuneSvg) {
          fortuneSvg.style.opacity = '0';
          fortuneSvg.style.transform = 'translateY(8px)';
          fortuneSvg.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        }
        
        setTimeout(function() {
          location.reload();
        }, 300);
      };

      img.onerror = function() {
        tile.classList.add('error');
      };

      tile.appendChild(img);
      gallery.appendChild(tile);
    });
})();
