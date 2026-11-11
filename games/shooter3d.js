import { createScene } from "@kreova/scene";

const U = 20; // canvas pixels per world unit
const wx = (x) => (x - 210) / U;
const wy = (y) => (280 - y) / U;
const MAXP = 240;

try {
  let T, sceneRef, ship, shipFlame, bulletGeo, bulletMat, ebGeo, ebMat;
  let geoA, geoB, matA, matB, bossGroup, bossBody, bossMats = [], bossLevelShown = 0;
  let starPts, starPos, starSpeed, partPts, partPos, partCol, col;
  const bulletMap = new Map(), enemyMap = new Map(), ebMap = new Map(), puMap = new Map();
  let pierceMat, puGeo, puMat, shieldMesh;

  const BOSS_COLORS = [0xdc2626, 0x7c3aed, 0x0891b2];

  createScene({
    canvas: "#game3d",
    game: true,
    label: "Space Shooter, 3D view",
    build({ THREE, scene, camera, quality }) {
      T = THREE; sceneRef = scene;
      scene.background = new THREE.Color(0x05050a);
      camera.fov = 40;
      camera.position.set(0, 0, 38.5);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x1a1030, 1.1));
      const sun = new THREE.DirectionalLight(0xffffff, 1.7);
      sun.position.set(-8, 10, 20);
      scene.add(sun);

      // player ship: a nose cone with two swept wings
      ship = new THREE.Group();
      const hullMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.3, metalness: 0.5, emissive: 0x2a1670 });
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.9, 14), hullMat);
      ship.add(nose);
      const wingGeo = new THREE.BoxGeometry(1.5, 0.9, 0.18);
      const wl = new THREE.Mesh(wingGeo, hullMat); wl.position.set(-0.75, -0.55, 0); wl.rotation.z = 0.5; ship.add(wl);
      const wr = new THREE.Mesh(wingGeo, hullMat); wr.position.set(0.75, -0.55, 0); wr.rotation.z = -0.5; ship.add(wr);
      shipFlame = new THREE.Mesh(
        new THREE.ConeGeometry(0.28, 1, 10).rotateX(Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x60a5fa, emissive: 0x2563eb, emissiveIntensity: 1.6 })
      );
      shipFlame.position.y = -1.3;
      ship.add(shipFlame);
      scene.add(ship);

      const seg = quality === "low" ? 8 : 14;
      geoA = new THREE.OctahedronGeometry(0.95);
      geoB = new THREE.ConeGeometry(0.9, 1.7, seg).rotateX(Math.PI);
      matA = new THREE.MeshStandardMaterial({ color: 0xc026d3, roughness: 0.35, metalness: 0.3, emissive: 0x4a0f55 });
      matB = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.35, metalness: 0.3, emissive: 0x10305e });

      bulletGeo = new THREE.CapsuleGeometry(0.12, 0.5, 4, 8);
      bulletMat = new THREE.MeshStandardMaterial({ color: 0xc4b5fd, emissive: 0xa78bfa, emissiveIntensity: 1.6 });
      pierceMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, emissive: 0x0ea5e9, emissiveIntensity: 2 });
      puGeo = new THREE.OctahedronGeometry(0.6);
      puMat = (c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.2, roughness: 0.3 });
      shieldMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), new THREE.MeshBasicMaterial({ color: 0x4ade80, wireframe: true, transparent: true, opacity: 0.7 }));
      shieldMesh.visible = false;
      scene.add(shieldMesh);
      ebGeo = new THREE.SphereGeometry(0.28, 10, 10);
      ebMat = new THREE.MeshStandardMaterial({ color: 0xfb923c, emissive: 0xea580c, emissiveIntensity: 1.6 });

      // boss: armoured hull, cockpit dome and two cannons
      bossGroup = new THREE.Group();
      const mk = (c) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.5, emissive: 0x000000 }); bossMats.push(m); return m; };
      bossBody = new THREE.Mesh(new THREE.BoxGeometry(6, 2.6, 1.6), mk(BOSS_COLORS[0]));
      bossGroup.add(bossBody);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 1.0), mk(BOSS_COLORS[0]));
      const wl2 = wing.clone(); wl2.position.set(-3.2, 0.4, 0); wl2.rotation.z = 0.35; bossGroup.add(wl2);
      const wr2 = wing.clone(); wr2.position.set(3.2, 0.4, 0); wr2.rotation.z = -0.35; bossGroup.add(wr2);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12), new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xf59e0b, emissiveIntensity: 1 }));
      dome.position.set(0, 0, 0.9); bossGroup.add(dome);
      const gun = new THREE.CylinderGeometry(0.28, 0.36, 1.4, 10);
      [-1.8, 1.8].forEach((x) => { const g = new THREE.Mesh(gun, new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.7, roughness: 0.3 })); g.position.set(x, -1.6, 0); bossGroup.add(g); });
      bossGroup.visible = false;
      scene.add(bossGroup);

      // star field
      const SN = 90;
      starPos = new Float32Array(SN * 3);
      starSpeed = new Float32Array(SN);
      for (let i = 0; i < SN; i++) {
        starPos[i * 3] = (Math.random() - 0.5) * 24;
        starPos[i * 3 + 1] = (Math.random() - 0.5) * 32;
        starPos[i * 3 + 2] = -2 - Math.random() * 10;
        starSpeed[i] = 2 + Math.random() * 5;
      }
      const sg = new THREE.BufferGeometry();
      sg.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
      starPts = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xa78bfa, size: 0.16 }));
      starPts.frustumCulled = false;
      scene.add(starPts);

      // explosion sparks
      partPos = new Float32Array(MAXP * 3);
      partCol = new Float32Array(MAXP * 3);
      col = new THREE.Color();
      const pg = new THREE.BufferGeometry();
      pg.setAttribute("position", new THREE.BufferAttribute(partPos, 3));
      pg.setAttribute("color", new THREE.BufferAttribute(partCol, 3));
      pg.setDrawRange(0, 0);
      partPts = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.34, vertexColors: true }));
      partPts.frustumCulled = false;
      scene.add(partPts);

      window.ShooterState.render3d = true;
    },
    frame({ dt, elapsed }) {
      const S = window.ShooterState;
      if (!S || !T) return;

      // stars drift down
      for (let i = 0; i < starSpeed.length; i++) {
        starPos[i * 3 + 1] -= starSpeed[i] * dt;
        if (starPos[i * 3 + 1] < -16) { starPos[i * 3 + 1] = 16; starPos[i * 3] = (Math.random() - 0.5) * 24; }
      }
      starPts.geometry.attributes.position.needsUpdate = true;

      // player
      const p = S.player();
      if (p) {
        ship.position.set(wx(p.x), wy(p.y), 0);
        ship.rotation.z = Math.sin(elapsed * 2) * 0.04;
        const inv = S.inv();
        ship.visible = S.running() ? (inv <= 0 || Math.floor(inv * 10) % 2 === 0) : true;
        shipFlame.scale.y = 0.8 + Math.sin(elapsed * 40) * 0.3;
      }

      sync(S.bullets(), bulletMap, (b) => { const m = new T.Mesh(bulletGeo, b.pierce ? pierceMat : bulletMat); if (b.pierce) m.scale.set(1.6, 1.6, 1.6); return m; }, (m, b) => m.position.set(wx(b.x), wy(b.y), 0));
      sync(S.pickups(), puMap, (k) => new T.Mesh(puGeo, puMat(k.c)), (m, k) => { m.position.set(wx(k.x), wy(k.y), 0); m.rotation.y = elapsed * 3; m.rotation.x = elapsed * 1.5; });
      shieldMesh.visible = S.shield() && S.running();
      if (shieldMesh.visible) { shieldMesh.position.set(ship.position.x, ship.position.y, 0); shieldMesh.rotation.y = elapsed * 2; }
      sync(S.ebullets(), ebMap, () => new T.Mesh(ebGeo, ebMat), (m, b) => m.position.set(wx(b.x), wy(b.y), 0));
      sync(S.enemies(), enemyMap, (e) => new T.Mesh(e.kind ? geoB : geoA, e.kind ? matB : matA), (m, e) => {
        m.position.set(wx(e.x), wy(e.y), 0);
        m.rotation.y = elapsed * 2 + e.x * 0.02;
        if (!e.kind) m.rotation.x = elapsed * 1.4;
      });

      // boss
      const b = S.boss();
      bossGroup.visible = !!b;
      if (b) {
        if (b.hue !== bossLevelShown) {
          bossLevelShown = b.hue;
          bossMats.forEach((m, i) => { if (i < 3) m.color.set(BOSS_COLORS[b.hue]); });
        }
        bossGroup.position.set(wx(b.x), wy(b.y), 0);
        bossGroup.rotation.z = Math.sin(elapsed * 1.5) * 0.05;
        bossGroup.rotation.y = Math.sin(elapsed * 0.9) * 0.3;
        const k = b.flash > 0 ? 1.4 : Math.max(0, 0.5 * (1 - b.hp / b.max));
        bossMats.forEach((m, i) => { if (i < 3) { m.emissive.set(b.flash > 0 ? 0xffffff : 0xff2a00); m.emissiveIntensity = k; } });
      }

      // sparks
      const parts = S.parts();
      const n = Math.min(MAXP, parts.length);
      for (let i = 0; i < n; i++) {
        const q = parts[i];
        partPos[i * 3] = wx(q.x); partPos[i * 3 + 1] = wy(q.y); partPos[i * 3 + 2] = 0.5;
        col.set(q.c);
        const f = Math.min(1, q.life * 2);
        partCol[i * 3] = col.r * f; partCol[i * 3 + 1] = col.g * f; partCol[i * 3 + 2] = col.b * f;
      }
      partPts.geometry.setDrawRange(0, n);
      partPts.geometry.attributes.position.needsUpdate = true;
      partPts.geometry.attributes.color.needsUpdate = true;
    },
  });

  function sync(list, map, make, place) {
    const alive = new Set(list);
    list.forEach((o) => {
      let m = map.get(o);
      if (!m) { m = make(o); sceneRef.add(m); map.set(o, m); }
      place(m, o);
    });
    map.forEach((m, o) => { if (!alive.has(o)) { sceneRef.remove(m); map.delete(o); } });
  }
} catch (e) {
  if (window.ShooterState) window.ShooterState.render3d = false;
}
