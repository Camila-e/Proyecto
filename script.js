window.requestAnimationFrame =
  window.__requestAnimationFrame ||
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  (function () {
    return function (callback, element) {
      var lastTime = element.__lastTime;
      if (lastTime === undefined) {
        lastTime = 0;
      }
      var currTime = Date.now();
      var timeToCall = Math.max(1, 33 - (currTime - lastTime));
      window.setTimeout(callback, timeToCall);
      element.__lastTime = currTime + timeToCall;
    };
  })();

window.isDevice = (/android|webos|iphone|ipad|ipod|opera mini|windows phone|blackberry/i.test(((navigator.userAgent || navigator.vendor || window.opera)).toLowerCase()));

var loaded = false;
var init = function () {
  if (loaded) return;
  loaded = true;

  var mobile = window.isDevice;
  var koef = mobile ? 0.5 : 1; 
  var canvas = document.getElementById('Cami');
  var ctx = canvas.getContext('2d');

  var setCanvasSize = function () {
    canvas.width = koef * window.innerWidth;
    canvas.height = koef * window.innerHeight;
  };
  setCanvasSize(); 

  window.addEventListener('resize', function () {
    setCanvasSize();
  });
  var rand = Math.random;
  var nameParticles = [];
  var name = "Jordy";
  var fontSize = 60;
  var nameX = canvas.width / 2 - (fontSize * name.length) / 2;
  var nameY = canvas.height / 2;

  for (let i = 0; i < name.length; i++) {
    nameParticles.push({
      char: name[i],
      x: nameX + i * fontSize,
      y: nameY + (rand() - 0.5) * 5,
      size: fontSize,
      targetX: nameX + i * fontSize,
      targetY: nameY,
      alpha: 1,
    });
  }

  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  var loop = function () {
    ctx.fillStyle = "rgba(0,0,0,.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    nameParticles.forEach(function (particle) {
      ctx.fillStyle = `rgba(255, 0, 0, ${particle.alpha})`;
      ctx.font = `${particle.size}px italic Arial`;
      ctx.fillText(particle.char, particle.x, particle.y);

      particle.alpha -= 0.01;

      if (particle.alpha <= 0) {
        particle.alpha = 0;
      }
    });

    if (nameParticles.every(p => p.alpha === 0)) {
      createHeart();
    } else {
      window.requestAnimationFrame(loop, canvas);
    }
  };

  var createHeart = function () {
    var heartPosition = function (rad) {
      return [Math.pow(Math.sin(rad), 3), -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))];
    };

    var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
      return [dx + pos[0] * sx, dy + pos[1] * sy];
    };

    var traceCount = mobile ? 20 : 50;
    var pointsOrigin = [];
    var i;
    var dr = mobile ? 0.3 : 0.1;
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 210, 13, 0, 0));
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 150, 9, 0, 0));
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 90, 5, 0, 0));

    var heartPointsCount = pointsOrigin.length;
    var targetPoints = [];

    var pulse = function (kx, ky) {
      for (i = 0; i < pointsOrigin.length; i++) {
        targetPoints[i] = [];
        targetPoints[i][0] = kx * pointsOrigin[i][0] + canvas.width / 2;
        targetPoints[i][1] = ky * pointsOrigin[i][1] + canvas.height / 2;
      }
    };

    var e = [];
    for (i = 0; i < heartPointsCount; i++) {
      var x = rand() * canvas.width;
      var y = rand() * canvas.height;
      e[i] = {
        vx: 0,
        vy: 0,
        R: 2,
        speed: rand() + 5,
        q: ~~(rand() * heartPointsCount),
        D: 2 * (i % 2) - 1,
        force: 0.2 * rand() + 0.7,
        f: "hsla(0," + ~~(40 * rand() + 60) + "%," + ~~(60 * rand() + 20) + "%,.3)",
        trace: []
      };
      for (var k = 0; k < traceCount; k++) e[i].trace[k] = { x: x, y: y };
    }

    var config = {
      traceK: 0.4,
      timeDelta: 0.01
    };

    var time = 0;

    var heartLoop = function () {
      var n = -Math.cos(time);
      pulse((1 + n) * 0.5, (1 + n) * 0.5);
      time += ((Math.sin(time)) < 0 ? 9 : (n > 0.8) ? 0.2 : 1) * config.timeDelta;
      ctx.fillStyle = "rgba(0,0,0,.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (i = e.length; i--;) {
        var u = e[i];
        var q = targetPoints[u.q];
        var dx = u.trace[0].x - q[0];
        var dy = u.trace[0].y - q[1];
        var length = Math.sqrt(dx * dx + dy * dy);

        if (10 > length) {
          if (0.95 < rand()) {
            u.q = ~~(rand() * heartPointsCount);
          } else {
            if (0.99 < rand()) {
              u.D *= -1;
            }
            u.q += u.D;
            u.q %= heartPointsCount;
            if (0 > u.q) {
              u.q += heartPointsCount;
            }
          }
        }

        u.vx += -dx / length * u.speed;
        u.vy += -dy / length * u.speed;
        u.trace[0].x += u.vx;
        u.trace[0].y += u.vy;
        u.vx *= u.force;
        u.vy *= u.force;

        for (var k = 0; k < u.trace.length - 1;) {
          var T = u.trace[k];
          var N = u.trace[++k];
          N.x -= config.traceK * (N.x - T.x);
          N.y -= config.traceK * (N.y - T.y);
        }

        ctx.fillStyle = u.f;
        for (var k = 0; k < u.trace.length; k++) {
          ctx.fillRect(u.trace[k].x, u.trace[k].y, 1, 1);
        }
      }

      window.requestAnimationFrame(heartLoop, canvas);
    };

    heartLoop();
  };

  loop();
};

var s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init, false);
}
