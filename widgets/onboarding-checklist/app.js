var STORAGE_KEY = 'onboarding_checklist_done';

function getDone() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveDone(done) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(done)); } catch {}
}

export async function init(sdk) {
  await sdk.whenReady();

  var done = getDone();

  function updateSteps() {
    var count = done.length;
    [1, 2, 3].forEach(function (n) {
      var step = sdk.$('#step-' + n);
      var mark = sdk.$('#step-' + n + '-mark');
      var num  = sdk.$('#step-' + n + '-num');
      var isDone = done.indexOf(n) > -1;
      var isActive = !isDone && (n === 1 || done.indexOf(n - 1) > -1);
      if (step) {
        step.classList.toggle('done', isDone);
        step.classList.toggle('active', isActive);
      }
      if (mark) mark.textContent = isDone ? '✓ Klaar' : '+ Markeer als klaar';
      if (num) num.textContent = isDone ? '✓' : String(n);
    });
    var fill = sdk.$('#progress-fill');
    var label = sdk.$('#progress-label');
    if (fill) fill.style.width = (count / 3 * 100) + '%';
    if (label) label.textContent = count + ' van 3 klaar';
  }

  [1, 2, 3].forEach(function (n) {
    var mark = sdk.$('#step-' + n + '-mark');
    if (mark) mark.addEventListener('click', function () {
      var idx = done.indexOf(n);
      if (idx > -1) done.splice(idx, 1);
      else done.push(n);
      saveDone(done);
      updateSteps();
    });
  });

  updateSteps();

  function applyProps(props) {
    var accent = props.accentColor || '#EF4B36';
    var checklist = sdk.$('#checklist');
    if (checklist) {
      checklist.style.setProperty('--accent', accent);
      checklist.style.setProperty('--accent-end', accent);
    }

    var eyebrow    = sdk.$('#eyebrow');
    var heading    = sdk.$('#heading');
    var subheading = sdk.$('#subheading');
    if (eyebrow)    eyebrow.textContent    = props.eyebrowLabel || 'AAN DE SLAG';
    if (heading)    heading.textContent    = props.heading      || 'Welkom! Laten we beginnen';
    if (subheading) subheading.textContent = props.subheading   || 'Drie snelle stappen om je weg te vinden, mensen te ontmoeten en erkend te worden.';

    [1, 2, 3].forEach(function (n) {
      var btn = sdk.$('#step-' + n + '-btn');
      var url = props['step' + n + 'Url'];
      if (btn && url) btn.href = url;
    });

    var showMark = props.showMarkAsDone !== false && props.showMarkAsDone !== 'false';
    [1, 2, 3].forEach(function (n) {
      var mark = sdk.$('#step-' + n + '-mark');
      if (mark) mark.style.display = showMark ? '' : 'none';
    });
  }

  applyProps(sdk.getProps());
  sdk.on('propsChanged', applyProps);
}
