/* 3D dice: polyhedra with numbered faces, a light physics toss, and a settle that turns
 * the predetermined result face up. Results are rolled first (crypto RNG), then animated. */
(function () {
  'use strict';
  var THREE = window.THREE;

  var PALETTES = {
    twilight: { face: '#3a2a6b', face2: '#5a3fa8', ink: '#f6d27a', edge: '#1d1538' },
    infernal: { face: '#7a1424', face2: '#b3263a', ink: '#ffe3b0', edge: '#3a0610' },
    bone: { face: '#efe6d2', face2: '#fffaf0', ink: '#2a1f3d', edge: '#b9ab8c' },
    obsidian: { face: '#16161c', face2: '#2c2c38', ink: '#9fe3ff', edge: '#000000' },
    jade: { face: '#0f5a4a', face2: '#1f8a70', ink: '#f2fff8', edge: '#05261f' }
  };

  function rand() {
    var a = new Uint32Array(1);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return a[0] / 4294967296;
  }
  function rollDie(sides) { return 1 + Math.floor(rand() * sides); }

  // ---- geometry: list of planar polygons (arrays of Vector3) per die
  function polysFromThree(geo) {
    var pos = geo.attributes.position, groups = [];
    for (var i = 0; i < pos.count; i += 3) {
      var a = new THREE.Vector3().fromBufferAttribute(pos, i);
      var b = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
      var c = new THREE.Vector3().fromBufferAttribute(pos, i + 2);
      var n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
      var g = null;
      for (var j = 0; j < groups.length; j++) if (groups[j].n.dot(n) > 0.999) { g = groups[j]; break; }
      if (!g) { g = { n: n, pts: [] }; groups.push(g); }
      [a, b, c].forEach(function (p) {
        for (var k = 0; k < g.pts.length; k++) if (g.pts[k].distanceTo(p) < 1e-4) return;
        g.pts.push(p);
      });
    }
    return groups.map(function (g) {
      var ctr = new THREE.Vector3();
      g.pts.forEach(function (p) { ctr.add(p); });
      ctr.divideScalar(g.pts.length);
      var u = new THREE.Vector3().subVectors(g.pts[0], ctr).normalize();
      var w = new THREE.Vector3().crossVectors(g.n, u);
      g.pts.sort(function (p, q) {
        var dp = new THREE.Vector3().subVectors(p, ctr), dq = new THREE.Vector3().subVectors(q, ctr);
        return Math.atan2(dp.dot(w), dp.dot(u)) - Math.atan2(dq.dot(w), dq.dot(u));
      });
      return g.pts;
    });
  }

  function cubePolys() {
    var s = 0.62, P = function (x, y, z) { return new THREE.Vector3(x * s, y * s, z * s); };
    return [
      [P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), P(1, -1, 1)],
      [P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1), P(-1, -1, -1)],
      [P(-1, 1, 1), P(1, 1, 1), P(1, 1, -1), P(-1, 1, -1)],
      [P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1)],
      [P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)],
      [P(1, -1, -1), P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1)]
    ];
  }

  function d10Polys() {
    var h = 0.95, r = 0.9, k = (1 - Math.cos(Math.PI / 5)) / (1 + Math.cos(Math.PI / 5)), a = h * k;
    var T = new THREE.Vector3(0, h, 0), B = new THREE.Vector3(0, -h, 0), ring = [];
    for (var i = 0; i < 10; i++) {
      var ang = i * Math.PI / 5;
      ring.push(new THREE.Vector3(Math.cos(ang) * r, i % 2 ? -a : a, Math.sin(ang) * r));
    }
    var polys = [];
    for (var j = 0; j < 5; j++) {
      var e = 2 * j;
      polys.push([T, ring[(e + 2) % 10], ring[(e + 1) % 10], ring[e]]);
      polys.push([B, ring[(e + 1) % 10], ring[(e + 2) % 10], ring[(e + 3) % 10]]);
    }
    // order 1..10 alternating top/bottom like a real d10
    return polys;
  }

  var SHAPES = {
    4: function () { return polysFromThree(new THREE.TetrahedronGeometry(1.05, 0)); },
    6: cubePolys,
    8: function () { return polysFromThree(new THREE.OctahedronGeometry(0.95, 0)); },
    10: d10Polys,
    12: function () { return polysFromThree(new THREE.DodecahedronGeometry(0.92, 0)); },
    20: function () { return polysFromThree(new THREE.IcosahedronGeometry(0.98, 0)); }
  };

  function labelsFor(kind) {
    if (kind === 'd100') return ['00', '10', '20', '30', '40', '50', '60', '70', '80', '90'];
    if (kind === 'd10u') return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    var n = +kind.slice(1), out = [];
    for (var i = 1; i <= n; i++) out.push(String(i));
    return out;
  }

  var built = {};
  function buildDie(kind, pal) {
    var key = kind + '|' + pal;
    if (built[key]) return built[key];
    var sides = kind === 'd100' || kind === 'd10u' ? 10 : +kind.slice(1);
    var polys = SHAPES[sides]();
    var labels = labelsFor(kind);
    var colors = PALETTES[pal] || PALETTES.twilight;
    var cols = Math.ceil(Math.sqrt(polys.length)), tile = 128, size = cols * tile;
    var cv = document.createElement('canvas');
    cv.width = cv.height = size;
    var g = cv.getContext('2d');
    var positions = [], uvs = [], faces = [];
    polys.forEach(function (pts, fi) {
      var ctr = new THREE.Vector3();
      pts.forEach(function (p) { ctr.add(p); });
      ctr.divideScalar(pts.length);
      var n = new THREE.Vector3().subVectors(pts[1], pts[0]).cross(new THREE.Vector3().subVectors(pts[2], pts[0])).normalize();
      if (n.dot(ctr) < 0) { pts = [pts[0]].concat(pts.slice(1).reverse()); n.negate(); }
      // "up" for the printed number: toward an edge midpoint on squares, else toward vertex 0
      var upPt = sides === 6 ? new THREE.Vector3().addVectors(pts[0], pts[1]).multiplyScalar(0.5) : pts[0];
      var v = new THREE.Vector3().subVectors(upPt, ctr).normalize();
      var u = new THREE.Vector3().crossVectors(v, n).normalize();
      var R = 0;
      pts.forEach(function (p) { R = Math.max(R, p.distanceTo(ctr)); });
      var sc = 0.5 / (R * 1.04);
      var col = fi % cols, row = Math.floor(fi / cols);
      function uvOf(p) {
        var dlt = new THREE.Vector3().subVectors(p, ctr);
        var x = 0.5 + dlt.dot(u) * sc, y = 0.5 + dlt.dot(v) * sc;
        return [(col + x) / cols, 1 - (row + (1 - y)) / cols];
      }
      for (var i = 1; i < pts.length - 1; i++) {
        [pts[0], pts[i], pts[i + 1]].forEach(function (p) {
          positions.push(p.x, p.y, p.z);
          var t = uvOf(p);
          uvs.push(t[0], t[1]);
        });
      }
      // tile art
      var x0 = col * tile, y0 = row * tile;
      var grd = g.createRadialGradient(x0 + tile / 2, y0 + tile / 2, 4, x0 + tile / 2, y0 + tile / 2, tile * 0.7);
      grd.addColorStop(0, colors.face2);
      grd.addColorStop(1, colors.face);
      g.fillStyle = grd;
      g.fillRect(x0, y0, tile, tile);
      var label = labels[fi % labels.length];
      var fs = sides === 4 ? 40 : sides === 20 || sides === 8 ? 34 : sides === 10 ? (label.length > 1 ? 26 : 34) : 46;
      // kites (d10): number sits lower, nearer the wide part of the face
      var cy = y0 + tile / 2 + (sides === 10 ? tile * 0.1 : sides === 4 || sides === 8 || sides === 20 ? tile * 0.04 : 0);
      g.font = '800 ' + fs + 'px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = 'rgba(0,0,0,.35)';
      g.fillText(label, x0 + tile / 2 + 1.5, cy + 2);
      g.fillStyle = colors.ink;
      g.fillText(label, x0 + tile / 2, cy);
      if (label === '6' || label === '9') g.fillRect(x0 + tile / 2 - fs * 0.22, cy + fs * 0.42, fs * 0.44, 3);
      faces.push({ n: n.clone(), up: v.clone(), label: label });
    });
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    var tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    tex.encoding = THREE.sRGBEncoding;
    var mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.32, metalness: 0.08 });
    var edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 10), new THREE.LineBasicMaterial({ color: colors.edge, transparent: true, opacity: 0.55 }));
    var verts = [];
    for (var i = 0; i < positions.length; i += 3) verts.push(new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]));
    var rad = 0;
    verts.forEach(function (p) { rad = Math.max(rad, p.length()); });
    built[key] = { geo: geo, mat: mat, edges: edges, faces: faces, verts: verts, rad: rad, sides: sides, labels: labels };
    return built[key];
  }

  // ---- scene
  var renderer, scene, camera, canvas, floorHalf = { x: 4, z: 6 }, raf = 0, active = [];
  var audioCtx = null;

  function init(cv) {
    if (renderer) return true;
    canvas = cv;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    } catch (e) { renderer = null; return false; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 18, 6.8);
    camera.lookAt(0, 0, 0.4);
    scene.add(new THREE.HemisphereLight(0xfff4e6, 0x3a2a6b, 0.75));
    var key = new THREE.DirectionalLight(0xffffff, 0.95);
    key.position.set(-4, 14, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    var sc = key.shadow.camera;
    sc.left = -10; sc.right = 10; sc.top = 12; sc.bottom = -12; sc.near = 1; sc.far = 40;
    scene.add(key);
    var rim = new THREE.PointLight(0xb69cff, 0.5, 40);
    rim.position.set(5, 6, -6);
    scene.add(rim);
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.32 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    resize();
    window.addEventListener('resize', resize);
    return true;
  }

  function resize() {
    if (!renderer) return;
    var w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    // visible floor extents: intersect NDC corners with y = 0
    var ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
    var xs = [], zs = [];
    [[-1, -0.3], [1, -0.3], [-1, 0.85], [1, 0.85]].forEach(function (c) {
      ray.setFromCamera(new THREE.Vector2(c[0], c[1]), camera);
      if (ray.ray.intersectPlane(plane, hit)) { xs.push(hit.x); zs.push(hit.z); }
    });
    if (xs.length) {
      floorHalf.x = Math.max(1.6, Math.min.apply(null, xs.map(Math.abs)) - 0.9);
      floorHalf.zMin = Math.min.apply(null, zs) + 0.9;
      floorHalf.zMax = Math.max.apply(null, zs) - 0.9;
    }
  }

  function clack(strength) {
    if (!window.DiceSettings || !window.DiceSettings.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var t = audioCtx.currentTime, len = 0.05;
      var buf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * len), audioCtx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 6);
      var src = audioCtx.createBufferSource();
      src.buffer = buf;
      var bp = audioCtx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1800 + Math.random() * 1600;
      bp.Q.value = 2.5;
      var gn = audioCtx.createGain();
      gn.gain.value = Math.min(0.5, 0.08 + strength * 0.04);
      src.connect(bp); bp.connect(gn); gn.connect(audioCtx.destination);
      src.start(t);
    } catch (e) {}
  }

  function restHeight(die, q) {
    var minY = Infinity, p = new THREE.Vector3();
    die.verts.forEach(function (v) { p.copy(v).applyQuaternion(q); if (p.y < minY) minY = p.y; });
    return -minY;
  }

  function targetQuat(die, faceIdx) {
    var f = die.faces[faceIdx];
    var q1 = new THREE.Quaternion().setFromUnitVectors(f.n, new THREE.Vector3(0, 1, 0));
    var up = f.up.clone().applyQuaternion(q1);
    up.y = 0;
    up.normalize();
    // turn the number so it reads upright from the camera (screen-up = -z), with a little jitter
    var want = new THREE.Vector3(0, 0, -1);
    var ang = Math.atan2(up.x * want.z - up.z * want.x, up.x * want.x + up.z * want.z);
    ang = -ang + (rand() - 0.5) * 0.5;
    var q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ang);
    return q2.multiply(q1);
  }

  function clear() {
    active.forEach(function (o) {
      scene.remove(o.mesh);
      if (o.dimmed) o.mesh.material.dispose();
    });
    active = [];
  }

  /* dice: [{kind:'d20', value: 14, palette:'twilight', dim:false}] → Promise resolved when settled */
  function throwDice(dice, opts) {
    opts = opts || {};
    cancelAnimationFrame(raf);
    clear();
    resize();
    var n = dice.length;
    dice.forEach(function (dd, i) {
      var die = buildDie(dd.kind, dd.palette || 'twilight');
      var mesh = new THREE.Mesh(die.geo, die.mat);
      mesh.add(die.edges.clone());
      mesh.castShadow = true;
      var scale = n <= 2 ? 1 : n <= 4 ? 0.88 : n <= 8 ? 0.74 : 0.62;
      mesh.scale.setScalar(scale);
      scene.add(mesh);
      var faceIdx = die.labels.indexOf(dd.label);
      if (faceIdx < 0) faceIdx = 0;
      var spread = (i - (n - 1) / 2) * Math.min(1.3, (2 * floorHalf.x) / Math.max(1, n));
      var o = {
        mesh: mesh, die: die, scale: scale,
        p: new THREE.Vector3(spread + (rand() - 0.5) * 0.8, 3 + rand() * 2.5, (floorHalf.zMax || 5) + 1.5 + rand() * 1.5),
        v: new THREE.Vector3((rand() - 0.5) * 7, 2 + rand() * 3, -(10 + rand() * 6)),
        q: new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * 6.28, rand() * 6.28, rand() * 6.28)),
        w: new THREE.Vector3((rand() - 0.5) * 30, (rand() - 0.5) * 30, (rand() - 0.5) * 30),
        qT: targetQuat(die, faceIdx), dim: !!dd.dim, hits: 0
      };
      o.restY = restHeight(die, o.qT) * scale;
      active.push(o);
    });
    var t0 = performance.now(), last = t0;
    var T_BLEND0 = opts.fast ? 0.45 : 0.85, T_BLEND1 = opts.fast ? 0.95 : 1.55, T_END = T_BLEND1 + 0.15;
    return new Promise(function (resolve) {
      function step(now) {
        var t = (now - t0) / 1000, dtAll = Math.min(0.05, (now - last) / 1000);
        last = now;
        var sub = 4, dt = dtAll / sub;
        for (var s = 0; s < sub; s++) physics(dt);
        var k = Math.max(0, Math.min(1, (t - T_BLEND0) / (T_BLEND1 - T_BLEND0)));
        k = k * k * (3 - 2 * k);
        active.forEach(function (o) {
          var q = o.q.clone().slerp(o.qT, k);
          o.mesh.quaternion.copy(q);
          var y = o.p.y + (o.restY - o.p.y) * k;
          o.mesh.position.set(o.p.x, y, o.p.z);
          if (o.dim && k > 0.9 && !o.dimmed) {
            o.dimmed = true;
            o.mesh.material = o.die.mat.clone();
            o.mesh.material.transparent = true;
            o.mesh.material.opacity = 0.38;
          }
        });
        renderer.render(scene, camera);
        if (t < T_END) raf = requestAnimationFrame(step);
        else resolve();
      }
      raf = requestAnimationFrame(step);
    });
  }

  function physics(dt) {
    var g = -32;
    active.forEach(function (o) {
      o.v.y += g * dt;
      o.p.addScaledVector(o.v, dt);
      var r = o.die.rad * o.scale * 0.82;
      if (o.p.y < r) {
        o.p.y = r;
        if (o.v.y < -1.5) {
          var strength = Math.min(1, -o.v.y / 14);
          if (o.hits < 3) {
            clack(strength * 6);
            if (window.osrHost && strength > 0.25) window.osrHost.haptic(o.hits === 0 ? 1 : 0);
          }
          o.hits++;
          o.w.x += (rand() - 0.5) * 10 * strength; o.w.z += (rand() - 0.5) * 10 * strength;
        }
        o.v.y = -o.v.y * 0.42;
        o.v.x *= 0.82; o.v.z *= 0.82;
        o.w.multiplyScalar(0.8);
      }
      var zMin = floorHalf.zMin == null ? -5 : floorHalf.zMin, zMax = floorHalf.zMax == null ? 5 : floorHalf.zMax;
      if (o.p.x < -floorHalf.x) { o.p.x = -floorHalf.x; o.v.x = Math.abs(o.v.x) * 0.6; o.w.y *= -0.7; }
      if (o.p.x > floorHalf.x) { o.p.x = floorHalf.x; o.v.x = -Math.abs(o.v.x) * 0.6; o.w.y *= -0.7; }
      if (o.p.z < zMin) { o.p.z = zMin; o.v.z = Math.abs(o.v.z) * 0.55; o.w.x *= -0.7; }
      if (o.p.z > zMax && o.v.z > 0) { o.p.z = zMax; o.v.z = -Math.abs(o.v.z) * 0.55; }
      o.v.multiplyScalar(1 - 0.35 * dt);
      var wl = o.w.length();
      if (wl > 1e-4) {
        var dq = new THREE.Quaternion().setFromAxisAngle(o.w.clone().divideScalar(wl), wl * dt);
        o.q.premultiply(dq);
      }
    });
    // simple sphere separation between dice
    for (var i = 0; i < active.length; i++) for (var j = i + 1; j < active.length; j++) {
      var a = active[i], b = active[j];
      var dlt = new THREE.Vector3().subVectors(b.p, a.p);
      dlt.y = 0;
      var dist = dlt.length(), min = (a.die.rad * a.scale + b.die.rad * b.scale) * 0.85;
      if (dist < min && dist > 1e-4) {
        dlt.divideScalar(dist);
        var push = (min - dist) / 2;
        a.p.addScaledVector(dlt, -push); b.p.addScaledVector(dlt, push);
        var rel = new THREE.Vector3().subVectors(b.v, a.v).dot(dlt);
        if (rel < 0) { a.v.addScaledVector(dlt, rel * 0.9); b.v.addScaledVector(dlt, -rel * 0.9); }
      }
    }
  }

  function fadeOut() { cancelAnimationFrame(raf); if (renderer) { clear(); renderer.render(scene, camera); } }

  window.Dice3D = {
    debug: function () { return { floor: floorHalf, dice: active.map(function (o) { return o.mesh.position.toArray().map(function (v) { return +v.toFixed(2); }); }) }; },
    init: init, throwDice: throwDice, fadeOut: fadeOut, rollDie: rollDie, rand: rand,
    palettes: PALETTES, supported: function () {
      try { var c = document.createElement('canvas'); return !!(window.THREE && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; }
    }
  };
})();
