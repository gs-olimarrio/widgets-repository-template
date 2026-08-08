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

  var done = getDone();   // manually marked steps
  var autoDone = [];      // auto-detected from platform data
  var alreadyCelebrated = false;

  function combined() {
    var all = done.slice();
    autoDone.forEach(function (n) { if (all.indexOf(n) === -1) all.push(n); });
    return all;
  }

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
    var all = combined();
    var count = all.length;

    [1, 2, 3].forEach(function (n) {
      var step = sdk.$('#step-' + n);
      var mark = sdk.$('#step-' + n + '-mark');
      var num  = sdk.$('#step-' + n + '-num');
      var isAuto   = autoDone.indexOf(n) > -1;
      var isDone   = all.indexOf(n) > -1;
      var isActive = !isDone && (n === 1 || all.indexOf(n - 1) > -1);
      if (step) {
        step.classList.toggle('done', isDone);
        step.classList.toggle('active', isActive);
      }
      if (num) num.textContent = isDone ? '✓' : String(n);
      if (mark) {
        // hide manual button for auto-completed steps — already done
        if (isAuto) {
          mark.style.display = 'none';
        } else {
          mark.textContent = done.indexOf(n) > -1 ? '✓ Klaar' : '+ Markeer als klaar';
        }
      }
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

  // Auto-detect completion from platform data
  async function checkPlatformData() {
    var userData = (window.inSidedData && window.inSidedData.user) || {};

    // Step 1: has posted a topic
    if (Number(userData.topicsCount) > 0 && autoDone.indexOf(1) === -1) {
      autoDone.push(1);
    }

    // Step 3: has a solved/best answer
    if (Number(userData.solvedCount) > 0 && autoDone.indexOf(3) === -1) {
      autoDone.push(3);
    }

    // Step 2: has joined a group — check via user API using session cookie
    try {
      var userId = userData.userid || userData.id;
      if (userId) {
        var res = await fetch('https://api2-eu-west-1.insided.com/user/' + userId, {
          credentials: 'include'
        });
        if (res.ok) {
          var user = await res.json();
          var memberGroups = user.membergroupids || user.memberGroupIds || [];
          var userGroup = user.usergroupid || user.userGroupId;
          var hasGroup = (Array.isArray(memberGroups) && memberGroups.length > 0)
                      || (memberGroups && typeof memberGroups === 'string' && memberGroups !== '')
                      || (userGroup && userGroup !== '' && userGroup !== '0' && userGroup !== 0);
          if (hasGroup && autoDone.indexOf(2) === -1) {
            autoDone.push(2);
          }
        }
      }
    } catch (e) {
      // API unavailable — fall back to manual marking
    }

    updateSteps();
  }

  // Manual mark-as-done (only for non-auto steps)
  [1, 2, 3].forEach(function (n) {
    var mark = sdk.$('#step-' + n + '-mark');
    if (mark) mark.addEventListener('click', function () {
      if (autoDone.indexOf(n) > -1) return; // auto-completed, ignore
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
  checkPlatformData();

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
      // only show manual button if showMark is on AND step isn't auto-completed
      if (mark) mark.style.display = (showMark && autoDone.indexOf(n) === -1) ? '' : 'none';
    });
  }

  applyProps(sdk.getProps());
  sdk.on('propsChanged', applyProps);
}
