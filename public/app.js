(function() {
  'use strict';

  var script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  document.head.appendChild(script);

  var seenImages = JSON.parse(localStorage.getItem('seenImages') || '[]');
  var seenFortunes = JSON.parse(localStorage.getItem('seenFortunes') || '[]');

  var headerText = document.getElementById('header-text');
  var headerSvg = headerText.querySelector('svg');
  var headerTextEl = headerSvg.querySelector('text');
  headerTextEl.setAttribute('stroke', '#000');
  headerTextEl.setAttribute('stroke-width', '0.5');
  headerSvg.style.opacity = '0';
  headerSvg.style.transform = 'translateY(-8px)';
  headerSvg.style.transition = 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)';

  var fortuneSvg = null;
  var img = null;
  var currentImageSrc = null;
  var currentFortuneText = null;

  function fadeInAll() {
    headerSvg.style.opacity = '1';
    headerSvg.style.transform = 'translateY(0)';
    if (fortuneSvg) {
      fortuneSvg.style.opacity = '1';
      fortuneSvg.style.transform = 'translateY(0)';
    }
    if (img) {
      img.style.opacity = '1';
      img.style.transform = 'scale(1)';
    }
  }

  var imageLoaded = false;
  var fortuneLoaded = false;

  function checkAllLoaded() {
    if (imageLoaded && fortuneLoaded) {
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          fadeInAll();
        });
      });
    }
  }

  fetch('/fortunes.txt')
    .then(function(res) { return res.text(); })
    .then(function(text) {
      var allFortunes = text.split('%').map(function(f) { return f.trim(); }).filter(Boolean);
      var unseenFortunes = allFortunes.filter(function(f, i) {
        return seenFortunes.indexOf(i) === -1;
      });
      if (unseenFortunes.length === 0) {
        seenFortunes = [];
        localStorage.setItem('seenFortunes', '[]');
        unseenFortunes = allFortunes;
      }
      var randomIndex = Math.floor(Math.random() * unseenFortunes.length);
      var fortune = unseenFortunes[randomIndex];
      var originalIndex = allFortunes.indexOf(fortune);
      seenFortunes.push(originalIndex);
      localStorage.setItem('seenFortunes', JSON.stringify(seenFortunes));
      fortune = fortune.split('―')[0].split('—')[0].split('--')[0].trim();
      fortune = fortune.replace(/[^a-zA-Z\s]/g, '');
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
      currentFortuneText = lastLine;
      fortuneSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      fortuneSvg.setAttribute('viewBox', '0 0 100 22');
      fortuneSvg.setAttribute('preserveAspectRatio', 'none');
      fortuneSvg.style.width = '100%';
      fortuneSvg.style.height = 'auto';
      fortuneSvg.style.display = 'block';
      fortuneSvg.style.opacity = '0';
      fortuneSvg.style.transform = 'translateY(8px)';
      fortuneSvg.style.transition = 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
      var textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textEl.setAttribute('x', '0');
      textEl.setAttribute('y', '19');
      textEl.setAttribute('font-family', 'Arial Black, Arial, sans-serif');
      textEl.setAttribute('font-weight', '900');
      textEl.setAttribute('font-size', '22');
      textEl.setAttribute('fill', '#000');
      textEl.setAttribute('stroke', '#000');
      textEl.setAttribute('stroke-width', '0.5');
      textEl.setAttribute('textLength', '100');
      textEl.setAttribute('lengthAdjust', 'spacingAndGlyphs');
      textEl.textContent = lastLine;
      fortuneSvg.appendChild(textEl);
      fortuneDiv.appendChild(fortuneSvg);
      
      fortuneDiv.onclick = function() {
        window.location.href = '/gallery.html';
      };
      
      fortuneLoaded = true;
      checkAllLoaded();
    });

  var gallery = document.getElementById('gallery');
  var FIXED_WIDTH = 750;
  var FIXED_HEIGHT = 500;

  function takeScreenshot() {
    if (typeof html2canvas === 'undefined') return;
    
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
    
    var container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:' + FIXED_WIDTH + 'px;background:#fff;padding:15px;border:1px solid #000;';
    
    var headerDiv = document.createElement('div');
    headerDiv.innerHTML = '<svg viewBox="0 0 100 22" preserveAspectRatio="none" style="width:100%;height:auto;display:block;"><text x="0" y="19" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="22" fill="#000" stroke="#000" stroke-width="0.5" textLength="100" lengthAdjust="spacingAndGlyphs">PUBLIC</text></svg>';
    container.appendChild(headerDiv);
    
    var imgDiv = document.createElement('div');
    imgDiv.style.cssText = 'margin-top:15px;width:100%;height:' + FIXED_HEIGHT + 'px;overflow:hidden;';
    var imgEl = document.createElement('img');
    imgEl.src = currentImageSrc;
    imgEl.style.cssText = 'width:100%;height:100%;object-fit:cover;object-position:center;display:block;';
    imgDiv.appendChild(imgEl);
    container.appendChild(imgDiv);
    
    var fortuneDiv = document.createElement('div');
    fortuneDiv.style.cssText = 'margin-top:15px;';
    fortuneDiv.innerHTML = '<svg viewBox="0 0 100 22" preserveAspectRatio="none" style="width:100%;height:auto;display:block;"><text x="0" y="19" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="22" fill="#000" stroke="#000" stroke-width="0.5" textLength="100" lengthAdjust="spacingAndGlyphs">' + currentFortuneText + '</text></svg>';
    container.appendChild(fortuneDiv);
    
    document.body.appendChild(container);
    
    imgEl.onload = function() {
      html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2
      }).then(function(canvas) {
        document.body.removeChild(container);
        var dataUrl = canvas.toDataURL();
        
        fetch('/api/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl })
        }).then(function(res) { return res.json(); }).then(function(data) {
          console.log('Saved to gallery:', data.url);
        }).catch(function(err) {
          console.error('Failed to save to gallery', err);
        });
        
        var link = document.createElement('a');
        link.download = 'public-' + Date.now() + '.png';
        link.href = dataUrl;
        link.click();
      });
    };
    
    if (imgEl.complete) {
      imgEl.onload();
    }
  }

  headerText.style.cursor = 'pointer';
  headerText.onclick = takeScreenshot;

  fetch('/images.json')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var allImages = data.images || [];
      if (allImages.length === 0) return;
      var unseenImages = allImages.filter(function(imgg, i) {
        return seenImages.indexOf(i) === -1;
      });
      if (unseenImages.length === 0) {
        seenImages = [];
        localStorage.setItem('seenImages', '[]');
        unseenImages = allImages;
      }
      var randomIndex = Math.floor(Math.random() * unseenImages.length);
      var imageData = unseenImages[randomIndex];
      var originalIndex = allImages.indexOf(imageData);
      seenImages.push(originalIndex);
      localStorage.setItem('seenImages', JSON.stringify(seenImages));
      var tile = document.createElement('div');
      tile.className = 'tile';
      tile.style.cursor = 'pointer';
      tile.style.overflow = 'hidden';
      img = document.createElement('img');
      img.src = imageData.url;
      currentImageSrc = imageData.url;
      img.alt = imageData.name || '';
      img.style.opacity = '0';
      img.style.transform = 'scale(0.96)';
      img.style.transformOrigin = 'center center';
      img.style.transition = 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
      img.onload = function() {
        imageLoaded = true;
        checkAllLoaded();
      };
      tile.onclick = function() {
        img.style.opacity = '0';
        img.style.transform = 'scale(0.98)';
        img.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        if (fortuneSvg) {
          fortuneSvg.style.opacity = '0';
          fortuneSvg.style.transform = 'translateY(8px)';
          fortuneSvg.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        }
        headerSvg.style.opacity = '0';
        headerSvg.style.transform = 'translateY(-8px)';
        headerSvg.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
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
