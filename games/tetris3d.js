import { createScene } from "@kreova/scene";

try {
  let T, mesh, dummy, col, cap = 232;

  createScene({
    canvas: "#game3d",
    game: true,
    label: "Tetris, 3D view",
    build({ THREE, scene, camera }) {
      T = THREE;
      scene.background = new THREE.Color(0x0a0a14);
      camera.fov = 40;
      camera.position.set(0, -7, 33);
      camera.lookAt(0, -0.5, 0);
      camera.updateProjectionMatrix();

      scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x1a1030, 1.1));
      const sun = new THREE.DirectionalLight(0xffffff, 1.6);
      sun.position.set(-6, -10, 18);
      scene.add(sun);

      const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 20), new THREE.MeshStandardMaterial({ color: 0x10101c, roughness: 0.9 }));
      floor.position.z = -0.55;
      scene.add(floor);
      const grid = new THREE.GridHelper(20, 20, 0x2a2a48, 0x1c1c34);
      grid.rotation.x = Math.PI / 2;
      grid.scale.x = 0.5;
      grid.position.z = -0.53;
      scene.add(grid);

      const wallMat = new THREE.MeshStandardMaterial({ color: 0x6d4fd8, emissive: 0x2a1670, roughness: 0.4 });
      const side = new THREE.BoxGeometry(0.4, 20.4, 1.2);
      const l = new THREE.Mesh(side, wallMat); l.position.set(-5.2, 0, 0); scene.add(l);
      const r = new THREE.Mesh(side, wallMat); r.position.set(5.2, 0, 0); scene.add(r);
      const b = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.4, 1.2), wallMat); b.position.set(0, -10.2, 0); scene.add(b);

      mesh = new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.92, 0.92, 0.92),
        new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.25 }),
        cap
      );
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      dummy = new THREE.Object3D();
      col = new THREE.Color();
      for (let i = 0; i < cap; i++) mesh.setColorAt(i, col.set(0xffffff));
      scene.add(mesh);
      window.Tetris3D.render3d = true;
    },
    frame({ elapsed }) {
      const S = window.Tetris3D;
      if (!S || !T) return;
      let n = 0;
      const put = (x, y, color, s, z) => {
        if (n >= cap) return;
        dummy.position.set(x - (S.COLS - 1) / 2, (S.ROWS - 1) / 2 - y, z || 0);
        dummy.scale.setScalar(s);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(n, dummy.matrix);
        mesh.setColorAt(n, col.set(color));
        n++;
      };
      const board = S.board();
      if (board) board.forEach((row, y) => row.forEach((c, x) => { if (c) put(x, y, c, 1); }));
      const cur = S.cur();
      if (cur) {
        const gy = S.ghostY();
        cur.m.forEach((row, y) => row.forEach((v, x) => {
          if (!v) return;
          put(cur.x + x, gy + y, S.COLORS[cur.t], 0.4, -0.2);
          put(cur.x + x, cur.y + y, S.COLORS[cur.t], 1, 0.08 + Math.sin(elapsed * 4) * 0.04);
        }));
      }
      for (let i = n; i < cap; i++) {
        dummy.position.set(0, 0, -50);
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    },
  });
} catch (e) {
  if (window.Tetris3D) window.Tetris3D.render3d = false;
}
