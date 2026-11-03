import { createScene } from "@kreova/scene";

try {
  let T, body, dummy, col, foodMesh, headEyes = [], pupils = [], tongue = [], cap = 900;

  createScene({
    canvas: "#game3d",
    game: true,
    label: "Snake, 3D view",
    build({ THREE, scene, camera }) {
      T = THREE;
      scene.background = new THREE.Color(0x0a0a14);
      camera.fov = 40;
      camera.position.set(0, -15, 27);
      camera.lookAt(0, -0.5, 0);
      camera.updateProjectionMatrix();

      scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x1a1030, 1.1));
      const sun = new THREE.DirectionalLight(0xffffff, 1.6);
      sun.position.set(-6, -10, 18);
      scene.add(sun);

      const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: 0x10101c, roughness: 0.9 }));
      floor.position.z = -0.55;
      scene.add(floor);
      const grid = new THREE.GridHelper(20, 20, 0x2a2a48, 0x1c1c34);
      grid.rotation.x = Math.PI / 2;
      grid.position.z = -0.53;
      scene.add(grid);

      // glowing blue edges mark the portals where the snake wraps around
      const edgeMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x2563eb, emissiveIntensity: 1.2 });
      const h = new THREE.BoxGeometry(20.2, 0.12, 0.3), v = new THREE.BoxGeometry(0.12, 20.2, 0.3);
      [[0, 10, h], [0, -10, h], [-10, 0, v], [10, 0, v]].forEach(([x, y, g]) => {
        const m = new THREE.Mesh(g, edgeMat); m.position.set(x, y, -0.4); scene.add(m);
      });

      // body: many overlapping spheres, tapering to a tail, so it reads as one smooth scaly snake
      body = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.46, 14, 10),
        new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.1 }),
        cap
      );
      body.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      body.frustumCulled = false;
      dummy = new THREE.Object3D();
      col = new THREE.Color();
      for (let i = 0; i < cap; i++) body.setColorAt(i, col.set(0x22c55e));
      scene.add(body);

      const eyeGeo = new THREE.SphereGeometry(0.16, 10, 8);
      const pupilGeo = new THREE.SphereGeometry(0.085, 8, 6);
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0xfefce8, roughness: 0.2 });
      const pupilMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1 });
      for (let i = 0; i < 2; i++) {
        const e = new THREE.Mesh(eyeGeo, eyeMat); scene.add(e); headEyes.push(e);
        const p = new THREE.Mesh(pupilGeo, pupilMat); scene.add(p); pupils.push(p);
      }
      const tMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x7f1d1d, roughness: 0.4 });
      const stem = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.06), tMat);
      const f1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.05), tMat);
      const f2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.05), tMat);
      [stem, f1, f2].forEach((m) => { scene.add(m); tongue.push(m); });

      foodMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.5),
        new THREE.MeshStandardMaterial({ color: 0x60a5fa, emissive: 0x2563eb, emissiveIntensity: 1, roughness: 0.2 })
      );
      scene.add(foodMesh);
      window.SnakeState.render3d = true;
    },
    frame({ elapsed }) {
      const S = window.SnakeState;
      if (!S || !T) return;
      const N = S.N, off = (N - 1) / 2;
      const snake = S.snake() || [];
      const d = S.dir() || { x: 1, y: 0 };

      // build a denser path: every segment plus a point halfway to the next (not across a wall wrap)
      const pts = [];
      snake.forEach((s, i) => {
        const x = s.x - off, y = off - s.y;
        pts.push([x, y]);
        const nx = snake[i + 1];
        if (nx && Math.abs(nx.x - s.x) <= 1 && Math.abs(nx.y - s.y) <= 1) {
          pts.push([(x + nx.x - off) / 2, (y + off - nx.y) / 2]);
        }
      });

      let n = 0;
      const total = Math.max(1, pts.length);
      const hd = Math.atan2(-d.y, d.x);
      pts.forEach((p, i) => {
        if (n >= cap) return;
        const t = i / total;
        const r = i === 0 ? 1.0 : Math.max(0.35, 1.1 - 0.7 * Math.pow(t, 1.1));
        dummy.position.set(p[0], p[1], i === 0 ? 0.12 : 0);
        dummy.rotation.set(0, 0, i === 0 ? hd : 0);
        if (i === 0) dummy.scale.set(1.45, 1.05, 0.95); else dummy.scale.setScalar(r);
        dummy.updateMatrix();
        body.setMatrixAt(n, dummy.matrix);
        const c = i === 0 ? 0x4ade80 : (Math.floor(i / 2) % 3 === 1 ? 0x065f46 : (t > 0.6 ? 0x16a34a : 0x22c55e));
        body.setColorAt(n, col.set(c));
        n++;
      });
      dummy.rotation.set(0, 0, 0);
      for (let i = n; i < cap; i++) {
        dummy.position.set(0, 0, -50);
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
        body.setMatrixAt(i, dummy.matrix);
      }
      body.instanceMatrix.needsUpdate = true;
      if (body.instanceColor) body.instanceColor.needsUpdate = true;

      // head details: eyes and a flicking forked tongue
      const head = pts[0];
      if (head && headEyes.length) {
        const dx = d.x, dy = -d.y, px = -dy, py = dx;
        [-1, 1].forEach((side, k) => {
          headEyes[k].position.set(head[0] + dx * 0.28 + px * 0.3 * side, head[1] + dy * 0.28 + py * 0.3 * side, 0.46);
          pupils[k].position.set(head[0] + dx * 0.36 + px * 0.3 * side, head[1] + dy * 0.36 + py * 0.3 * side, 0.55);
        });
        const flick = Math.max(0, Math.sin(elapsed * 6)) * 0.35 + 0.15;
        const tx = head[0] + dx * (0.7 + flick), ty = head[1] + dy * (0.7 + flick);
        tongue[0].position.set(tx, ty, 0.1);
        tongue[0].rotation.z = hd;
        const ex = tx + dx * 0.28, ey = ty + dy * 0.28;
        tongue[1].position.set(ex, ey + 0.0 + px * 0.06 * 0, 0.1);
        tongue[1].position.set(ex + px * 0.07, ey + py * 0.07, 0.1);
        tongue[1].rotation.z = hd + 0.5;
        tongue[2].position.set(ex - px * 0.07, ey - py * 0.07, 0.1);
        tongue[2].rotation.z = hd - 0.5;
      }

      const f = S.food();
      if (f) {
        foodMesh.position.set(f.x - off, off - f.y, 0.2 + Math.sin(elapsed * 4) * 0.12);
        foodMesh.rotation.z = elapsed * 2;
        foodMesh.rotation.x = elapsed * 1.3;
      }
    },
  });
} catch (e) {
  if (window.SnakeState) window.SnakeState.render3d = false;
}
