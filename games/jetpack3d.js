import { createScene } from "@kreova/scene";

// 3D view of Jetpack Flight. Reads state from window.JetState (games/jetpack.js).
const U = 20; // canvas pixels per world unit
const STEP = 6; // width of one corridor column in canvas pixels
let handle = null;
try {
  let T, walls, dummy, col, ship, flame, glow, cols;

  handle = createScene({
    canvas: "#jet3d",
    game: true,
    label: "Jetpack Flight, 3D view",
    build({ THREE, scene, camera }) {
      T = THREE;
      const S = window.JetState;
      scene.background = new THREE.Color(0x0a0a14);
      camera.fov = 40;
      camera.position.set(-1.5, -3.5, 25);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x1a1030, 1.1));
      const sun = new THREE.DirectionalLight(0xffffff, 1.5);
      sun.position.set(-6, -8, 16);
      scene.add(sun);

      // corridor: one ceiling box and one floor box per column
      cols = Math.ceil(S.W / STEP) + 1;
      walls = new THREE.InstancedMesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x5b3fc4, emissive: 0x1d1050, roughness: 0.45, metalness: 0.2 }),
        cols * 2
      );
      walls.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      walls.frustumCulled = false;
      dummy = new THREE.Object3D();
      col = new THREE.Color();
      scene.add(walls);

      // the pilot: rounded body, visor and a jet nozzle
      ship = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.3, metalness: 0.3 })
      );
      ship.add(body);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.2), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x9fb4ff }));
      visor.position.set(0.22, 0.12, 0.62);
      ship.add(visor);
      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.5), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4 }));
      pack.position.set(-0.6, 0, 0);
      ship.add(pack);
      flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 1, 10).rotateX(Math.PI),
        new THREE.MeshStandardMaterial({ color: 0xfb923c, emissive: 0xf97316, emissiveIntensity: 1.5 })
      );
      flame.position.set(-0.6, -0.8, 0);
      ship.add(flame);
      scene.add(ship);
      glow = new THREE.PointLight(0xfb923c, 0, 8, 1.6);
      scene.add(glow);
      S.render3d = true;
    },
    frame({ elapsed }) {
      const S = window.JetState;
      if (!S || !T || !S.center) return;
      const h = S.half();
      let n = 0;
      for (let x = 0; x < S.W + STEP; x += STEP) {
        const cc = S.center(x);
        const wxw = (x + STEP / 2 - S.W / 2) / U;
        // ceiling spans canvas y from -40 to cc-h; floor from cc+h to H+40
        const topH = cc - h + 40, botH = S.H + 40 - (cc + h);
        dummy.position.set(wxw, (S.H / 2 - (-40 + topH / 2)) / U, 0);
        dummy.scale.set(STEP / U + 0.01, Math.max(0.01, topH / U), 3);
        dummy.updateMatrix();
        walls.setMatrixAt(n++, dummy.matrix);
        dummy.position.set(wxw, (S.H / 2 - (cc + h + botH / 2)) / U, 0);
        dummy.scale.set(STEP / U + 0.01, Math.max(0.01, botH / U), 3);
        dummy.updateMatrix();
        walls.setMatrixAt(n++, dummy.matrix);
      }
      walls.count = n;
      walls.instanceMatrix.needsUpdate = true;

      const sx = (S.PX - S.W / 2) / U, sy = (S.H / 2 - S.y) / U;
      ship.position.set(sx, sy, 0);
      ship.rotation.z = Math.max(-0.4, Math.min(0.4, (S.thrust && !S.locked ? 0.2 : -0.15)));
      ship.rotation.y = Math.sin(elapsed * 2) * 0.15;
      ship.children[0].material.color.set(S.locked ? 0x7f1d1d : 0x60a5fa);
      const on = S.thrust && !S.locked;
      flame.visible = on;
      flame.scale.set(1, 0.8 + Math.random() * 0.8, 1);
      glow.intensity = on ? 18 : 0;
      glow.position.set(sx - 0.6, sy - 1, 1.5);
    },
  });
} catch (e) {
  if (window.JetState) window.JetState.render3d = false;
}
