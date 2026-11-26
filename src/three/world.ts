import * as THREE from 'three';
import {
  createAwningStripeTexture,
  createCobblestoneTexture,
  createCottageWallTexture,
  createFoliageTexture,
  createGrassTexture,
  createHillPatchworkTexture,
  createRoadTexture,
  createRoofShingleTexture,
  createStoneWallTexture,
  createWatercolorSkyTexture,
  createWoodPlankTexture,
  getPaperBumpTexture,
} from './textures';

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
  const paperBump = getPaperBumpTexture(maxAnisotropy);

  // Sunny Morning Watercolor Sky Dome + Warm Cream-Mist Horizon Fog
  const skyColor = new THREE.Color('#DCEAF0');
  scene.background = skyColor;
  scene.fog = new THREE.Fog('#EDE6CE', 38, 112);

  const skyTex = createWatercolorSkyTexture(maxAnisotropy);
  const skyGeo = new THREE.SphereGeometry(126, 28, 18);
  const skyMat = new THREE.MeshBasicMaterial({
    map: skyTex,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  });
  disposables.push(skyTex, skyGeo, skyMat);
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  skyDome.rotation.y = -0.35;
  group.add(skyDome);

  // 3-Point Sunny Morning Storybook Lighting Rig
  // Cerulean watercolor sky zenith -> warm golden-olive meadow ground bounce
  const hemiLight = new THREE.HemisphereLight('#C6E4F7', '#89AC4F', 1.05);
  hemiLight.position.set(0, 40, 0);
  scene.add(hemiLight);

  // Warm golden morning sunlight from upper-right (matching start screen glow)
  const sunLight = new THREE.DirectionalLight('#FFEDC6', 1.75);
  sunLight.position.set(18, 23, 16);
  if (!isSoftwareGl) {
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 75;
    const d = 21;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
  }
  scene.add(sunLight);

  // Soft cool morning sky rim light so shaded sides stay airy & illustrated
  const rimLight = new THREE.DirectionalLight('#CBE8F8', 0.52);
  rimLight.position.set(-18, 12, -16);
  scene.add(rimLight);

  // Expansive sun-dappled meadow ground (flat at y=0 inside playable area)
  const grassTex = createGrassTexture(maxAnisotropy);
  disposables.push(grassTex);

  const groundGeo = new THREE.CircleGeometry(114, 48);
  const groundMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    bumpMap: paperBump,
    bumpScale: 0.025,
    roughness: 0.92,
    metalness: 0.0,
  });
  disposables.push(groundGeo, groundMat);
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  group.add(ground);

  // Central Sandstone Cobblestone Town Plaza (matching start screen town square)
  const cobbleTex = createCobblestoneTexture(maxAnisotropy, 6, 6);
  const plazaGeo = new THREE.CircleGeometry(11.3, 44);
  const plazaMat = new THREE.MeshStandardMaterial({
    map: cobbleTex,
    bumpMap: paperBump,
    bumpScale: 0.03,
    roughness: 0.88,
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

  // Carved sandstone outer plaza curb ring
  const curbMat = new THREE.MeshStandardMaterial({
    color: '#D8CAB2',
    bumpMap: paperBump,
    bumpScale: 0.02,
    roughness: 0.88,
    metalness: 0.02,
  });
  const outerCurbGeo = new THREE.TorusGeometry(11.35, 0.16, 8, 56);
  disposables.push(curbMat, outerCurbGeo);
  const outerCurb = new THREE.Mesh(outerCurbGeo, curbMat);
  outerCurb.rotation.x = Math.PI / 2;
  outerCurb.position.set(0, 0.05, -3.5);
  outerCurb.scale.set(1, 1, 0.55);
  outerCurb.receiveShadow = true;
  group.add(outerCurb);

  // Inner Sunny Village Green Island + Stone Fountain (clear of all 6 parked trucks)
  const innerLawnGeo = new THREE.CircleGeometry(2.65, 32);
  const innerLawnMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    color: '#DDF0C4',
    roughness: 0.92,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const innerCurbGeo = new THREE.TorusGeometry(2.68, 0.14, 8, 36);
  disposables.push(innerLawnGeo, innerLawnMat, innerCurbGeo);

  const innerLawn = new THREE.Mesh(innerLawnGeo, innerLawnMat);
  innerLawn.rotation.x = -Math.PI / 2;
  innerLawn.position.set(0, 0.028, -3.5);
  innerLawn.receiveShadow = true;
  group.add(innerLawn);

  const innerCurb = new THREE.Mesh(innerCurbGeo, curbMat);
  innerCurb.rotation.x = Math.PI / 2;
  innerCurb.position.set(0, 0.06, -3.5);
  innerCurb.scale.set(1, 1, 0.6);
  innerCurb.receiveShadow = true;
  group.add(innerCurb);

  // Charming Miniature Tiered Stone Village Fountain in center of town green (echoing start screen)
  const fountainGroup = new THREE.Group();
  fountainGroup.position.set(0, 0.04, -3.5);
  const fountainStoneMat = new THREE.MeshStandardMaterial({
    color: '#CFC5B4',
    bumpMap: paperBump,
    bumpScale: 0.025,
    roughness: 0.84,
    metalness: 0.03,
  });
  const fountainWaterMat = new THREE.MeshStandardMaterial({
    color: '#7CC6DF',
    roughness: 0.18,
    metalness: 0.08,
    emissive: '#3B9BB8',
    emissiveIntensity: 0.12,
  });
  const basinOuterGeo = new THREE.CylinderGeometry(1.02, 1.12, 0.36, 20);
  const basinWaterGeo = new THREE.CylinderGeometry(0.88, 0.88, 0.32, 18);
  const pedestalGeo = new THREE.CylinderGeometry(0.24, 0.34, 0.82, 12);
  const upperBowlGeo = new THREE.CylinderGeometry(0.54, 0.24, 0.24, 16);
  const finialGeo = new THREE.SphereGeometry(0.16, 12, 10);
  disposables.push(
    fountainStoneMat,
    fountainWaterMat,
    basinOuterGeo,
    basinWaterGeo,
    pedestalGeo,
    upperBowlGeo,
    finialGeo,
  );
  const basinOuter = new THREE.Mesh(basinOuterGeo, fountainStoneMat);
  basinOuter.position.y = 0.18;
  basinOuter.castShadow = !isSoftwareGl;
  basinOuter.receiveShadow = true;
  const basinWater = new THREE.Mesh(basinWaterGeo, fountainWaterMat);
  basinWater.position.y = 0.22;
  const pedestal = new THREE.Mesh(pedestalGeo, fountainStoneMat);
  pedestal.position.y = 0.52;
  pedestal.castShadow = !isSoftwareGl;
  const upperBowl = new THREE.Mesh(upperBowlGeo, fountainStoneMat);
  upperBowl.position.y = 0.96;
  upperBowl.castShadow = !isSoftwareGl;
  const finial = new THREE.Mesh(finialGeo, fountainWaterMat);
  finial.position.y = 1.16;
  fountainGroup.add(basinOuter, basinWater, pedestal, upperBowl, finial);
  group.add(fountainGroup);

  // Straight Cobblestone Mission Boulevard stretching left-right in front
  const roadTex = createRoadTexture(maxAnisotropy);
  disposables.push(roadTex);

  const roadGeo = new THREE.PlaneGeometry(88, 5.2);
  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    bumpMap: paperBump,
    bumpScale: 0.028,
    roughness: 0.86,
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

  // Sun-Dappled Patchwork Rolling Countryside Hills ringing the outer perimeter
  const hillTex = createHillPatchworkTexture(maxAnisotropy);
  const hillGeo = new THREE.SphereGeometry(1, 24, 16);
  const hillTints = ['#E7F2C9', '#DCEBB8', '#D3E5AE', '#ECF4CF'];
  const hillSpecs = [
    { x: -30, z: -26, sx: 15, sy: 6.2, sz: 13 },
    { x: -11, z: -33, sx: 18, sy: 7.5, sz: 14 },
    { x: 13, z: -32, sx: 17, sy: 6.9, sz: 13 },
    { x: 32, z: -24, sx: 15, sy: 5.8, sz: 12 },
    { x: -36, z: -6, sx: 13, sy: 4.8, sz: 13 },
    { x: 36, z: -4, sx: 13, sy: 5.2, sz: 14 },
    { x: 0, z: -42, sx: 26, sy: 9.2, sz: 16 },
  ];
  disposables.push(hillTex, hillGeo);
  hillSpecs.forEach((h, i) => {
    const mat = new THREE.MeshStandardMaterial({
      map: hillTex,
      color: hillTints[i % hillTints.length],
      bumpMap: paperBump,
      bumpScale: 0.025,
      roughness: 0.94,
      metalness: 0,
    });
    disposables.push(mat);
    const hill = new THREE.Mesh(hillGeo, mat);
    hill.scale.set(h.sx, h.sy, h.sz);
    hill.position.set(h.x, -h.sy * 0.25, h.z);
    hill.receiveShadow = true;
    group.add(hill);
  });

  // Layered Painterly Storybook Oak Trees (warm curved bark + multi-cluster dappled canopies)
  const treeCoords: [number, number][] = [];
  for (let i = 0; i < 44; i++) {
    const angle = (i / 44) * Math.PI * 2;
    const radius = 17.5 + (i % 4) * 5.2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius - 4;
    // Keep front mission camera corridor and road completely clear
    if (z > 0.2 && z < 9.5 && Math.abs(x) < 19) continue;
    if (z > 6 && Math.abs(x) < 16) continue;
    // Keep clear of background cottage footprints
    if (z < -12 && z > -21 && Math.abs(x) < 20 && i % 3 === 0) continue;
    treeCoords.push([x, z]);
  }

  const foliageTex = createFoliageTexture(maxAnisotropy);
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.3, 1.6, 8);
  trunkGeo.translate(0, 0.8, 0);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: '#6E4C32',
    bumpMap: paperBump,
    bumpScale: 0.035,
    roughness: 0.92,
  });

  // Three overlapping storybook oak foliage puffs per tree (mid, sunlit crown, side tuft)
  const mainCrownGeo = new THREE.SphereGeometry(1.18, 12, 10);
  mainCrownGeo.scale(1.12, 0.88, 1.08);
  mainCrownGeo.translate(0, 2.25, 0);

  const topCrownGeo = new THREE.SphereGeometry(0.86, 10, 8);
  topCrownGeo.scale(1.06, 0.84, 1.0);
  topCrownGeo.translate(0.28, 2.95, 0.15);

  const sideCrownGeo = new THREE.SphereGeometry(0.76, 10, 8);
  sideCrownGeo.scale(1.08, 0.82, 1.0);
  sideCrownGeo.translate(-0.68, 2.02, -0.22);

  const mainCrownMat = new THREE.MeshStandardMaterial({
    map: foliageTex,
    color: '#FFFFFF',
    bumpMap: paperBump,
    bumpScale: 0.025,
    roughness: 0.86,
  });
  const topCrownMat = new THREE.MeshStandardMaterial({
    map: foliageTex,
    color: '#FFFFFF',
    bumpMap: paperBump,
    bumpScale: 0.02,
    roughness: 0.84,
  });
  const sideCrownMat = new THREE.MeshStandardMaterial({
    map: foliageTex,
    color: '#FFFFFF',
    bumpMap: paperBump,
    bumpScale: 0.025,
    roughness: 0.88,
  });

  disposables.push(
    trunkGeo,
    trunkMat,
    mainCrownGeo,
    mainCrownMat,
    topCrownGeo,
    topCrownMat,
    sideCrownGeo,
    sideCrownMat,
  );

  const count = treeCoords.length;
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
  const crowns = new THREE.InstancedMesh(mainCrownGeo, mainCrownMat, count);
  const tops = new THREE.InstancedMesh(topCrownGeo, topCrownMat, count);
  const sides = new THREE.InstancedMesh(sideCrownGeo, sideCrownMat, count);
  trunks.castShadow = !isSoftwareGl;
  crowns.castShadow = !isSoftwareGl;
  tops.castShadow = !isSoftwareGl;
  sides.castShadow = !isSoftwareGl;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  // Warm picture-book foliage tones matching start screen (olive, chartreuse-gold, sage, woodland)
  const midFoliagePalette = ['#739F42', '#64923B', '#84AF4B', '#5C8838', '#7AA645'];
  const topFoliagePalette = ['#B2CF63', '#A4C558', '#C0D86E', '#97BC52', '#B7D367'];
  const sideFoliagePalette = ['#527B32', '#4D7530', '#608939', '#496E2E', '#578034'];

  treeCoords.forEach(([x, z], idx) => {
    const sc = 0.86 + ((idx * 37) % 34) / 100;
    dummy.position.set(x, 0, z);
    dummy.rotation.y = (idx * 1.37) % (Math.PI * 2);
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    trunks.setMatrixAt(idx, dummy.matrix);
    crowns.setMatrixAt(idx, dummy.matrix);
    tops.setMatrixAt(idx, dummy.matrix);
    sides.setMatrixAt(idx, dummy.matrix);

    color.set(midFoliagePalette[idx % midFoliagePalette.length]);
    crowns.setColorAt(idx, color);
    color.set(topFoliagePalette[idx % topFoliagePalette.length]);
    tops.setColorAt(idx, color);
    color.set(sideFoliagePalette[idx % sideFoliagePalette.length]);
    sides.setColorAt(idx, color);
  });
  trunks.instanceMatrix.needsUpdate = true;
  crowns.instanceMatrix.needsUpdate = true;
  tops.instanceMatrix.needsUpdate = true;
  sides.instanceMatrix.needsUpdate = true;
  if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
  if (tops.instanceColor) tops.instanceColor.needsUpdate = true;
  if (sides.instanceColor) sides.instanceColor.needsUpdate = true;
  trunks.computeBoundingSphere();
  crowns.computeBoundingSphere();
  tops.computeBoundingSphere();
  sides.computeBoundingSphere();
  group.add(trunks, crowns, tops, sides);

  // Instanced Garden Bushes & Wildflower Tufts ringing the stone wall & meadow borders
  const bushCoords: [number, number][] = [];
  for (let i = 0; i < 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    const rad = 12.6 + (i % 3) * 1.4;
    const bx = Math.cos(angle) * rad;
    const bz = Math.sin(angle) * rad - 3.5;
    if (bz > 0.2 && bz < 8.5 && Math.abs(bx) < 15) continue;
    bushCoords.push([bx, bz]);
  }
  const bushGeo = new THREE.SphereGeometry(0.46, 8, 7);
  bushGeo.scale(1.15, 0.72, 1.0);
  bushGeo.translate(0, 0.28, 0);
  const bushMat = new THREE.MeshStandardMaterial({
    map: foliageTex,
    color: '#FFFFFF',
    roughness: 0.9,
  });
  const blossomGeo = new THREE.SphereGeometry(0.11, 6, 5);
  blossomGeo.translate(0.16, 0.5, 0.14);
  const blossomMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.75 });
  disposables.push(bushGeo, bushMat, blossomGeo, blossomMat);

  const bushes = new THREE.InstancedMesh(bushGeo, bushMat, bushCoords.length);
  const blossoms = new THREE.InstancedMesh(blossomGeo, blossomMat, bushCoords.length);
  const blossomColors = ['#E86A58', '#F6C851', '#F497A9', '#FFF8E2'];
  bushCoords.forEach(([bx, bz], idx) => {
    const sc = 0.75 + ((idx * 29) % 45) / 100;
    dummy.position.set(bx, 0, bz);
    dummy.rotation.y = (idx * 2.1) % (Math.PI * 2);
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    bushes.setMatrixAt(idx, dummy.matrix);
    blossoms.setMatrixAt(idx, dummy.matrix);
    color.set(midFoliagePalette[idx % midFoliagePalette.length]);
    bushes.setColorAt(idx, color);
    color.set(blossomColors[idx % blossomColors.length]);
    blossoms.setColorAt(idx, color);
  });
  bushes.instanceMatrix.needsUpdate = true;
  blossoms.instanceMatrix.needsUpdate = true;
  if (bushes.instanceColor) bushes.instanceColor.needsUpdate = true;
  if (blossoms.instanceColor) blossoms.instanceColor.needsUpdate = true;
  bushes.computeBoundingSphere();
  blossoms.computeBoundingSphere();
  group.add(bushes, blossoms);

  // Storybook Timber-and-Terracotta Village Cottages ringing the town backdrop
  const terracottaRoofTex = createRoofShingleTexture('terracotta', maxAnisotropy);
  const slateRoofTex = createRoofShingleTexture('slate', maxAnisotropy);
  const stoneWallTex = createStoneWallTexture(maxAnisotropy);
  const woodTex = createWoodPlankTexture('#8E5D36', maxAnisotropy);

  const cottageSpecs: {
    x: number;
    z: number;
    wall: string;
    timber: string;
    roof: 'terracotta' | 'slate';
    shutter: string;
    rotY: number;
    scale: number;
  }[] = [
    { x: -17.2, z: -13.2, wall: '#F6ECD7', timber: '#5E422E', roof: 'terracotta', shutter: '#588157', rotY: 0.58, scale: 1.05 },
    { x: -11.4, z: -17.6, wall: '#F2DC9B', timber: '#634632', roof: 'terracotta', shutter: '#4F7797', rotY: 0.3, scale: 0.96 },
    { x: -4.2, z: -19.2, wall: '#9BBBD4', timber: '#5B402D', roof: 'slate', shutter: '#C96A42', rotY: 0.1, scale: 1.02 },
    { x: 4.5, z: -19.0, wall: '#F7EBD5', timber: '#5E422E', roof: 'terracotta', shutter: '#608556', rotY: -0.12, scale: 1.04 },
    { x: 11.8, z: -17.2, wall: '#F3DFAA', timber: '#61442F', roof: 'terracotta', shutter: '#B85C3A', rotY: -0.34, scale: 0.95 },
    { x: 17.5, z: -12.8, wall: '#EFE4CE', timber: '#5C402D', roof: 'terracotta', shutter: '#4F7797', rotY: -0.6, scale: 1.06 },
  ];

  const winGlassMat = new THREE.MeshStandardMaterial({
    color: '#D4E9F7',
    emissive: '#FFE8B3',
    emissiveIntensity: 0.18,
    roughness: 0.25,
    metalness: 0.08,
  });
  const oakFrameMat = new THREE.MeshStandardMaterial({
    color: '#5C3F2B',
    roughness: 0.85,
  });
  const doorMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.82,
  });
  const chimneyMat = new THREE.MeshStandardMaterial({
    map: stoneWallTex,
    color: '#E0D5C2',
    roughness: 0.9,
  });
  const flowerBoxMat = new THREE.MeshStandardMaterial({
    color: '#7A4F2E',
    roughness: 0.86,
  });
  const flowerRedMat = new THREE.MeshStandardMaterial({ color: '#E05B4B', roughness: 0.72 });
  const flowerGoldMat = new THREE.MeshStandardMaterial({ color: '#F0BD46', roughness: 0.72 });
  const terracottaRoofMat = new THREE.MeshStandardMaterial({
    map: terracottaRoofTex,
    bumpMap: paperBump,
    bumpScale: 0.04,
    roughness: 0.82,
    metalness: 0.02,
  });
  const slateRoofMat = new THREE.MeshStandardMaterial({
    map: slateRoofTex,
    bumpMap: paperBump,
    bumpScale: 0.04,
    roughness: 0.8,
    metalness: 0.04,
  });

  // Shared cottage geometries
  const wallBoxGeo = new THREE.BoxGeometry(3.4, 2.55, 2.75);
  // Gable pitched roof (triangular prism oriented cleanly over the cottage)
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-2.05, 0);
  roofShape.lineTo(2.05, 0);
  roofShape.lineTo(0, 1.55);
  roofShape.closePath();
  const gableGeo = new THREE.ExtrudeGeometry(roofShape, {
    depth: 3.1,
    bevelEnabled: false,
  });
  gableGeo.center();
  const roofSlopeGeo = new THREE.BoxGeometry(2.65, 0.16, 3.35);
  const chimneyGeo = new THREE.BoxGeometry(0.55, 1.35, 0.55);
  const chimneyPotGeo = new THREE.CylinderGeometry(0.11, 0.14, 0.34, 8);
  const doorGeo = new THREE.BoxGeometry(0.68, 1.18, 0.14);
  const porchRoofGeo = new THREE.BoxGeometry(1.06, 0.12, 0.62);
  const winPaneGeo = new THREE.BoxGeometry(0.64, 0.64, 0.1);
  const winFrameGeo = new THREE.BoxGeometry(0.74, 0.74, 0.08);
  const shutterGeo = new THREE.BoxGeometry(0.22, 0.68, 0.08);
  const flowerBoxGeo = new THREE.BoxGeometry(0.78, 0.18, 0.22);
  const flowerPuffGeo = new THREE.SphereGeometry(0.13, 7, 6);

  disposables.push(
    winGlassMat,
    oakFrameMat,
    doorMat,
    chimneyMat,
    flowerBoxMat,
    flowerRedMat,
    flowerGoldMat,
    terracottaRoofMat,
    slateRoofMat,
    wallBoxGeo,
    gableGeo,
    roofSlopeGeo,
    chimneyGeo,
    chimneyPotGeo,
    doorGeo,
    porchRoofGeo,
    winPaneGeo,
    winFrameGeo,
    shutterGeo,
    flowerBoxGeo,
    flowerPuffGeo,
  );

  for (const c of cottageSpecs) {
    const house = new THREE.Group();
    house.position.set(c.x, 0, c.z);
    house.rotation.y = c.rotY;
    house.scale.setScalar(c.scale);

    const wallTex = createCottageWallTexture(c.wall, c.timber, maxAnisotropy);
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      bumpMap: paperBump,
      bumpScale: 0.03,
      roughness: 0.88,
      metalness: 0.0,
    });
    const shutterMat = new THREE.MeshStandardMaterial({
      color: c.shutter,
      roughness: 0.8,
    });
    disposables.push(wallMat, shutterMat);

    const wall = new THREE.Mesh(wallBoxGeo, wallMat);
    wall.position.y = 1.275;
    wall.castShadow = !isSoftwareGl;
    wall.receiveShadow = true;
    house.add(wall);

    // Gable end fill + pitched terracotta/slate shingled roof slopes
    const gable = new THREE.Mesh(gableGeo, wallMat);
    gable.position.y = 3.25;
    gable.scale.set(0.84, 0.92, 0.88);
    house.add(gable);

    const rMat = c.roof === 'terracotta' ? terracottaRoofMat : slateRoofMat;
    const leftSlope = new THREE.Mesh(roofSlopeGeo, rMat);
    leftSlope.position.set(-1.02, 3.22, 0);
    leftSlope.rotation.z = 0.64;
    leftSlope.castShadow = !isSoftwareGl;
    leftSlope.receiveShadow = true;
    house.add(leftSlope);

    const rightSlope = new THREE.Mesh(roofSlopeGeo, rMat);
    rightSlope.position.set(1.02, 3.22, 0);
    rightSlope.rotation.z = -0.64;
    rightSlope.castShadow = !isSoftwareGl;
    rightSlope.receiveShadow = true;
    house.add(rightSlope);

    // Stone chimney + terracotta chimney pot
    const chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
    chimney.position.set(1.05, 3.82, -0.55);
    chimney.castShadow = !isSoftwareGl;
    house.add(chimney);

    const pot = new THREE.Mesh(chimneyPotGeo, terracottaRoofMat);
    pot.position.set(1.05, 4.62, -0.55);
    house.add(pot);

    // Warm oak door + cute pitched porch hood
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0.62, 1.38);
    house.add(door);

    const porchHood = new THREE.Mesh(porchRoofGeo, rMat);
    porchHood.position.set(0, 1.38, 1.62);
    porchHood.rotation.x = 0.34;
    house.add(porchHood);

    // Shuttered windows + flower boxes bursting with blossoms
    for (const wx of [-1.02, 1.02]) {
      const frame = new THREE.Mesh(winFrameGeo, oakFrameMat);
      frame.position.set(wx, 1.56, 1.37);
      house.add(frame);

      const pane = new THREE.Mesh(winPaneGeo, winGlassMat);
      pane.position.set(wx, 1.56, 1.39);
      house.add(pane);

      const shL = new THREE.Mesh(shutterGeo, shutterMat);
      shL.position.set(wx - 0.46, 1.56, 1.39);
      const shR = new THREE.Mesh(shutterGeo, shutterMat);
      shR.position.set(wx + 0.46, 1.56, 1.39);
      house.add(shL, shR);

      const box = new THREE.Mesh(flowerBoxGeo, flowerBoxMat);
      box.position.set(wx, 1.14, 1.48);
      house.add(box);

      for (let f = -1; f <= 1; f++) {
        const fl = new THREE.Mesh(flowerPuffGeo, f === 0 ? flowerGoldMat : flowerRedMat);
        fl.position.set(wx + f * 0.22, 1.28, 1.49);
        house.add(fl);
      }
    }

    group.add(house);
  }

  // Low Dry-Stone Village Garden Wall Segments framing the back meadow
  const stoneWallMat = new THREE.MeshStandardMaterial({
    map: stoneWallTex,
    bumpMap: paperBump,
    bumpScale: 0.035,
    roughness: 0.92,
  });
  const wallSegGeo = new THREE.BoxGeometry(3.8, 0.72, 0.45);
  const wallCapGeo = new THREE.BoxGeometry(3.92, 0.12, 0.52);
  disposables.push(stoneWallMat, wallSegGeo, wallCapGeo);

  const stoneWalls: [number, number, number][] = [
    [-12.6, -9.8, 0.72],
    [-8.6, -13.4, 0.35],
    [8.8, -13.2, -0.35],
    [12.8, -9.6, -0.72],
  ];
  for (const [wx, wz, wy] of stoneWalls) {
    const seg = new THREE.Group();
    seg.position.set(wx, 0, wz);
    seg.rotation.y = wy;
    const base = new THREE.Mesh(wallSegGeo, stoneWallMat);
    base.position.y = 0.36;
    base.castShadow = !isSoftwareGl;
    base.receiveShadow = true;
    const cap = new THREE.Mesh(wallCapGeo, curbMat);
    cap.position.y = 0.74;
    seg.add(base, cap);
    group.add(seg);
  }

  // Cozy Village Market Stalls with Striped Canvas Awnings (placed safely behind plaza arc)
  const stallSpecs: { x: number; z: number; rotY: number; stripe: string }[] = [
    { x: -11.4, z: -6.8, rotY: 0.85, stripe: '#D2573E' },
    { x: 11.6, z: -6.6, rotY: -0.88, stripe: '#428A96' },
  ];
  const stallPostGeo = new THREE.CylinderGeometry(0.06, 0.07, 1.95, 8);
  const stallCounterGeo = new THREE.BoxGeometry(2.1, 0.82, 0.95);
  const stallAwningGeo = new THREE.BoxGeometry(2.35, 0.1, 1.38);
  const basketGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.24, 10);
  const basketMat = new THREE.MeshStandardMaterial({ color: '#B47C44', roughness: 0.88 });
  disposables.push(stallPostGeo, stallCounterGeo, stallAwningGeo, basketGeo, basketMat);

  for (const st of stallSpecs) {
    const stall = new THREE.Group();
    stall.position.set(st.x, 0, st.z);
    stall.rotation.y = st.rotY;

    const counter = new THREE.Mesh(stallCounterGeo, doorMat);
    counter.position.y = 0.41;
    counter.castShadow = !isSoftwareGl;
    counter.receiveShadow = true;
    stall.add(counter);

    for (const [px, pz] of [
      [-0.95, -0.38],
      [0.95, -0.38],
      [-0.95, 0.38],
      [0.95, 0.38],
    ]) {
      const post = new THREE.Mesh(stallPostGeo, oakFrameMat);
      post.position.set(px, 0.98, pz);
      stall.add(post);
    }

    const awningTex = createAwningStripeTexture(st.stripe, maxAnisotropy);
    const awningMat = new THREE.MeshStandardMaterial({
      map: awningTex,
      roughness: 0.86,
    });
    disposables.push(awningMat);
    const awning = new THREE.Mesh(stallAwningGeo, awningMat);
    awning.position.set(0, 1.98, 0.08);
    awning.rotation.x = 0.24;
    awning.castShadow = !isSoftwareGl;
    stall.add(awning);

    // Colorful fruit baskets on the stall counter
    for (let b = -1; b <= 1; b++) {
      const basket = new THREE.Mesh(basketGeo, basketMat);
      basket.position.set(b * 0.58, 0.92, 0.08);
      stall.add(basket);
      const fruit = new THREE.Mesh(flowerPuffGeo, b === 0 ? flowerGoldMat : flowerRedMat);
      fruit.scale.set(1.5, 0.85, 1.5);
      fruit.position.set(b * 0.58, 1.06, 0.08);
      stall.add(fruit);
    }

    group.add(stall);
  }

  // Vintage Village Iron-and-Brass Street Lamps flanking the cobblestone plaza
  const lampIronMat = new THREE.MeshStandardMaterial({
    color: '#3B3632',
    roughness: 0.58,
    metalness: 0.45,
  });
  const lampGlowMat = new THREE.MeshStandardMaterial({
    color: '#FFF6D1',
    emissive: '#F7C96B',
    emissiveIntensity: 0.55,
    roughness: 0.25,
  });
  const lampPostGeo = new THREE.CylinderGeometry(0.06, 0.1, 2.7, 8);
  const lampBaseGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.34, 8);
  const lampGlobeGeo = new THREE.SphereGeometry(0.22, 10, 8);
  const lampCapGeo = new THREE.ConeGeometry(0.28, 0.22, 8);
  disposables.push(lampIronMat, lampGlowMat, lampPostGeo, lampBaseGeo, lampGlobeGeo, lampCapGeo);

  const lampPositions: [number, number][] = [
    [-10.6, -0.6],
    [10.6, -0.6],
    [-8.9, -11.4],
    [8.9, -11.4],
  ];
  for (const [lx, lz] of lampPositions) {
    const lamp = new THREE.Group();
    lamp.position.set(lx, 0, lz);
    const base = new THREE.Mesh(lampBaseGeo, lampIronMat);
    base.position.y = 0.17;
    const pole = new THREE.Mesh(lampPostGeo, lampIronMat);
    pole.position.y = 1.45;
    pole.castShadow = !isSoftwareGl;
    const globe = new THREE.Mesh(lampGlobeGeo, lampGlowMat);
    globe.position.y = 2.9;
    const cap = new THREE.Mesh(lampCapGeo, lampIronMat);
    cap.position.y = 3.16;
    lamp.add(base, pole, globe, cap);
    group.add(lamp);
  }

  // Fluffy Sunlit Morning Watercolor Clouds (warm ivory tops + soft peach-cream undersides)
  const cloudTopMat = new THREE.MeshStandardMaterial({
    color: '#FFFDF4',
    emissive: '#FFF4D8',
    emissiveIntensity: 0.22,
    roughness: 0.96,
    metalness: 0,
  });
  const cloudUnderMat = new THREE.MeshStandardMaterial({
    color: '#F3E7D4',
    emissive: '#E9DCCB',
    emissiveIntensity: 0.12,
    roughness: 0.98,
    metalness: 0,
  });
  const puffGeo = new THREE.SphereGeometry(1, 12, 10);
  disposables.push(cloudTopMat, cloudUnderMat, puffGeo);

  const clouds: THREE.Group[] = [];
  const cloudPositions: [number, number, number, number][] = [
    [-20, 14.2, -20, 1.15],
    [-3, 15.8, -26, 1.25],
    [15, 14.4, -22, 1.1],
    [29, 13.6, -16, 1.0],
    [-28, 15.0, -12, 1.05],
    [6, 16.5, -30, 1.3],
  ];
  for (const [cx, cy, cz, sc] of cloudPositions) {
    const cloud = new THREE.Group();
    cloud.position.set(cx, cy, cz);
    cloud.scale.setScalar(sc);
    const offsets: [number, number, number, number, boolean][] = [
      [0, 0.32, 0, 1.5, true],
      [-1.35, -0.08, 0.12, 1.15, false],
      [1.42, -0.06, -0.08, 1.2, false],
      [0.52, 0.65, 0.18, 1.0, true],
      [-0.58, 0.45, -0.14, 0.92, true],
    ];
    for (const [ox, oy, oz, r, isTop] of offsets) {
      const puff = new THREE.Mesh(puffGeo, isTop ? cloudTopMat : cloudUnderMat);
      puff.position.set(ox, oy, oz);
      puff.scale.set(r, r * 0.68, r * 0.82);
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
