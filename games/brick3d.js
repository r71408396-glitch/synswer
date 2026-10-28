import { createScene } from "@kreova/scene";

const U = 20; // canvas pixels per world unit
const wx = (x) => (x - 200) / U;
const wy = (y) => (280 - y) / U;
const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316", "#06b6d4", "#ec4899"];

let handle = null;
try {
  let T, brickGeo, mats = {}, brickMap = new Map(), ballMeshes = [], pupMap = new Map(), pops = [];
  let paddle, ballMat, ballLight, ballGeo, sprites = {};
  let sceneRef, quality0;

  handle = createScene({
    canvas: "#brick3d",
    game: true,
    label: "Brick Breaker Survival, 3D view",
    build({ THREE, scene, camera, quality }) {
      T = THREE; sceneRef = scene; quality0 = quality;
      scene.background = new THREE.Color(0x0a0a14);
      camera.fov = 42;
      camera.position.set(0, -12, 38);
      camera.lookAt(0, -1.2, 0);
      camera.updateProjectionMatrix();

      scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x1a1030, 1.1));
      const sun = new THREE.DirectionalLight(0xffffff, 1.5);
      sun.position.set(-6, -8, 16);
      scene.add(sun);
      ballLight = new THREE.PointLight(0x9fb4ff, 40, 12, 1.6);
      ballLight.position.set(0, 0, 3);
      scene.add(ballLight);

      // floor and walls
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 28), new THREE.MeshStandardMaterial({ color: 0x12121f, roughness: 0.9 }));
      floor.position.z = -0.6;
      scene.add(floor);
      const grid = new THREE.GridHelper(28, 28, 0x2a2a48, 0x1c1c34);
      grid.rotation.x = Math.PI / 2;
      grid.scale.x = 20 / 28;
      grid.position.z = -0.58;
      scene.add(grid);
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x6d4fd8, emissive: 0x2a1670, roughness: 0.4 });
      const side = new THREE.BoxGeometry(0.4, 28.4, 1.2);
      const l = new THREE.Mesh(side, wallMat); l.position.set(-10.2, 0, 0); scene.add(l);
      const r = new THREE.Mesh(side, wallMat); r.position.set(10.2, 0, 0); scene.add(r);
      const top = new THREE.Mesh(new THREE.BoxGeometry(20.8, 0.4, 1.2), wallMat); top.position.set(0, 14.2, 0); scene.add(top);

      const S = window.BrickState;
      const danger = new THREE.Mesh(new THREE.BoxGeometry(20, 0.1, 0.1), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.4 }));
      danger.position.set(0, wy(S.LINE), 0.1);
      scene.add(danger);

      brickGeo = new THREE.BoxGeometry(S.BW / U - 0.08, S.BH / U - 0.08, 0.9);
      COLORS.forEach((c) => { mats[c] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.25 }); });

      paddle = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.3, 1, 4, 14).rotateZ(Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x8b5cf6, emissive: 0x3b1d95, roughness: 0.3, metalness: 0.4 })
      );
      paddle.position.set(0, wy(S.PY + 6), 0.1);
      scene.add(paddle);

      ballGeo = new THREE.SphereGeometry(S.BR / U, quality === "low" ? 12 : 24, quality === "low" ? 12 : 24);
      ballMat = new THREE.MeshStandardMaterial({ color: 0xdbeafe, emissive: 0x6f8cff, emissiveIntensity: 0.8, roughness: 0.2 });

      // power-up sprites with a letter on a coloured disc
      Object.keys(S.TYPES).forEach((k) => {
        const cv = document.createElement("canvas");
        cv.width = cv.height = 96;
        const g = cv.getContext("2d");
        g.beginPath(); g.arc(48, 48, 42, 0, Math.PI * 2);
        g.fillStyle = S.TYPES[k].c; g.fill();
        g.lineWidth = 6; g.strokeStyle = "rgba(255,255,255,.85)"; g.stroke();
        g.fillStyle = "#fff"; g.font = "800 54px Sora, Inter, sans-serif";
        g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(S.TYPES[k].l, 48, 52);
        const tex = new THREE.CanvasTexture(cv);
        sprites[k] = new THREE.SpriteMaterial({ map: tex, transparent: true });
      });

      S.render3d = true;
    },
    frame({ dt, elapsed, camera }) {
      const S = window.BrickState;
      if (!S || !T) return;

      // bricks: sync meshes to game bricks
      const alive = new Set(S.bricks);
      S.bricks.forEach((b) => {
        let m = brickMap.get(b);
        if (!m) {
          m = new T.Mesh(brickGeo, mats[b.color] || mats[COLORS[0]]);
          m.position.z = 0;
          sceneRef.add(m);
          brickMap.set(b, m);
        }
        m.position.x = wx(b.x + S.BW / 2);
        m.position.y = wy(b.y + S.BH / 2);
      });
      brickMap.forEach((m, b) => {
        if (!alive.has(b)) { brickMap.delete(b); pops.push({ m, t: 0 }); }
      });
      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i];
        p.t += dt * 4;
        p.m.scale.setScalar(Math.max(0.01, 1 + p.t * 0.5 - p.t * p.t * 1.5));
        p.m.position.z += dt * 6;
        p.m.rotation.x += dt * 8;
        if (p.t >= 1) { sceneRef.remove(p.m); pops.splice(i, 1); }
      }

      // paddle
      const wide = S.pw / 84;
      paddle.scale.x = (S.pw / U) / 1.6;
      paddle.position.x = wx(S.px);
      paddle.material.color.set(S.eff.wide > 0 ? 0x22c55e : S.eff.fire > 0 ? 0xf97316 : 0x8b5cf6);

      // balls
      while (ballMeshes.length < S.balls.length) {
        const bm = new T.Mesh(ballGeo, ballMat);
        sceneRef.add(bm);
        ballMeshes.push(bm);
      }
      ballMeshes.forEach((bm, i) => {
        const b = S.balls[i];
        bm.visible = !!b;
        if (b) bm.position.set(wx(b.x), wy(b.y), 0);
      });
      ballMat.emissive.set(S.eff.fire > 0 ? 0xff6a00 : S.eff.slow > 0 ? 0x22d3ee : 0x6f8cff);
      if (S.balls[0]) ballLight.position.set(wx(S.balls[0].x), wy(S.balls[0].y), 2.5);
      ballLight.color.set(S.eff.fire > 0 ? 0xff7a1a : 0x9fb4ff);

      // power-ups
      const seen = new Set(S.pups);
      S.pups.forEach((p) => {
        let s = pupMap.get(p);
        if (!s) {
          s = new T.Sprite(sprites[p.t]);
          s.scale.set(1.3, 1.3, 1);
          sceneRef.add(s);
          pupMap.set(p, s);
        }
        s.position.set(wx(p.x), wy(p.y), 0.6 + Math.sin(elapsed * 6) * 0.15);
      });
      pupMap.forEach((s, p) => { if (!seen.has(p)) { sceneRef.remove(s); pupMap.delete(p); } });

      // a gentle camera sway that follows the paddle
      const tx = wx(S.px) * 0.18;
      camera.position.x += (tx - camera.position.x) * Math.min(1, dt * 4);
      camera.lookAt(camera.position.x * 0.4, -1.2, 0);
    },
  });
} catch (e) {
  if (window.BrickState) window.BrickState.render3d = false;
}
