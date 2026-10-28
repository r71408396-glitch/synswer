// Purple 3D background: floating shapes, math symbols and a neural "AI brain" (shared by every page)
import { createScene } from "@kreova/scene";

const PURPLES = [0x8b5cf6, 0xa78bfa, 0x7c3aed, 0xc084fc, 0x6d28d9];
const SYMBOLS = ["\u03C0", "\u2211", "\u222B", "\u221Ax", "\u221E", "x\u00B2", "\u0394", "\u03B8", "\u03BB", "\u2248", "f(x)", "e^i\u03C0", "\u2202", "\u00B1", "a\u00B2+b\u00B2"];

// small deterministic random so layouts are stable
function rng(seed) {
  let s = seed;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const pointer = { x: 0, y: 0 };
window.addEventListener("pointermove", function (e) {
  pointer.x = e.clientX / window.innerWidth - 0.5;
  pointer.y = e.clientY / window.innerHeight - 0.5;
}, { passive: true });

const DEPTH = 14;
let halfHeight = 6;
let brain, nodes, nodeBase, nodeY, nodeColors, nodeAttr, lineMat;
const shapes = [];
const sprites = [];

function symbolTexture(THREE, text) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  const fs = Math.round(150 / Math.max(1, text.length * 0.55));
  g.font = "bold " + fs + "px 'Times New Roman', Georgia, serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = "#8b5cf6";
  g.shadowBlur = 24;
  g.fillStyle = "#d8ccff";
  g.fillText(text, 128, 132);
  g.fillText(text, 128, 132);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function layout(width, height) {
  var halfWidth = halfHeight * (width / height);
  var phone = width < height;
  shapes.forEach(function (m) {
    m.position.x = m.userData.across * halfWidth * 0.95;
    m.userData.baseY = m.userData.up * halfHeight * 0.9;
  });
  sprites.forEach(function (s) {
    s.position.x = s.userData.across * halfWidth * 0.95;
    s.userData.baseY = s.userData.up * halfHeight * 0.9;
  });
  if (brain) {
    var k = phone ? halfHeight * 0.2 : halfHeight * 0.36;
    brain.scale.setScalar(k);
    brain.position.x = phone ? 0 : halfWidth * 0.58;
    brain.userData.baseY = phone ? halfHeight * 0.66 : halfHeight * 0.02;
    brain.position.z = phone ? -3 : -1;
  }
}

createScene({
  canvas: ".bg3d-canvas",
  fallback: ".bg3d-still",
  build: function (ctx) {
    var THREE = ctx.THREE, scene = ctx.scene, camera = ctx.camera, quality = ctx.quality, size = ctx.size;
    camera.position.set(0, 0, DEPTH);
    camera.far = 80;
    camera.updateProjectionMatrix();
    halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * DEPTH;

    scene.add(new THREE.HemisphereLight(0xe9ddff, 0x1a0b3a, 1.1));
    var key = new THREE.DirectionalLight(0xc4a8ff, 1.6);
    key.position.set(4, 6, 8);
    scene.add(key);
    var rim = new THREE.PointLight(0x9333ea, 40, 40);
    rim.position.set(-6, -3, 4);
    scene.add(rim);

    // ----- floating 3D shapes -----
    var low = quality === "low";
    var seg = low ? 1 : 2;
    var geos = [
      new THREE.IcosahedronGeometry(1, seg > 1 ? 1 : 0),
      new THREE.OctahedronGeometry(1.1, 0),
      new THREE.TorusGeometry(1, 0.35, low ? 8 : 16, low ? 24 : 48),
      new THREE.TorusKnotGeometry(0.8, 0.26, low ? 48 : 110, low ? 8 : 14),
      new THREE.DodecahedronGeometry(1, 0),
      new THREE.BoxGeometry(1.4, 1.4, 1.4),
      new THREE.TetrahedronGeometry(1.2, 0)
    ];
    var count = low ? 8 : quality === "medium" ? 11 : 14;
    var r = rng(7);
    for (var i = 0; i < count; i++) {
      var geo = geos[i % geos.length];
      var color = PURPLES[i % PURPLES.length];
      var wire = i % 3 === 1;
      var mat = wire
        ? new THREE.MeshBasicMaterial({ color: color, wireframe: true, transparent: true, opacity: 0.55 })
        : new THREE.MeshStandardMaterial({ color: color, metalness: 0.35, roughness: 0.3, emissive: color, emissiveIntensity: 0.22, transparent: true, opacity: 0.9 });
      var mesh = new THREE.Mesh(geo, mat);
      var side = i % 2 === 0 ? -1 : 1;
      mesh.userData.across = side * (0.35 + r() * 0.62);
      mesh.userData.up = (r() * 2 - 1);
      mesh.position.z = -7 + r() * 8;
      mesh.scale.setScalar(0.35 + r() * 0.5);
      mesh.rotation.set(r() * 3, r() * 3, 0);
      mesh.userData.spin = 0.15 + r() * 0.35;
      mesh.userData.phase = r() * 6;
      scene.add(mesh);
      shapes.push(mesh);
    }

    // ----- floating math symbols -----
    var n = low ? 8 : SYMBOLS.length;
    for (var j = 0; j < n; j++) {
      var tex = symbolTexture(THREE, SYMBOLS[j]);
      var sm = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.5 + r() * 0.3, depthWrite: false });
      var sp = new THREE.Sprite(sm);
      var sc = 1.1 + r() * 1.2;
      sp.scale.set(sc, sc, 1);
      sp.userData.across = (r() * 2 - 1);
      sp.userData.up = (r() * 2 - 1);
      sp.userData.phase = r() * 6;
      sp.position.z = -9 + r() * 9;
      scene.add(sp);
      sprites.push(sp);
    }

    // ----- AI brain: a neural network shaped like a brain -----
    brain = new THREE.Group();
    var N = low ? 70 : quality === "medium" ? 110 : 150;
    var pos = new Float32Array(N * 3);
    nodeBase = new Float32Array(N * 3);
    nodeY = new Float32Array(N);
    var br = rng(42);
    for (var p = 0; p < N; p++) {
      var u = br() * 2 - 1;
      var t = br() * Math.PI * 2;
      var rr = Math.sqrt(1 - u * u);
      var shell = br() < 0.78 ? 1 : 0.55 + br() * 0.35;
      var x = rr * Math.cos(t) * shell;
      var y = u * shell;
      var z = rr * Math.sin(t) * shell;
      var wr = 1 + 0.1 * Math.sin(5 * x + 1) * Math.sin(5 * y) * Math.sin(5 * z + 2);
      x *= 0.95 * wr;
      y *= 0.78 * wr;
      z *= 1.25 * wr;
      if (y < -0.5) y = -0.5 + (y + 0.5) * 0.3;
      x += (x >= 0 ? 1 : -1) * 0.1; // gap between hemispheres
      pos[p * 3] = x;
      pos[p * 3 + 1] = y;
      pos[p * 3 + 2] = z;
      nodeBase[p * 3] = x;
      nodeBase[p * 3 + 1] = y;
      nodeBase[p * 3 + 2] = z;
      nodeY[p] = y;
    }
    var ng = new THREE.BufferGeometry();
    ng.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    nodeColors = new Float32Array(N * 3);
    nodeAttr = new THREE.BufferAttribute(nodeColors, 3);
    ng.setAttribute("color", nodeAttr);
    nodes = new THREE.Points(ng, new THREE.PointsMaterial({
      size: low ? 0.1 : 0.085,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    brain.add(nodes);

    var lp = [];
    var maxLinks = low ? 2 : 3;
    var linkCount = new Array(N).fill(0);
    for (var a = 0; a < N; a++) {
      for (var b = a + 1; b < N; b++) {
        if (linkCount[a] >= maxLinks || linkCount[b] >= maxLinks) continue;
        var dx = pos[a * 3] - pos[b * 3];
        var dy = pos[a * 3 + 1] - pos[b * 3 + 1];
        var dz = pos[a * 3 + 2] - pos[b * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < 0.2) {
          lp.push(pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2], pos[b * 3], pos[b * 3 + 1], pos[b * 3 + 2]);
          linkCount[a]++;
          linkCount[b]++;
        }
      }
    }
    var lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(lp), 3));
    lineMat = new THREE.LineBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending });
    brain.add(new THREE.LineSegments(lg, lineMat));

    // soft glow core
    var core = new THREE.Mesh(
      new THREE.SphereGeometry(0.75, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    core.scale.set(1, 0.8, 1.3);
    brain.add(core);

    scene.add(brain);
    layout(size.width, size.height);
  },
  resize: function (s) {
    if (halfHeight) layout(s.width, s.height);
  },
  frame: function (f) {
    var dt = f.dt, elapsed = f.elapsed, camera = f.camera;
    shapes.forEach(function (m) {
      m.position.y = m.userData.baseY + Math.sin(elapsed * 0.7 + m.userData.phase) * 0.35;
      m.rotation.x += dt * m.userData.spin;
      m.rotation.y += dt * m.userData.spin * 1.3;
    });
    sprites.forEach(function (s) {
      s.position.y = s.userData.baseY + Math.sin(elapsed * 0.5 + s.userData.phase) * 0.3;
      s.material.rotation = Math.sin(elapsed * 0.3 + s.userData.phase) * 0.18;
    });
    if (brain) {
      brain.position.y = brain.userData.baseY + Math.sin(elapsed * 0.6) * 0.2;
      brain.rotation.y = elapsed * 0.22;
      brain.rotation.x = Math.sin(elapsed * 0.3) * 0.12;
      var N = nodeY.length;
      for (var i = 0; i < N; i++) {
        var w = 0.5 + 0.5 * Math.sin(elapsed * 2.2 - nodeY[i] * 4 + i * 0.7);
        var v = 0.25 + 0.75 * w * w;
        nodeColors[i * 3] = 0.55 * v + 0.25;
        nodeColors[i * 3 + 1] = 0.36 * v + 0.12;
        nodeColors[i * 3 + 2] = 1.0 * v;
      }
      nodeAttr.needsUpdate = true;
      lineMat.opacity = 0.28 + 0.16 * Math.sin(elapsed * 1.6);
    }
    var ease = Math.min(1, dt * 2);
    camera.position.x += (pointer.x * 1.6 - camera.position.x) * ease;
    camera.position.y += (-pointer.y * 1.0 - camera.position.y) * ease;
    camera.lookAt(0, 0, 0);
  }
});
