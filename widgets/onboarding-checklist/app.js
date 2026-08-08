var STORAGE_KEY = 'onboarding_checklist_done';
var COLORS = ['#F7941D', '#EF4B36', '#FFBE5C', '#FF6B4A', '#FFA040', '#FF4422'];

function getDone() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveDone(done) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(done)); } catch {}
}

export async function init(sdk) {
  await sdk.whenReady();

  var done = getDone();
  var alreadyCelebrated = false;

  function launchConfetti() {
    var canvas = sdk.$('#confetti-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var checklist = sdk.$('#checklist');
    canvas.width  = (checklist ? checklist.offsetWidth  : 0) || 400;
    canvas.height = (checklist ? checklist.offsetHeight : 0) || 500;

    var particles = [];
    for (var i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * -1,
        w: 6 + Math.random() * 8,
        h: 4 + Math.random() * 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 4,
        opacity: 1
      });
    }

    var start = null;
    var duration = 3000;

    function draw(ts) {
      if (!start) start = ts;
      var elapsed = ts - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        if (elapsed > duration * 0.6) p.opacity = Math.max(0, p.opacity - 0.015);
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (elapsed < duration + 500) {
        requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    requestAnimationFrame(draw);
  }

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

    var isComplete = count === 3;
    var banner = sdk.$('#completion-banner');
    if (banner) banner.classList.toggle('visible', isComplete);
    if (isComplete && !alreadyCelebrated) {
      alreadyCelebrated = true;
      launchConfetti();
    }
    if (!isComplete) alreadyCelebrated = false;
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

  var closeBtn = sdk.$('#btn-close');
  if (closeBtn) closeBtn.addEventListener('click', function () {
    var checklist = sdk.$('#checklist');
    if (checklist) checklist.style.display = 'none';
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
