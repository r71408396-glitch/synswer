import { createScene } from "@kreova/scene";

const U = 20; // canvas pixels per world unit
const wx = (x) => (x - 200) / U;
const wy = (y) => (280 - y) / U;

try {
  let T, sceneRef, fruitGeo, halfGeo, bombGeo, ringGeo, bombMat, ringMat;
  const mats = {};
  const itemMap = new Map();
  const halfMap = new Map();
  let trailLine, trailPos;
  const MAXT = 48;

  const matFor = (color) => {
    if (!mats[color]) mats[color] = new T.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.1, side: T.DoubleSide });
    return mats[color];
  };

  createScene({
    canvas: "#slice3d",
    game: true,
    label: "Slice and Dice, 3D view",
    build({ THREE, scene, camera, quality }) {
      T = THREE; sceneRef = scene;
      scene.background = new THREE.Color(0x0a0a14);
      camera.fov = 40;
      camera.position.set(0, 0, 38.5);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x1a1030, 1.2));
      const sun = new THREE.DirectionalLight(0xffffff, 1.6);
      sun.position.set(-8, 10, 20);
      scene.add(sun);

      const back = new THREE.Mesh(new THREE.PlaneGeometry(40, 56), new THREE.MeshStandardMaterial({ color: 0x10101c, roughness: 0.95 }));
      back.position.z = -4;
      scene.add(back);
      const grid = new THREE.GridHelper(56, 28, 0x2a2a48, 0x1c1c34);
      grid.rotation.x = Math.PI / 2;
      grid.position.z = -3.9;
      scene.add(grid);

      const seg = quality === "low" ? 14 : 24;
      fruitGeo = new THREE.SphereGeometry(1.2, seg, seg);
      halfGeo = new THREE.SphereGeometry(1.2, seg, Math.round(seg / 2), 0, Math.PI);
      bombGeo = new THREE.SphereGeometry(1.2, seg, seg);
      ringGeo = new THREE.TorusGeometry(0.75, 0.12, 8, 24);
      bombMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.4, metalness: 0.4 });
      ringMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.2 });

      trailPos = new Float32Array(MAXT * 3);
      const tg = new THREE.BufferGeometry();
      tg.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
      tg.setDrawRange(0, 0);
      trailLine = new THREE.Line(tg, new THREE.LineBasicMaterial({ color: 0xc4b5fd }));
      trailLine.frustumCulled = false;
      scene.add(trailLine);

      window.SliceState.render3d = true;
    },
    frame({ dt, elapsed }) {
      const S = window.SliceState;
      if (!S || !T) return;

      const items = S.items() || [];
      const alive = new Set(items);
      items.forEach((it) => {
        let m = itemMap.get(it);
        if (!m) {
          if (it.bomb) {
            m = new T.Mesh(bombGeo, bombMat);
            const ring = new T.Mesh(ringGeo, ringMat);
            ring.position.z = 0.9;
            m.add(ring);
          } else {
            m = new T.Mesh(fruitGeo, matFor(it.color));
          }
          sceneRef.add(m);
          itemMap.set(it, m);
        }
        m.position.set(wx(it.x), wy(it.y), 0);
        m.rotation.x = elapsed * 2 + it.x * 0.01;
        m.rotation.y = elapsed * 1.5;
      });
      itemMap.forEach((m, it) => {
        if (!alive.has(it)) { sceneRef.remove(m); itemMap.delete(it); }
      });

      const halves = S.halves() || [];
      const hAlive = new Set(halves);
      halves.forEach((h) => {
        let m = halfMap.get(h);
        if (!m) {
          m = new T.Mesh(halfGeo, matFor(h.color));
          m.rotation.y = h.s < 0 ? -Math.PI / 2 : Math.PI / 2;
          sceneRef.add(m);
          halfMap.set(h, m);
        }
        m.position.set(wx(h.x), wy(h.y), 0.3);
        m.rotation.z += dt * 4 * h.s;
        m.scale.setScalar(Math.max(0.05, h.life + 0.2));
      });
      halfMap.forEach((m, h) => {
        if (!hAlive.has(h)) { sceneRef.remove(m); halfMap.delete(h); }
      });

      const trail = S.trail() || [];
      const n = Math.min(MAXT, trail.length);
      for (let i = 0; i < n; i++) {
        const p = trail[trail.length - n + i];
        trailPos[i * 3] = wx(p.x);
        trailPos[i * 3 + 1] = wy(p.y);
        trailPos[i * 3 + 2] = 1.5;
      }
      trailLine.geometry.setDrawRange(0, n > 1 ? n : 0);
      trailLine.geometry.attributes.position.needsUpdate = true;
    },
  });
} catch (e) {
  if (window.SliceState) window.SliceState.render3d = false;
}
