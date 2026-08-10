export async function init(sdk) {
  await sdk.whenReady();

  var expanded = false;

  function buildCards(props) {
    var grid = sdk.$('#tc-grid');
    if (!grid) return;
    grid.innerHTML = '';

    var cols = parseInt(props.cardsPerRow) || 4;
    var maxRows = parseInt(props.maxRows) || 1;
    var limit = cols * maxRows;

    var cards = [];
    for (var n = 1; n <= 8; n++) {
      var title = props['card' + n + 'Title'];
      if (!title) continue;
      cards.push({
        image: props['card' + n + 'Image'] || '',
        title: title,
        meta:  props['card' + n + 'Meta']  || '',
        badge: props['card' + n + 'Badge'] || '',
        url:   props['card' + n + 'Url']   || '#'
      });
    }

    var wrap = sdk.$('#tc-wrap');
    if (wrap) wrap.style.setProperty('--cols', cols);

    cards.forEach(function (card, i) {
      var a = document.createElement('a');
      a.className = 'tc-card' + ((!expanded && i >= limit) ? ' hidden' : '');
      a.href = card.url;
      a.target = '_blank';

      var badgeHtml = card.badge
        ? '<div class="tc-badge"><img src="' + card.badge + '" alt=""></div>'
        : '';

      var imgHtml = card.image
        ? '<img class="tc-image" src="' + card.image + '" alt="' + card.title + '">'
        : '<div class="tc-image-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>';

      var metaHtml = card.meta
        ? '<div class="tc-meta">' + card.meta + '</div>'
        : '';

      a.innerHTML = badgeHtml
        + '<div class="tc-image-wrap">' + imgHtml + '</div>'
        + '<div class="tc-title">' + card.title + '</div>'
        + metaHtml;

      grid.appendChild(a);
    });

    // Show/hide the "Toon alles" button
    var footer = sdk.$('#tc-footer');
    var btn    = sdk.$('#tc-show-all');
    var label  = sdk.$('#tc-show-all-label');
    if (label) label.textContent = props.showAllLabel || 'Toon alles';
    if (footer) footer.style.display = (!expanded && cards.length > limit) ? '' : 'none';
    if (btn)   btn.classList.toggle('expanded', expanded);
  }

  var currentProps = sdk.getProps();

  var btn = sdk.$('#tc-show-all');
  if (btn) btn.addEventListener('click', function () {
    expanded = !expanded;
    buildCards(currentProps);
  });

  buildCards(currentProps);

  sdk.on('propsChanged', function (props) {
    currentProps = props;
    expanded = false;
    buildCards(props);
  });
}
