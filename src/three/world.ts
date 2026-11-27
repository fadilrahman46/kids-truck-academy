import * as THREE from 'three';
import { VEHICLES } from '../types/game';
import {
  createAwningStripeTexture,
  createCobblestoneTexture,
  createCottageWallTexture,
  createFoliageTexture,
  createGouachePaintTexture,
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
  garageHouses: THREE.Group[];
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
    sunLight.shadow.camera.far = 82;
    const d = 26;
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

  // Central Sandstone Cobblestone Town Plaza (wide circular square ringed by the 8 garage houses)
  const cobbleTex = createCobblestoneTexture(maxAnisotropy, 7, 7);
  const plazaGeo = new THREE.CircleGeometry(12.2, 48);
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
  plaza.position.set(0, 0.02, -2.6);
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
  const outerCurbGeo = new THREE.TorusGeometry(12.25, 0.16, 8, 60);
  disposables.push(curbMat, outerCurbGeo);
  const outerCurb = new THREE.Mesh(outerCurbGeo, curbMat);
  outerCurb.rotation.x = Math.PI / 2;
  outerCurb.position.set(0, 0.05, -2.6);
  outerCurb.scale.set(1, 1, 0.55);
  outerCurb.receiveShadow = true;
  group.add(outerCurb);

  // Inner Sunny Village Green Island + Stone Fountain (clear of all 8 garage driveways)
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
  innerLawn.position.set(0, 0.028, -2.6);
  innerLawn.receiveShadow = true;
  group.add(innerLawn);

  const innerCurb = new THREE.Mesh(innerCurbGeo, curbMat);
  innerCurb.rotation.x = Math.PI / 2;
  innerCurb.position.set(0, 0.06, -2.6);
  innerCurb.scale.set(1, 1, 0.6);
  innerCurb.receiveShadow = true;
  group.add(innerCurb);

  // Charming Miniature Tiered Stone Village Fountain in center of town green (echoing start screen)
  const fountainGroup = new THREE.Group();
  fountainGroup.position.set(0, 0.04, -2.6);
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

  // Layered Painterly Storybook Oak Trees (ringing cleanly behind all 8 crescent garage cottages)
  const treeCoords: [number, number][] = [];
  for (let i = 0; i < 48; i++) {
    const angle = (i / 48) * Math.PI * 2;
    const radius = 22.8 + (i % 4) * 5.0;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius - 3.5;
    // Keep front mission camera corridor and road completely clear
    if (z > -0.8 && z < 12 && Math.abs(x) < 22) continue;
    if (z > 6.5 && Math.abs(x) < 20) continue;
    // Keep safely clear of all 8 crescent truck garage house footprints
    const nearAnyHouse = VEHICLES.some((v) => {
      const dx = x - v.housePos[0];
      const dz = z - v.housePos[2];
      return dx * dx + dz * dz < 25;
    });
    if (nearAnyHouse) continue;
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

  // Instanced Garden Bushes & Wildflower Tufts tucked neatly between & behind the 8 garage cottages
  const bushCoords: [number, number][] = [];
  for (let i = 0; i < 36; i++) {
    const angle = (i / 36) * Math.PI * 2;
    const rad = 19.2 + (i % 3) * 1.8;
    const bx = Math.cos(angle) * rad;
    const bz = Math.sin(angle) * rad - 3.2;
    if (bz > -0.5 && bz < 9.5 && Math.abs(bx) < 20) continue;
    const nearHouse = VEHICLES.some((v) => {
      const dx = bx - v.housePos[0];
      const dz = bz - v.housePos[2];
      return dx * dx + dz * dz < 14;
    });
    if (nearHouse) continue;
    bushCoords.push([bx, bz]);
  }
  // Also tuck cute flower bushes neatly between adjacent garage cottages along the crescent
  for (let i = 0; i < VEHICLES.length - 1; i++) {
    const a = VEHICLES[i].housePos;
    const b = VEHICLES[i + 1].housePos;
    const mx = (a[0] + b[0]) * 0.5;
    const mz = (a[2] + b[2]) * 0.5;
    bushCoords.push([mx, mz]);
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

  // 8 Color-Matched Open-Archway Storybook Garage Cottages (one dedicated home for each vehicle!)
  const terracottaRoofTex = createRoofShingleTexture('terracotta', maxAnisotropy);
  const slateRoofTex = createRoofShingleTexture('slate', maxAnisotropy);
  const stoneWallTex = createStoneWallTexture(maxAnisotropy);
  const woodTex = createWoodPlankTexture('#8E5D36', maxAnisotropy);
  const floorWoodTex = createWoodPlankTexture('#B68352', maxAnisotropy);
  const drivewayTex = createCobblestoneTexture(maxAnisotropy, 2, 2);

  const winGlassMat = new THREE.MeshStandardMaterial({
    color: '#D4E9F7',
    emissive: '#FFE8B3',
    emissiveIntensity: 0.2,
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
  const garageFloorMat = new THREE.MeshStandardMaterial({
    map: floorWoodTex,
    bumpMap: paperBump,
    bumpScale: 0.025,
    roughness: 0.86,
  });
  const drivewayMat = new THREE.MeshStandardMaterial({
    map: drivewayTex,
    bumpMap: paperBump,
    bumpScale: 0.028,
    roughness: 0.88,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const interiorBackMat = new THREE.MeshStandardMaterial({
    color: '#E5D3B3',
    roughness: 0.92,
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
  const lanternGlowMat = new THREE.MeshStandardMaterial({
    color: '#FFF6D1',
    emissive: '#F7C96B',
    emissiveIntensity: 0.65,
    roughness: 0.25,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: '#DFB150',
    roughness: 0.35,
    metalness: 0.55,
  });
  const plaqueCreamMat = new THREE.MeshStandardMaterial({
    color: '#FFF9EC',
    roughness: 0.65,
  });

  // Shared composite garage cottage geometries (generous interior: 2.66W x 3.35H x 4.4D)
  const sideWallGeo = new THREE.BoxGeometry(0.36, 3.45, 4.7);
  const backWallGeo = new THREE.BoxGeometry(3.38, 3.45, 0.36);
  const floorDeckGeo = new THREE.BoxGeometry(3.26, 0.07, 4.66);
  const drivewayGeo = new THREE.PlaneGeometry(2.9, 3.4);
  const frontPillarGeo = new THREE.BoxGeometry(0.42, 3.45, 0.44);
  const frontLintelGeo = new THREE.BoxGeometry(3.44, 0.52, 0.46);
  const archCornerGeo = new THREE.BoxGeometry(0.55, 0.55, 0.32);

  // Pitched Gable Pediment (front & rear triangle above y = 3.45)
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-1.72, 0);
  gableShape.lineTo(1.72, 0);
  gableShape.lineTo(0, 1.48);
  gableShape.closePath();
  const gableGeo = new THREE.ExtrudeGeometry(gableShape, {
    depth: 4.58,
    bevelEnabled: false,
  });
  gableGeo.center();

  const roofSlopeGeo = new THREE.BoxGeometry(2.62, 0.18, 5.25);
  const roofTrimGeo = new THREE.BoxGeometry(2.66, 0.14, 0.18);
  const ridgeCapGeo = new THREE.BoxGeometry(0.26, 0.22, 5.34);
  const chimneyGeo = new THREE.BoxGeometry(0.54, 1.38, 0.54);
  const chimneyPotGeo = new THREE.CylinderGeometry(0.11, 0.14, 0.34, 8);
  const plaqueRimGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.1, 18);
  const plaqueFaceGeo = new THREE.CylinderGeometry(0.37, 0.37, 0.12, 18);
  const plaqueDotGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.14, 16);
  const sideWinFrameGeo = new THREE.BoxGeometry(0.1, 0.72, 0.78);
  const sideWinPaneGeo = new THREE.BoxGeometry(0.12, 0.62, 0.68);
  const sideShutterGeo = new THREE.BoxGeometry(0.08, 0.68, 0.22);
  const sideFlowerBoxGeo = new THREE.BoxGeometry(0.22, 0.18, 0.82);
  const flowerPuffGeo = new THREE.SphereGeometry(0.12, 7, 6);
  const lanternBulbGeo = new THREE.SphereGeometry(0.15, 10, 8);
  const lanternCapGeo = new THREE.ConeGeometry(0.2, 0.16, 8);

  disposables.push(
    terracottaRoofTex,
    slateRoofTex,
    stoneWallTex,
    woodTex,
    floorWoodTex,
    drivewayTex,
    winGlassMat,
    oakFrameMat,
    doorMat,
    garageFloorMat,
    drivewayMat,
    interiorBackMat,
    chimneyMat,
    flowerBoxMat,
    flowerRedMat,
    flowerGoldMat,
    terracottaRoofMat,
    slateRoofMat,
    lanternGlowMat,
    brassMat,
    plaqueCreamMat,
    sideWallGeo,
    backWallGeo,
    floorDeckGeo,
    drivewayGeo,
    frontPillarGeo,
    frontLintelGeo,
    archCornerGeo,
    gableGeo,
    roofSlopeGeo,
    roofTrimGeo,
    ridgeCapGeo,
    chimneyGeo,
    chimneyPotGeo,
    plaqueRimGeo,
    plaqueFaceGeo,
    plaqueDotGeo,
    sideWinFrameGeo,
    sideWinPaneGeo,
    sideShutterGeo,
    sideFlowerBoxGeo,
    flowerPuffGeo,
    lanternBulbGeo,
    lanternCapGeo,
  );

  const garageHouses: THREE.Group[] = [];
  const wallTints = ['#F7EEDB', '#F4E5C8', '#EFE6D2', '#F7ECDA', '#F5E4C3', '#F7EBD5', '#EDF0DC', '#F8EED2'];

  VEHICLES.forEach((v, idx) => {
    const house = new THREE.Group();
    house.position.set(...v.housePos);
    house.rotation.y = v.houseRotY;
    house.userData.vehicleId = v.id;

    const wallTex = createCottageWallTexture(wallTints[idx % wallTints.length], '#5E422E', maxAnisotropy);
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      bumpMap: paperBump,
      bumpScale: 0.03,
      roughness: 0.88,
      metalness: 0.0,
    });
    const accentTex = createGouachePaintTexture(v.accentHex, maxAnisotropy);
    const accentMat = new THREE.MeshStandardMaterial({
      map: accentTex,
      bumpMap: paperBump,
      bumpScale: 0.022,
      roughness: 0.62,
      metalness: 0.04,
    });
    const accentDarkMat = new THREE.MeshStandardMaterial({
      color: v.accentDarkHex,
      roughness: 0.72,
    });
    disposables.push(wallTex, wallMat, accentTex, accentMat, accentDarkMat);

    // Warm oak interior garage floorboards + cobblestone driveway apron connecting out to plaza
    const floorDeck = new THREE.Mesh(floorDeckGeo, garageFloorMat);
    floorDeck.position.set(0, 0.035, 0);
    floorDeck.receiveShadow = true;
    house.add(floorDeck);

    const driveway = new THREE.Mesh(drivewayGeo, drivewayMat);
    driveway.rotation.x = -Math.PI / 2;
    driveway.position.set(0, 0.026, 4.0);
    driveway.receiveShadow = true;
    house.add(driveway);

    // Left, Right & Rear timber-and-plaster walls (open front archway faces +Z!)
    const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
    leftWall.position.set(-1.51, 1.725, 0);
    leftWall.castShadow = !isSoftwareGl;
    leftWall.receiveShadow = true;
    house.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
    rightWall.position.set(1.51, 1.725, 0);
    rightWall.castShadow = !isSoftwareGl;
    rightWall.receiveShadow = true;
    house.add(rightWall);

    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, 1.725, -2.18);
    backWall.castShadow = !isSoftwareGl;
    backWall.receiveShadow = true;
    house.add(backWall);

    // Cozy warm plaster interior back panel so inside bay stays bright & readable
    const innerBack = new THREE.Mesh(new THREE.PlaneGeometry(2.68, 3.25), interiorBackMat);
    innerBack.position.set(0, 1.68, -1.99);
    house.add(innerBack);
    disposables.push(innerBack.geometry);

    // Open Wooden Archway Portal on Front (+Z = +2.32) with color-matched timber trim
    for (const px of [-1.48, 1.48]) {
      const pillar = new THREE.Mesh(frontPillarGeo, oakFrameMat);
      pillar.position.set(px, 1.725, 2.32);
      pillar.castShadow = !isSoftwareGl;
      house.add(pillar);

      // Painted accent plinth block at base of each archway post
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.56, 0.5), accentMat);
      plinth.position.set(px, 0.28, 2.32);
      house.add(plinth);
      disposables.push(plinth.geometry);
    }

    // Upper lintel beam & chamfered corner brackets forming an inviting storybook archway
    const lintel = new THREE.Mesh(frontLintelGeo, accentMat);
    lintel.position.set(0, 3.28, 2.32);
    lintel.castShadow = !isSoftwareGl;
    house.add(lintel);

    for (const sx of [-1, 1]) {
      const corbel = new THREE.Mesh(archCornerGeo, oakFrameMat);
      corbel.position.set(sx * 1.15, 2.95, 2.32);
      corbel.rotation.z = sx * 0.78;
      house.add(corbel);
    }

    // Warm brass porch lantern tucked inside top-center of archway
    const lanternCap = new THREE.Mesh(lanternCapGeo, brassMat);
    lanternCap.position.set(0, 2.96, 2.48);
    const lanternBulb = new THREE.Mesh(lanternBulbGeo, lanternGlowMat);
    lanternBulb.position.set(0, 2.82, 2.48);
    house.add(lanternCap, lanternBulb);

    // Gable end fill + steep shingled roof slopes + color-matched front fascia trim
    const gable = new THREE.Mesh(gableGeo, wallMat);
    gable.position.set(0, 4.18, 0);
    house.add(gable);

    const roofMat = v.id === 'tangki' || v.id === 'angkut' ? slateRoofMat : terracottaRoofMat;
    const leftSlope = new THREE.Mesh(roofSlopeGeo, roofMat);
    leftSlope.position.set(-1.08, 4.15, 0.08);
    leftSlope.rotation.z = 0.68;
    leftSlope.castShadow = !isSoftwareGl;
    leftSlope.receiveShadow = true;
    house.add(leftSlope);

    const rightSlope = new THREE.Mesh(roofSlopeGeo, roofMat);
    rightSlope.position.set(1.08, 4.15, 0.08);
    rightSlope.rotation.z = -0.68;
    rightSlope.castShadow = !isSoftwareGl;
    rightSlope.receiveShadow = true;
    house.add(rightSlope);

    // Color-matched painted bargeboard trim along the front roof gable!
    const trimL = new THREE.Mesh(roofTrimGeo, accentMat);
    trimL.position.set(-1.08, 4.14, 2.66);
    trimL.rotation.z = 0.68;
    house.add(trimL);

    const trimR = new THREE.Mesh(roofTrimGeo, accentMat);
    trimR.position.set(1.08, 4.14, 2.66);
    trimR.rotation.z = -0.68;
    house.add(trimR);

    const ridgeCap = new THREE.Mesh(ridgeCapGeo, accentDarkMat);
    ridgeCap.position.set(0, 5.04, 0.08);
    house.add(ridgeCap);

    // Color-matched circular crest medallion centered in the front gable above the archway
    const plaqueRim = new THREE.Mesh(plaqueRimGeo, accentDarkMat);
    plaqueRim.rotation.x = Math.PI / 2;
    plaqueRim.position.set(0, 4.02, 2.34);
    const plaqueFace = new THREE.Mesh(plaqueFaceGeo, plaqueCreamMat);
    plaqueFace.rotation.x = Math.PI / 2;
    plaqueFace.position.set(0, 4.02, 2.36);
    const plaqueDot = new THREE.Mesh(plaqueDotGeo, accentMat);
    plaqueDot.rotation.x = Math.PI / 2;
    plaqueDot.position.set(0, 4.02, 2.38);
    house.add(plaqueRim, plaqueFace, plaqueDot);

    // Stone chimney + terracotta pot on alternating roof sides for organic village charm
    const chimSide = idx % 2 === 0 ? 1.05 : -1.05;
    const chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
    chimney.position.set(chimSide, 4.78, -0.85);
    chimney.castShadow = !isSoftwareGl;
    house.add(chimney);

    const pot = new THREE.Mesh(chimneyPotGeo, terracottaRoofMat);
    pot.position.set(chimSide, 5.56, -0.85);
    house.add(pot);

    // Shuttered storybook windows + flower boxes on both side walls
    for (const side of [-1, 1]) {
      const wx = side * 1.7;
      const frame = new THREE.Mesh(sideWinFrameGeo, oakFrameMat);
      frame.position.set(wx, 1.92, 0.15);
      house.add(frame);

      const pane = new THREE.Mesh(sideWinPaneGeo, winGlassMat);
      pane.position.set(wx + side * 0.01, 1.92, 0.15);
      house.add(pane);

      for (const sz of [-0.48, 0.48]) {
        const shutter = new THREE.Mesh(sideShutterGeo, accentMat);
        shutter.position.set(wx + side * 0.02, 1.92, 0.15 + sz);
        house.add(shutter);
      }

      const fbox = new THREE.Mesh(sideFlowerBoxGeo, flowerBoxMat);
      fbox.position.set(wx + side * 0.08, 1.46, 0.15);
      house.add(fbox);

      for (let f = -1; f <= 1; f++) {
        const fl = new THREE.Mesh(flowerPuffGeo, f === 0 ? flowerGoldMat : flowerRedMat);
        fl.position.set(wx + side * 0.1, 1.62, 0.15 + f * 0.24);
        house.add(fl);
      }
    }

    // Tag all child meshes so raycasting any part of the garage house identifies this truck!
    house.traverse((obj) => {
      obj.userData.vehicleId = v.id;
    });

    group.add(house);
    garageHouses.push(house);
  });

  // Low Dry-Stone Village Garden Wall Segments framing the outer flanks behind the crescent
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
    [-20.5, -3.0, 1.1],
    [20.5, -3.0, -1.1],
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

  // Cozy Village Market Stalls with Striped Canvas Awnings tucked cleanly at outer village flanks
  const stallSpecs: { x: number; z: number; rotY: number; stripe: string }[] = [
    { x: -18.8, z: -0.4, rotY: 0.95, stripe: '#D2573E' },
    { x: 18.8, z: -0.4, rotY: -0.95, stripe: '#428A96' },
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
    disposables.push(awningTex, awningMat);
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

  // Vintage Village Iron-and-Brass Street Lamps framing the plaza perimeter cleanly clear of driveways
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
    [-14.6, 0.4],
    [14.6, 0.4],
    [-6.0, -14.8],
    [6.0, -14.8],
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
    garageHouses,
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
