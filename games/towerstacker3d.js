import { createScene } from "@kreova/scene";

// 3D view of Tower Stacker. Reads state from window.TowerState (games/towerstacker.js).
const U = 20; // canvas pixels per world unit
let handle = null;
try {
  let T, mesh, dummy, col, ground, cap = 64;

  handle = createScene({
    canvas: "#tower3d",
    game: true,
    label: "Tower Stacker, 3D view",
    build({ THREE, scene, camera }) {
      T = THREE;
      scene.background = new THREE.Color(0x0a0a14);
      camera.fov = 40;
      camera.position.set(6, -10, 40);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x1a1030, 1.1));
      const sun = new THREE.DirectionalLight(0xffffff, 1.6);
      sun.position.set(-8, -6, 20);
      scene.add(sun);

      // a plinth the tower stands on; it slides out of view as the tower grows
      ground = new THREE.Mesh(
        new THREE.BoxGeometry(60, 3, 6),
        new THREE.MeshStandardMaterial({ color: 0x1c1c30, roughness: 0.8 })
      );
      scene.add(ground);

      mesh = new THREE.InstancedMesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.25 }),
        cap
      );
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      dummy = new THREE.Object3D();
      col = new THREE.Color();
      for (let i = 0; i < cap; i++) mesh.setColorAt(i, col.set(0xffffff));
      scene.add(mesh);
      window.TowerState.render3d = true;
    },
    frame({ elapsed }) {
      const S = window.TowerState;
      if (!S || !T) return;
      const g = S.get();
      if (!g.blocks) return;
      const PAL = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316", "#06b6d4", "#ec4899"];
      let n = 0;
      const put = (x, w, i, color, lift) => {
        // canvas top of this block, then its centre in world units
        const top = S.BASE - i * S.BH + g.cam;
        const cy = top + (S.BH - 2) / 2;
        if (cy < -S.BH * 2 || cy > S.H + S.BH * 2 || n >= cap) return;
        dummy.position.set((x + w / 2 - S.W / 2) / U, (S.H / 2 - cy) / U, lift || 0);
        dummy.scale.set(w / U, (S.BH - 2) / U, 3);
        dummy.updateMatrix();
        mesh.setMatrixAt(n, dummy.matrix);
        mesh.setColorAt(n, col.set(color));
        n++;
      };
      g.blocks.forEach((b, i) => put(b.x, b.w, i, b.c, 0));
      put(g.mx, g.mw, g.blocks.length, g.flash > 0 ? "#86efac" : PAL[g.blocks.length % 8], Math.sin(elapsed * 6) * 0.15);
      for (let i = n; i < cap; i++) {
        dummy.position.set(0, 0, -50);
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      ground.position.set(0, (S.H / 2 - (S.BASE + g.cam + S.BH + 1)) / U, 0);
    },
  });
} catch (e) {
  if (window.TowerState) window.TowerState.render3d = false;
}
