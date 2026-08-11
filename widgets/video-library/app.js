var STORAGE_KEY = 'video_library_watched';

function getWatched() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveWatched(watched) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(watched)); } catch {}
}

export async function init(sdk) {
  await sdk.whenReady();

  var videos = [];   // [{title, description, url}] — populated from props, only non-empty slots
  var watched = getWatched();

  function setIframe(n, url) {
    var player = sdk.$('#vl-player-' + n);
    var placeholder = sdk.$('#vl-placeholder-' + n);
    if (!player) return;
    // Remove any existing iframe
    var existing = player.querySelector('iframe');
    if (existing) existing.parentNode.removeChild(existing);
    if (url) {
      var iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('allow', 'autoplay; encrypted-media');
      player.appendChild(iframe);
      if (placeholder) placeholder.style.display = 'none';
    } else {
      if (placeholder) placeholder.style.display = 'flex';
    }
  }

  function render() {
    var total = videos.length;
    var watchedCount = watched.filter(function(n) { return n <= total; }).length;

    // Progress
    var fill  = sdk.$('#vl-progress-fill');
    var label = sdk.$('#vl-progress-label');
    if (fill)  fill.style.width = total > 0 ? (watchedCount / total * 100) + '%' : '0%';
    if (label) label.textContent = watchedCount + ' of ' + total + ' watched';

    // Update each slot (1-5)
    for (var i = 1; i <= 5; i++) {
      var item = sdk.$('#vl-item-' + i);
      if (!item) continue;

      var video = videos[i - 1]; // undefined if slot not configured

      if (!video) {
        // Hide unused slots
        item.className = 'vl-item locked';
        continue;
      }

      var isWatched = watched.indexOf(i) > -1;
      var isUnlocked = i === 1 || watched.indexOf(i - 1) > -1;

      if (!isUnlocked) {
        item.className = 'vl-item locked';
      } else if (isWatched) {
        item.className = 'vl-item watched';
      } else {
        item.className = 'vl-item active';
      }

      var num = sdk.$('#vl-num-' + i);
      if (num) num.textContent = isWatched ? '✓' : String(i);

      // Last active video: hide the "Unlock next" hint on the final one
      var hint = item.querySelector('.btn-watched-hint');
      if (hint) hint.style.display = (isWatched || video) ? '' : 'none';
    }

    // Completion banner
    var complete = sdk.$('#vl-complete');
    if (complete) complete.classList.toggle('visible', total > 0 && watchedCount === total);
  }

  // Wire up "Mark as watched" buttons
  for (var n = 1; n <= 5; n++) {
    (function(num) {
      var btn = sdk.$('#vl-btn-' + num);
      if (btn) btn.addEventListener('click', function() {
        if (watched.indexOf(num) === -1) watched.push(num);
        saveWatched(watched);
        render();
        // Scroll next video into view smoothly
        var next = sdk.$('#vl-item-' + (num + 1));
        if (next && !next.classList.contains('locked')) {
          setTimeout(function() { next.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
        }
      });
    })(n);
  }

  function applyProps(props) {
    // Series header
    var title = sdk.$('#vl-title');
    var desc  = sdk.$('#vl-desc');
    if (title) title.textContent = props.seriesTitle || 'Video Series';
    if (desc)  desc.textContent  = props.seriesDescription || '';

    // Build video list from props (only slots with a title or URL)
    videos = [];
    for (var i = 1; i <= 5; i++) {
      var t = props['video' + i + 'Title'] || '';
      var d = props['video' + i + 'Description'] || '';
      var u = props['video' + i + 'Url'] || '';
      if (t || u) {
        videos.push({ index: i, title: t || ('Episode ' + i), description: d, url: u });
        var cardTitle = sdk.$('#vl-card-title-' + i);
        var cardDesc  = sdk.$('#vl-card-desc-' + i);
        if (cardTitle) cardTitle.textContent = t || ('Episode ' + i);
        if (cardDesc) {
          cardDesc.textContent = d;
          cardDesc.style.display = d ? '' : 'none';
        }
        setIframe(i, u);
      }
    }

    render();
  }

  applyProps(sdk.getProps());
  sdk.on('propsChanged', applyProps);
}
