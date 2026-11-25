import * as THREE from 'three';
import { createGrassTexture, createRoadTexture } from './textures';

export interface WorldEnvironment {
  group: THREE.Group;
  clouds: THREE.Group[];
  sunLight: THREE.DirectionalLight;
  dispose: () => void;
}

export function buildStorybookWorld(
  scene: THREE.Scene,
  maxAnisotropy: number,
  isSoftwareGl: boolean,
): WorldEnvironment {
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];

  // Bright pastel storybook sky + matching horizon fog (no boxed-in void!)
  const skyColor = new THREE.Color('#D9F0FF');
  scene.background = skyColor;
  scene.fog = new THREE.Fog('#D9F0FF', 34, 96);

  // 3-Point Sunlit Outdoor Rig (warm key sun + cool sky/meadow hemisphere + gentle rim)
  const hemiLight = new THREE.HemisphereLight('#E0F4FF', '#7BC950', 0.95);
  hemiLight.position.set(0, 40, 0);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight('#FFF5DC', 1.65);
  sunLight.position.set(16, 26, 18);
  if (!isSoftwareGl) {
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 75;
    const d = 20;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
  }
  scene.add(sunLight);

  const rimLight = new THREE.DirectionalLight('#BAE6FD', 0.55);
  rimLight.position.set(-18, 12, -16);
  scene.add(rimLight);

  // Expansive meadow ground (flat at y=0 inside playable area)
  const grassTex = createGrassTexture(maxAnisotropy);
  disposables.push(grassTex);

  const groundGeo = new THREE.CircleGeometry(110, 48);
  const groundMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 0.9,
    metalness: 0.0,
  });
  disposables.push(groundGeo, groundMat);
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  group.add(ground);

  // Central Town Plaza & Mission Boulevard (offset by y=0.025 + polygonOffset so zero Z-fighting)
  const roadTex = createRoadTexture(maxAnisotropy);
  disposables.push(roadTex);

  const plazaGeo = new THREE.CircleGeometry(10.8, 40);
  const plazaMat = new THREE.MeshStandardMaterial({
    color: '#64748B',
    roughness: 0.85,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  disposables.push(plazaGeo, plazaMat);
  const plaza = new THREE.Mesh(plazaGeo, plazaMat);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.set(0, 0.02, -3.5);
  plaza.receiveShadow = true;
  group.add(plaza);

  // Inner sunny grass island ring
  const innerLawnGeo = new THREE.CircleGeometry(4.4, 32);
  const innerLawnMat = new THREE.MeshStandardMaterial({
    color: '#84D45A',
    roughness: 0.9,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  disposables.push(innerLawnGeo, innerLawnMat);
  const innerLawn = new THREE.Mesh(innerLawnGeo, innerLawnMat);
  innerLawn.rotation.x = -Math.PI / 2;
  innerLawn.position.set(0, 0.028, -3.5);
  innerLawn.receiveShadow = true;
  group.add(innerLawn);

  // Straight mission boulevard stretching left-right in front
  const roadGeo = new THREE.PlaneGeometry(88, 5.2);
  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.84,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  disposables.push(roadGeo, roadMat);
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.032, 3.2);
  road.receiveShadow = true;
  group.add(road);

  // Gentle sunlit storybook rolling hills ringing the outer perimeter
  const hillGeo = new THREE.SphereGeometry(1, 20, 14);
  const hillColors = ['#6DC049', '#7ED159', '#61B440', '#8AD964'];
  const hillSpecs = [
    { x: -28, z: -26, sx: 14, sy: 5.5, sz: 12 },
    { x: -10, z: -32, sx: 16, sy: 6.8, sz: 13 },
    { x: 12, z: -31, sx: 15, sy: 6.2, sz: 12 },
    { x: 30, z: -24, sx: 14, sy: 5.2, sz: 11 },
    { x: -34, z: -6, sx: 12, sy: 4.5, sz: 12 },
    { x: 34, z: -4, sx: 12, sy: 4.8, sz: 13 },
    { x: 0, z: -38, sx: 22, sy: 8.0, sz: 14 },
  ];
  disposables.push(hillGeo);
  hillSpecs.forEach((h, i) => {
    const mat = new THREE.MeshStandardMaterial({
      color: hillColors[i % hillColors.length],
      roughness: 0.92,
      metalness: 0,
    });
    disposables.push(mat);
    const hill = new THREE.Mesh(hillGeo, mat);
    hill.scale.set(h.sx, h.sy, h.sz);
    hill.position.set(h.x, -h.sy * 0.25, h.z);
    hill.receiveShadow = true;
    group.add(hill);
  });

  // Instanced Storybook Trees (trunks + layered crowns with ±15% scale & tint variation)
  const treeCoords: [number, number][] = [];
  for (let i = 0; i < 42; i++) {
    const angle = (i / 42) * Math.PI * 2;
    const radius = 17 + (i % 4) * 5.2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius - 4;
    // Keep front mission camera corridor and road clear
    if (z > 0.2 && z < 9.5 && Math.abs(x) < 19) continue;
    if (z > 6 && Math.abs(x) < 16) continue;
    treeCoords.push([x, z]);
  }

  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.28, 1.35, 8);
  trunkGeo.translate(0, 0.675, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#8B5A2B', roughness: 0.9 });
  const crownGeo = new THREE.ConeGeometry(1.18, 2.3, 10);
  crownGeo.translate(0, 2.25, 0);
  const crownMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.78 });
  const topCrownGeo = new THREE.SphereGeometry(0.85, 10, 8);
  topCrownGeo.translate(0, 2.85, 0);
  const topCrownMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.76 });

  disposables.push(trunkGeo, trunkMat, crownGeo, crownMat, topCrownGeo, topCrownMat);

  const count = treeCoords.length;
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
  const crowns = new THREE.InstancedMesh(crownGeo, crownMat, count);
  const tops = new THREE.InstancedMesh(topCrownGeo, topCrownMat, count);
  trunks.castShadow = !isSoftwareGl;
  crowns.castShadow = !isSoftwareGl;
  tops.castShadow = !isSoftwareGl;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const foliagePalette = ['#38A169', '#2F9E44', '#40C057', '#51CF66', '#2B8A3E'];

  treeCoords.forEach(([x, z], idx) => {
    const sc = 0.85 + ((idx * 37) % 30) / 100; // ±15% natural scale variation
    dummy.position.set(x, 0, z);
    dummy.rotation.y = (idx * 1.1) % (Math.PI * 2);
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    trunks.setMatrixAt(idx, dummy.matrix);
    crowns.setMatrixAt(idx, dummy.matrix);
    tops.setMatrixAt(idx, dummy.matrix);

    color.set(foliagePalette[idx % foliagePalette.length]);
    crowns.setColorAt(idx, color);
    color.offsetHSL(0.01, 0.02, 0.06);
    tops.setColorAt(idx, color);
  });
  trunks.instanceMatrix.needsUpdate = true;
  crowns.instanceMatrix.needsUpdate = true;
  tops.instanceMatrix.needsUpdate = true;
  if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
  if (tops.instanceColor) tops.instanceColor.needsUpdate = true;
  trunks.computeBoundingSphere();
  crowns.computeBoundingSphere();
  tops.computeBoundingSphere();
  group.add(trunks, crowns, tops);

  // Charming Distant Storybook Cottages ringing the town backdrop
  const cottageSpecs = [
    { x: -16, z: -15, wall: '#FEF3C7', roof: '#EF4444', rotY: 0.45 },
    { x: -6, z: -18.5, wall: '#DBEAFE', roof: '#2563EB', rotY: 0.1 },
    { x: 6.5, z: -18.2, wall: '#FCE7F3', roof: '#EC4899', rotY: -0.15 },
    { x: 16.5, z: -14.5, wall: '#DCFCE7', roof: '#F59E0B', rotY: -0.5 },
  ];
  const winMat = new THREE.MeshStandardMaterial({ color: '#93C5FD', roughness: 0.2, metalness: 0.15 });
  const doorMat = new THREE.MeshStandardMaterial({ color: '#92400E', roughness: 0.7 });
  disposables.push(winMat, doorMat);

  for (const c of cottageSpecs) {
    const house = new THREE.Group();
    house.position.set(c.x, 0, c.z);
    house.rotation.y = c.rotY;

    const wallGeo = new THREE.BoxGeometry(3.2, 2.3, 2.6);
    const wallMat = new THREE.MeshStandardMaterial({ color: c.wall, roughness: 0.8 });
    const roofGeo = new THREE.ConeGeometry(2.55, 1.55, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: c.roof, roughness: 0.6 });
    disposables.push(wallGeo, wallMat, roofGeo, roofMat);

    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.y = 1.15;
    wall.castShadow = !isSoftwareGl;
    wall.receiveShadow = true;
    house.add(wall);

    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 3.02;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = !isSoftwareGl;
    house.add(roof);

    const door = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.05, 0.12), doorMat);
    door.position.set(0, 0.525, 1.3);
    house.add(door);

    for (const wx of [-0.95, 0.95]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.56, 0.12), winMat);
      win.position.set(wx, 1.38, 1.3);
      house.add(win);
    }

    group.add(house);
  }

  // Fluffy 3D Storybook Clouds drifting gently across the sky
  const cloudMat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    roughness: 0.95,
    metalness: 0,
  });
  const puffGeo = new THREE.SphereGeometry(1, 12, 10);
  disposables.push(cloudMat, puffGeo);

  const clouds: THREE.Group[] = [];
  const cloudPositions = [
    [-18, 13.5, -18],
    [-2, 15.2, -24],
    [15, 14.0, -20],
    [28, 13.2, -14],
    [-26, 14.8, -10],
  ];
  for (const [cx, cy, cz] of cloudPositions) {
    const cloud = new THREE.Group();
    cloud.position.set(cx, cy, cz);
    const offsets: [number, number, number, number][] = [
      [0, 0.25, 0, 1.45],
      [-1.3, -0.05, 0.1, 1.1],
      [1.35, -0.05, -0.1, 1.15],
      [0.5, 0.55, 0.2, 0.95],
    ];
    for (const [ox, oy, oz, r] of offsets) {
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set(ox, oy, oz);
      puff.scale.set(r, r * 0.72, r * 0.85);
      cloud.add(puff);
    }
    group.add(cloud);
    clouds.push(cloud);
  }

  scene.add(group);

  return {
    group,
    clouds,
    sunLight,
    dispose: () => {
      scene.remove(group);
      scene.remove(hemiLight);
      scene.remove(sunLight);
      scene.remove(rimLight);
      disposables.forEach((d) => d.dispose());
    },
  };
}
