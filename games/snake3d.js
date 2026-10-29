import { createScene } from "@kreova/scene";

try {
  let T, body, dummy, col, foodMesh, cap = 400;

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

      body = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.46, 12, 9),
        new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.2 }),
        cap
      );
      body.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      body.frustumCulled = false;
      dummy = new THREE.Object3D();
      col = new THREE.Color();
      for (let i = 0; i < cap; i++) body.setColorAt(i, col.set(0x8b5cf6));
      scene.add(body);

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
      let n = 0;
      snake.forEach((s, i) => {
        if (n >= cap) return;
        const head = i === 0;
        dummy.position.set(s.x - off, off - s.y, head ? 0.15 : 0);
        dummy.scale.setScalar(head ? 1.15 : 1 - Math.min(0.25, i * 0.01));
        dummy.updateMatrix();
        body.setMatrixAt(n, dummy.matrix);
        body.setColorAt(n, col.set(head ? 0xc4b5fd : i % 2 ? 0x8b5cf6 : 0x7c3aed));
        n++;
      });
      for (let i = n; i < cap; i++) {
        dummy.position.set(0, 0, -50);
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
        body.setMatrixAt(i, dummy.matrix);
      }
      body.instanceMatrix.needsUpdate = true;
      if (body.instanceColor) body.instanceColor.needsUpdate = true;

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
