import * as THREE from 'three';
import {
  SHAPE_MAP,
  type CargoTypeId,
  type ShapeId,
  type VehicleId,
  type WasteKind,
} from '../types/game';
import {
  createBrickTexture,
  createContactShadowTexture,
  createGouachePaintTexture,
  createMixerStripeTexture,
  createWoodPlankTexture,
  getPaperBumpTexture,
} from './textures';

export interface TruckRig {
  id: VehicleId;
  root: THREE.Group;
  bodyGroup: THREE.Group;
  wheels: THREE.Object3D[];
  // Molen specific
  drumGroup?: THREE.Group;
  drumMaterial?: THREE.MeshStandardMaterial;
  chuteGroup?: THREE.Group;
  // Angkut specific
  bedGroup?: THREE.Group;
  cargoSlot?: THREE.Group;
  // Tangki specific
  waterFillMesh?: THREE.Mesh;
  // Crane & Excavator shared turret
  turretGroup?: THREE.Group;
  boomGroup?: THREE.Group;
  cableMesh?: THREE.Mesh;
  hookGroup?: THREE.Group;
  // Excavator specific
  armBaseGroup?: THREE.Group;
  armForeGroup?: THREE.Group;
  bucketGroup?: THREE.Group;
  // Pemadam specific
  sirenLeftMat?: THREE.MeshStandardMaterial;
  sirenRightMat?: THREE.MeshStandardMaterial;
  nozzleGroup?: THREE.Group;
  // Sampah specific
  hopperGroup?: THREE.Group;
  // School Bus specific
  stopSignGroup?: THREE.Group;
  busBeaconMat?: THREE.MeshStandardMaterial;
}

let sharedShadowTex: THREE.CanvasTexture | null = null;
function getShadowTexture(): THREE.CanvasTexture {
  if (!sharedShadowTex) {
    sharedShadowTex = createContactShadowTexture();
  }
  return sharedShadowTex;
}

export function disposeSharedTruckAssets(): void {
  if (sharedShadowTex) {
    sharedShadowTex.dispose();
    sharedShadowTex = null;
  }
}

function makeGouacheMat(
  hex: string,
  maxAnisotropy: number,
  opts?: { roughness?: number; metalness?: number; bumpScale?: number },
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: createGouachePaintTexture(hex, maxAnisotropy),
    bumpMap: getPaperBumpTexture(maxAnisotropy),
    bumpScale: opts?.bumpScale ?? 0.018,
    roughness: opts?.roughness ?? 0.58,
    metalness: opts?.metalness ?? 0.05,
  });
}

function makeRoundedBox(
  w: number,
  h: number,
  d: number,
  radius: number,
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  const r = Math.min(radius, hw * 0.45, hh * 0.45);
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: true,
    bevelThickness: Math.min(0.08, r * 0.5),
    bevelSize: Math.min(0.08, r * 0.5),
    bevelSegments: 2,
  });
  geo.center();
  return geo;
}

function createWheel(maxAnisotropy: number, radius = 0.44, width = 0.28): THREE.Group {
  const wheel = new THREE.Group();
  const paperBump = getPaperBumpTexture(maxAnisotropy);
  const tireMat = new THREE.MeshStandardMaterial({
    color: '#3B3430',
    bumpMap: paperBump,
    bumpScale: 0.025,
    roughness: 0.9,
    metalness: 0.02,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: '#F2E7CF',
    bumpMap: paperBump,
    bumpScale: 0.01,
    roughness: 0.48,
    metalness: 0.24,
  });
  const hubMat = new THREE.MeshStandardMaterial({
    color: '#D9942A',
    roughness: 0.42,
    metalness: 0.38,
  });

  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, width, 20),
    tireMat,
  );
  tire.rotation.x = Math.PI / 2;
  tire.castShadow = true;
  tire.receiveShadow = true;
  wheel.add(tire);

  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.56, radius * 0.56, width + 0.03, 14),
    rimMat,
  );
  rim.rotation.x = Math.PI / 2;
  wheel.add(rim);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.24, radius * 0.24, width + 0.06, 10),
    hubMat,
  );
  hub.rotation.x = Math.PI / 2;
  wheel.add(hub);

  // Small spoke bar so wheel rotation is super obvious to kids!
  const spoke = new THREE.Mesh(
    new THREE.BoxGeometry(radius * 0.84, 0.08, width + 0.045),
    hubMat,
  );
  wheel.add(spoke);

  return wheel;
}

function addBaseChassisAndCab(
  root: THREE.Group,
  bodyGroup: THREE.Group,
  wheels: THREE.Object3D[],
  cabColorHex: string,
  stripeColorHex: string,
  maxAnisotropy: number,
  wheelCount: 4 | 6 = 4,
): void {
  const paperBump = getPaperBumpTexture(maxAnisotropy);

  // Soft warm sepia contact shadow directly under truck at y = 0.035
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(4.5, 2.6),
    new THREE.MeshBasicMaterial({
      map: getShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.58,
    }),
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.035;
  root.add(shadowPlane);

  const chassisMat = new THREE.MeshStandardMaterial({
    color: '#463C36',
    bumpMap: paperBump,
    bumpScale: 0.02,
    roughness: 0.78,
    metalness: 0.16,
  });
  const cabMat = makeGouacheMat(cabColorHex, maxAnisotropy, { roughness: 0.56, metalness: 0.05 });
  const stripeMat = makeGouacheMat(stripeColorHex, maxAnisotropy, {
    roughness: 0.62,
    metalness: 0.03,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#C7E5F5',
    emissive: '#FFF5DA',
    emissiveIntensity: 0.08,
    roughness: 0.18,
    metalness: 0.1,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: '#E6C27A',
    roughness: 0.34,
    metalness: 0.56,
  });
  const creamMetalMat = new THREE.MeshStandardMaterial({
    color: '#F2E7D3',
    bumpMap: paperBump,
    bumpScale: 0.012,
    roughness: 0.38,
    metalness: 0.42,
  });
  const headlightMat = new THREE.MeshStandardMaterial({
    color: '#FFF4C2',
    emissive: '#FDE073',
    emissiveIntensity: 0.45,
    roughness: 0.24,
    metalness: 0.08,
  });

  // Main Chassis Beam
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.62, 0.34, 1.48), chassisMat);
  chassis.position.set(0, 0.58, 0);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  bodyGroup.add(chassis);

  // Front Beveled Cab (+X is front of truck)
  const cab = new THREE.Mesh(makeRoundedBox(1.26, 1.32, 1.46, 0.22), cabMat);
  cab.position.set(1.18, 1.38, 0);
  cab.castShadow = true;
  cab.receiveShadow = true;
  bodyGroup.add(cab);

  // Storybook roof brow / sun visor above windshield
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 1.48), stripeMat);
  visor.position.set(1.86, 1.98, 0);
  visor.rotation.z = -0.18;
  visor.castShadow = true;
  bodyGroup.add(visor);

  // Cab Nose Hood
  const hood = new THREE.Mesh(makeRoundedBox(0.56, 0.72, 1.4, 0.15), cabMat);
  hood.position.set(1.86, 1.08, 0);
  hood.castShadow = true;
  bodyGroup.add(hood);

  // Accent Stripe across cab side
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.18, 1.54), stripeMat);
  stripe.position.set(1.18, 1.0, 0);
  bodyGroup.add(stripe);

  // Rounded Front Wheel-Arch Fenders (adds cozy illustrated truck silhouette)
  const fenderGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.24, 14, 1, false, 0, Math.PI);
  for (const sz of [-0.74, 0.74]) {
    const fender = new THREE.Mesh(fenderGeo, stripeMat);
    fender.rotation.x = Math.PI / 2;
    fender.rotation.y = Math.PI / 2;
    fender.position.set(1.25, 0.52, sz);
    fender.castShadow = true;
    bodyGroup.add(fender);
  }

  // Windshield + warm frame border
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.54, 1.24), glassMat);
  windshield.position.set(1.8, 1.62, 0);
  windshield.rotation.z = 0.12;
  bodyGroup.add(windshield);

  // Side windows
  const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.48, 1.54), glassMat);
  sideWin.position.set(1.26, 1.58, 0);
  bodyGroup.add(sideWin);

  // Cute vintage side mirrors on slender brackets
  for (const sz of [-0.88, 0.88]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.2), chassisMat);
    arm.position.set(1.62, 1.54, sz * 0.92);
    bodyGroup.add(arm);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.14), creamMetalMat);
    mirror.position.set(1.62, 1.58, sz);
    bodyGroup.add(mirror);
  }

  // Warm cream-metal front bumper with rounded brass end caps
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 1.68), creamMetalMat);
  bumper.position.set(2.14, 0.68, 0);
  bumper.castShadow = true;
  bodyGroup.add(bumper);

  // Friendly expressive headlight eyes with brass lantern bezels!
  for (const side of [-0.46, 0.46]) {
    const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.1, 14), brassMat);
    bezel.rotation.z = Math.PI / 2;
    bezel.position.set(2.12, 1.06, side);
    bodyGroup.add(bezel);

    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 14), headlightMat);
    lamp.rotation.z = Math.PI / 2;
    lamp.position.set(2.14, 1.06, side);
    bodyGroup.add(lamp);

    // Cute pupil dot inside headlight for friendly storybook character
    const pupil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.058, 0.14, 10),
      chassisMat,
    );
    pupil.rotation.z = Math.PI / 2;
    pupil.position.set(2.15, 1.06, side);
    bodyGroup.add(pupil);
  }

  // Cheerful slatted vintage grille
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.54), brassMat);
  grille.position.set(2.15, 0.94, 0);
  bodyGroup.add(grille);
  for (let i = -1; i <= 1; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.46), chassisMat);
    slat.position.set(2.16, 0.94 + i * 0.08, 0);
    bodyGroup.add(slat);
  }

  // Exhaust Pipe behind cab with brass cap
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.24, 10), creamMetalMat);
  exhaust.position.set(0.42, 1.46, -0.78);
  exhaust.castShadow = true;
  bodyGroup.add(exhaust);
  const exhaustTip = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.14, 10), brassMat);
  exhaustTip.position.set(0.42, 2.09, -0.78);
  bodyGroup.add(exhaustTip);

  // Wheels resting flush at y = 0.44 -> bottom at y = 0
  const wheelXs = wheelCount === 6 ? [1.28, -0.45, -1.42] : [1.22, -1.08];
  for (const wx of wheelXs) {
    for (const wz of [-0.8, 0.8]) {
      const w = createWheel(maxAnisotropy, 0.44, 0.28);
      w.position.set(wx, 0.44, wz);
      root.add(w);
      wheels.push(w);
    }
  }
}

export function buildTruck(vehicleId: VehicleId, maxAnisotropy: number): TruckRig {
  const root = new THREE.Group();
  root.userData.vehicleId = vehicleId;

  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);
  const wheels: THREE.Object3D[] = [];
  const paperBump = getPaperBumpTexture(maxAnisotropy);

  const rig: TruckRig = {
    id: vehicleId,
    root,
    bodyGroup,
    wheels,
  };

  if (vehicleId === 'molen') {
    addBaseChassisAndCab(root, bodyGroup, wheels, '#E8951B', '#FAF0D1', maxAnisotropy, 6);

    // Drum cradle support (warm painted iron)
    const supportMat = new THREE.MeshStandardMaterial({
      color: '#5B5048',
      bumpMap: paperBump,
      bumpScale: 0.02,
      roughness: 0.72,
      metalness: 0.25,
    });
    const frontStand = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.9), supportMat);
    frontStand.position.set(0.15, 1.15, 0);
    bodyGroup.add(frontStand);

    const rearStand = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.05, 1.05), supportMat);
    rearStand.position.set(-1.55, 1.25, 0);
    bodyGroup.add(rearStand);

    // Tilted LatheGeometry Cement Mixer Drum
    const drumPivot = new THREE.Group();
    drumPivot.position.set(-0.68, 1.62, 0);
    drumPivot.rotation.z = -0.22; // tilted slightly upward toward rear
    bodyGroup.add(drumPivot);

    const drumGroup = new THREE.Group();
    drumPivot.add(drumGroup);

    const lathePoints = [
      new THREE.Vector2(0.01, -1.08),
      new THREE.Vector2(0.45, -1.05),
      new THREE.Vector2(0.86, -0.45),
      new THREE.Vector2(0.92, 0.08),
      new THREE.Vector2(0.74, 0.72),
      new THREE.Vector2(0.46, 1.08),
    ];
    const drumGeo = new THREE.LatheGeometry(lathePoints, 24);
    drumGeo.rotateZ(Math.PI / 2);

    const stripeTex = createMixerStripeTexture('#E8951B', maxAnisotropy);
    const drumMat = new THREE.MeshStandardMaterial({
      map: stripeTex,
      bumpMap: paperBump,
      bumpScale: 0.02,
      roughness: 0.52,
      metalness: 0.08,
    });
    const drumMesh = new THREE.Mesh(drumGeo, drumMat);
    drumMesh.castShadow = true;
    drumMesh.receiveShadow = true;
    drumGroup.add(drumMesh);

    // Painted iron drum rim collar
    const rimCollar = new THREE.Mesh(
      new THREE.TorusGeometry(0.92, 0.045, 8, 22),
      supportMat,
    );
    rimCollar.rotation.y = Math.PI / 2;
    rimCollar.position.set(-0.08, 0, 0);
    drumGroup.add(rimCollar);

    // Rear chute
    const chuteGroup = new THREE.Group();
    chuteGroup.position.set(-1.82, 1.48, 0);
    const chuteMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.14, 0.42),
      new THREE.MeshStandardMaterial({ color: '#AFA292', roughness: 0.48, metalness: 0.42 }),
    );
    chuteMesh.position.set(-0.32, -0.2, 0);
    chuteMesh.rotation.z = 0.45;
    chuteGroup.add(chuteMesh);
    bodyGroup.add(chuteGroup);

    rig.drumGroup = drumGroup;
    rig.drumMaterial = drumMat;
    rig.chuteGroup = chuteGroup;
  } else if (vehicleId === 'angkut') {
    addBaseChassisAndCab(root, bodyGroup, wheels, '#2F6CC0', '#E8F0FA', maxAnisotropy, 4);

    // Hinged Honey-Oak Planked Storybook Wooden Cargo Bed
    const bedGroup = new THREE.Group();
    bedGroup.position.set(-1.6, 0.85, 0); // pivot near rear
    bodyGroup.add(bedGroup);

    const woodBedTex = createWoodPlankTexture('#C98A3E', maxAnisotropy);
    const bedMat = new THREE.MeshStandardMaterial({
      map: woodBedTex,
      bumpMap: paperBump,
      bumpScale: 0.028,
      roughness: 0.72,
      metalness: 0.04,
    });
    const bedTrimMat = new THREE.MeshStandardMaterial({
      color: '#7A4A24',
      bumpMap: paperBump,
      bumpScale: 0.02,
      roughness: 0.78,
      metalness: 0.05,
    });

    // Floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.18, 1.6), bedMat);
    floor.position.set(1.05, 0.1, 0);
    floor.castShadow = true;
    floor.receiveShadow = true;
    bedGroup.add(floor);

    // Planked side walls + vertical timber stakes
    for (const sz of [-0.76, 0.76]) {
      const side = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.68, 0.12), bedMat);
      side.position.set(1.05, 0.48, sz);
      side.castShadow = true;
      bedGroup.add(side);

      for (const sx of [0.12, 1.05, 1.98]) {
        const stake = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.78, 0.16), bedTrimMat);
        stake.position.set(sx, 0.5, sz);
        bedGroup.add(stake);
      }
    }
    // Front bulkhead
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.84, 1.62), bedTrimMat);
    frontWall.position.set(2.08, 0.54, 0);
    frontWall.castShadow = true;
    bedGroup.add(frontWall);

    // Rear tailgate
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 1.52), bedMat);
    backWall.position.set(0.02, 0.44, 0);
    bedGroup.add(backWall);

    const cargoSlot = new THREE.Group();
    cargoSlot.position.set(1.05, 0.22, 0);
    bedGroup.add(cargoSlot);

    rig.bedGroup = bedGroup;
    rig.cargoSlot = cargoSlot;
  } else if (vehicleId === 'tangki') {
    addBaseChassisAndCab(root, bodyGroup, wheels, '#1D7FB4', '#E5F2FA', maxAnisotropy, 6);

    // Warm ivory-cream & cerulean painted storybook tanker body
    const tankShellMat = makeGouacheMat('#FAF3E3', maxAnisotropy, {
      roughness: 0.46,
      metalness: 0.14,
    });
    const capMat = makeGouacheMat('#1D6FA1', maxAnisotropy, {
      roughness: 0.52,
      metalness: 0.16,
    });
    const brassRingMat = new THREE.MeshStandardMaterial({
      color: '#DFAF58',
      roughness: 0.36,
      metalness: 0.55,
    });
    const glassWindowMat = new THREE.MeshStandardMaterial({
      color: '#DFF1FA',
      roughness: 0.16,
      metalness: 0.08,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    });

    const tankBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.78, 0.78, 2.2, 22),
      tankShellMat,
    );
    tankBody.rotation.z = Math.PI / 2;
    tankBody.position.set(-0.68, 1.55, 0);
    tankBody.castShadow = true;
    bodyGroup.add(tankBody);

    // Decorative painted brass/blue tanker bands
    for (const bx of [-1.45, 0.08]) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.79, 0.035, 8, 22), brassRingMat);
      band.rotation.y = Math.PI / 2;
      band.position.set(bx, 1.55, 0);
      bodyGroup.add(band);
    }

    // Rounded end caps
    for (const ex of [-1.78, 0.42]) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.77, 18, 14), capMat);
      cap.scale.set(0.45, 1, 1);
      cap.position.set(ex, 1.55, 0);
      bodyGroup.add(cap);
    }

    // Top brass-rimmed hatch domes
    for (const hx of [-1.15, -0.25]) {
      const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.18, 14), brassRingMat);
      hatch.position.set(hx, 2.35, 0);
      bodyGroup.add(hatch);
    }

    // Big side water gauge window (on +Z side facing camera)
    const gaugeFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.94, 0.14),
      new THREE.MeshStandardMaterial({ color: '#4B4039', roughness: 0.56, metalness: 0.32 }),
    );
    gaugeFrame.position.set(-0.68, 1.55, 0.76);
    bodyGroup.add(gaugeFrame);

    const gaugeGlass = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.78, 0.16), glassWindowMat);
    gaugeGlass.position.set(-0.68, 1.55, 0.78);
    gaugeGlass.renderOrder = 3;
    bodyGroup.add(gaugeGlass);

    // Dynamic rising water bar inside the gauge!
    const waterFillGeo = new THREE.BoxGeometry(1.28, 0.72, 0.12);
    waterFillGeo.translate(0, 0.36, 0); // pivot at bottom of gauge
    const waterFillMat = new THREE.MeshStandardMaterial({
      color: '#46BBE8',
      emissive: '#1484B8',
      emissiveIntensity: 0.34,
      roughness: 0.18,
      metalness: 0.08,
    });
    const waterFillMesh = new THREE.Mesh(waterFillGeo, waterFillMat);
    waterFillMesh.position.set(-0.68, 1.19, 0.79);
    waterFillMesh.scale.y = 0.05;
    bodyGroup.add(waterFillMesh);

    rig.waterFillMesh = waterFillMesh;
  } else if (vehicleId === 'crane') {
    addBaseChassisAndCab(root, bodyGroup, wheels, '#DEA41A', '#3F352E', maxAnisotropy, 6);

    // Turret base
    const turretGroup = new THREE.Group();
    turretGroup.position.set(-0.72, 0.84, 0);
    bodyGroup.add(turretGroup);

    const turretMat = makeGouacheMat('#C98D14', maxAnisotropy, {
      roughness: 0.55,
      metalness: 0.14,
    });
    const darkMetal = new THREE.MeshStandardMaterial({
      color: '#48403A',
      bumpMap: paperBump,
      bumpScale: 0.02,
      roughness: 0.62,
      metalness: 0.45,
    });
    const brassPulleyMat = new THREE.MeshStandardMaterial({
      color: '#E2B657',
      roughness: 0.36,
      metalness: 0.55,
    });

    const baseCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.68, 0.38, 16), darkMetal);
    baseCyl.position.y = 0.18;
    turretGroup.add(baseCyl);

    const craneHouse = new THREE.Mesh(makeRoundedBox(1.15, 0.82, 1.05, 0.12), turretMat);
    craneHouse.position.set(-0.1, 0.72, 0);
    craneHouse.castShadow = true;
    turretGroup.add(craneHouse);

    // Small operator cab window on turret side
    const opWin = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.36, 1.1),
      new THREE.MeshStandardMaterial({ color: '#C7E5F5', roughness: 0.2 }),
    );
    opWin.position.set(-0.25, 0.82, 0);
    turretGroup.add(opWin);

    // Boom arm extending upward and outward
    const boomGroup = new THREE.Group();
    boomGroup.position.set(0.1, 0.95, 0);
    turretGroup.add(boomGroup);

    const boomMesh = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.32, 0.34), turretMat);
    boomMesh.position.set(-1.35, 1.35, 0);
    boomMesh.rotation.z = -0.78;
    boomMesh.castShadow = true;
    boomGroup.add(boomMesh);

    const pulley = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.44, 14), brassPulleyMat);
    pulley.rotation.x = Math.PI / 2;
    pulley.position.set(-2.55, 2.55, 0);
    boomGroup.add(pulley);

    // Vertical hanging cable
    const cableGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.0, 8);
    cableGeo.translate(0, -0.5, 0);
    const cableMesh = new THREE.Mesh(cableGeo, darkMetal);
    cableMesh.position.set(-2.55, 2.55, 0);
    cableMesh.scale.y = 1.3;
    boomGroup.add(cableMesh);

    // Hook group at bottom of cable
    const hookGroup = new THREE.Group();
    hookGroup.position.set(-2.55, 1.25, 0);
    const hookBlock = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.26, 0.24), darkMetal);
    hookGroup.add(hookBlock);
    const hookCurve = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.045, 8, 14, Math.PI * 1.3),
      new THREE.MeshStandardMaterial({ color: '#DF6528', roughness: 0.42, metalness: 0.42 }),
    );
    hookCurve.position.set(0, -0.2, 0);
    hookCurve.rotation.z = Math.PI * 0.85;
    hookGroup.add(hookCurve);
    boomGroup.add(hookGroup);

    rig.turretGroup = turretGroup;
    rig.boomGroup = boomGroup;
    rig.cableMesh = cableMesh;
    rig.hookGroup = hookGroup;
  } else if (vehicleId === 'pemadam') {
    addBaseChassisAndCab(root, bodyGroup, wheels, '#CC3329', '#FAF2DF', maxAnisotropy, 6);

    const redBodyMat = makeGouacheMat('#CC3329', maxAnisotropy, {
      roughness: 0.54,
      metalness: 0.06,
    });
    const shutterMat = new THREE.MeshStandardMaterial({
      color: '#EAE2D2',
      bumpMap: paperBump,
      bumpScale: 0.02,
      roughness: 0.46,
      metalness: 0.38,
    });
    const woodLadderMat = new THREE.MeshStandardMaterial({
      map: createWoodPlankTexture('#C78F45', maxAnisotropy),
      roughness: 0.68,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: '#E5B958',
      roughness: 0.32,
      metalness: 0.62,
    });

    // Rear fire engine equipment box
    const equipBox = new THREE.Mesh(makeRoundedBox(2.2, 1.28, 1.52, 0.12), redBodyMat);
    equipBox.position.set(-0.68, 1.36, 0);
    equipBox.castShadow = true;
    equipBox.receiveShadow = true;
    bodyGroup.add(equipBox);

    // Cream stripe continuing across equipment box
    const rearStripe = new THREE.Mesh(
      new THREE.BoxGeometry(2.22, 0.16, 1.56),
      makeGouacheMat('#FAF2DF', maxAnisotropy, { roughness: 0.6 }),
    );
    rearStripe.position.set(-0.68, 0.92, 0);
    bodyGroup.add(rearStripe);

    // Equipment roller shutters with brass handles on sides
    for (const sz of [-0.79, 0.79]) {
      const shutter = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.66, 0.06), shutterMat);
      shutter.position.set(-0.68, 1.3, sz);
      bodyGroup.add(shutter);

      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.09), brassMat);
      handle.position.set(-0.68, 1.08, sz);
      bodyGroup.add(handle);
    }

    // Flashing roof beacons (red & blue) on brass bases
    const sirenLeftMat = new THREE.MeshStandardMaterial({
      color: '#EF4444',
      emissive: '#EF4444',
      emissiveIntensity: 0.25,
      roughness: 0.25,
    });
    const sirenRightMat = new THREE.MeshStandardMaterial({
      color: '#3B82F6',
      emissive: '#3B82F6',
      emissiveIntensity: 0.25,
      roughness: 0.25,
    });
    const beaconBaseGeo = new THREE.CylinderGeometry(0.17, 0.19, 0.07, 12);
    const baseL = new THREE.Mesh(beaconBaseGeo, brassMat);
    baseL.position.set(1.25, 2.04, -0.35);
    const baseR = new THREE.Mesh(beaconBaseGeo, brassMat);
    baseR.position.set(1.25, 2.04, 0.35);
    bodyGroup.add(baseL, baseR);

    const beaconL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.22, 12), sirenLeftMat);
    beaconL.position.set(1.25, 2.18, -0.35);
    bodyGroup.add(beaconL);

    const beaconR = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.22, 12), sirenRightMat);
    beaconR.position.set(1.25, 2.18, 0.35);
    bodyGroup.add(beaconR);

    // Storybook honey-oak & brass roof ladder
    const ladderRail1 = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.08, 0.08), woodLadderMat);
    ladderRail1.position.set(-0.65, 2.12, -0.26);
    bodyGroup.add(ladderRail1);
    const ladderRail2 = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.08, 0.08), woodLadderMat);
    ladderRail2.position.set(-0.65, 2.12, 0.26);
    bodyGroup.add(ladderRail2);
    for (let i = 0; i < 6; i++) {
      const rung = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.5), brassMat);
      rung.position.set(-1.55 + i * 0.36, 2.12, 0);
      bodyGroup.add(rung);
    }

    // Aimable 3D brass-and-cream water cannon nozzle mounted atop rear deck
    const nozzleGroup = new THREE.Group();
    nozzleGroup.position.set(0.05, 2.28, 0);
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.24, 12), brassMat);
    nozzleGroup.add(turret);
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.11, 0.72, 12),
      shutterMat,
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.12, 0.32);
    nozzleGroup.add(barrel);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.12, 12), brassMat);
    tip.rotation.x = Math.PI / 2;
    tip.position.set(0, 0.12, 0.68);
    nozzleGroup.add(tip);
    bodyGroup.add(nozzleGroup);

    rig.sirenLeftMat = sirenLeftMat;
    rig.sirenRightMat = sirenRightMat;
    rig.nozzleGroup = nozzleGroup;
  } else if (vehicleId === 'sampah') {
    addBaseChassisAndCab(root, bodyGroup, wheels, '#2B8E4C', '#FAF0C4', maxAnisotropy, 6);

    const greenBodyMat = makeGouacheMat('#379F56', maxAnisotropy, {
      roughness: 0.56,
      metalness: 0.05,
    });
    const creamTrimMat = makeGouacheMat('#FAF3E1', maxAnisotropy, {
      roughness: 0.58,
      metalness: 0.04,
    });
    const darkTrim = makeGouacheMat('#22703C', maxAnisotropy, {
      roughness: 0.62,
      metalness: 0.06,
    });

    // Compactor box
    const compactor = new THREE.Mesh(makeRoundedBox(1.9, 1.38, 1.56, 0.14), greenBodyMat);
    compactor.position.set(-0.48, 1.42, 0);
    compactor.castShadow = true;
    compactor.receiveShadow = true;
    bodyGroup.add(compactor);

    // Clean warm-cream recycle stripe
    const band = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.34, 1.6), creamTrimMat);
    band.position.set(-0.48, 1.45, 0);
    bodyGroup.add(band);

    // Subtle vertical panel ribs along compactor
    for (const rx of [-1.02, -0.48, 0.06]) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.28, 1.62), darkTrim);
      rib.position.set(rx, 1.42, 0);
      bodyGroup.add(rib);
    }

    // Rear articulated hopper / compactor tail
    const hopperGroup = new THREE.Group();
    hopperGroup.position.set(-1.42, 1.85, 0);
    bodyGroup.add(hopperGroup);

    const hopperShell = new THREE.Mesh(makeRoundedBox(0.75, 1.15, 1.5, 0.14), darkTrim);
    hopperShell.position.set(-0.28, -0.45, 0);
    hopperShell.castShadow = true;
    hopperGroup.add(hopperShell);

    rig.hopperGroup = hopperGroup;
  } else if (vehicleId === 'ekskavator') {
    // Soft warm sepia contact shadow directly under excavator at y = 0.035
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 2.7),
      new THREE.MeshBasicMaterial({
        map: getShadowTexture(),
        transparent: true,
        depthWrite: false,
        opacity: 0.58,
      }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.035;
    root.add(shadowPlane);

    const trackMat = new THREE.MeshStandardMaterial({
      color: '#3C3632',
      bumpMap: paperBump,
      bumpScale: 0.025,
      roughness: 0.88,
      metalness: 0.08,
    });
    const ironMat = new THREE.MeshStandardMaterial({
      color: '#524943',
      bumpMap: paperBump,
      bumpScale: 0.02,
      roughness: 0.65,
      metalness: 0.32,
    });
    const orangeMat = makeGouacheMat('#E06324', maxAnisotropy, { roughness: 0.54, metalness: 0.06 });
    const creamMat = makeGouacheMat('#FAF0D6', maxAnisotropy, { roughness: 0.58, metalness: 0.04 });
    const brassMat = new THREE.MeshStandardMaterial({
      color: '#E5B958',
      roughness: 0.34,
      metalness: 0.56,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: '#C7E5F5',
      emissive: '#FFF5DA',
      emissiveIntensity: 0.08,
      roughness: 0.18,
      metalness: 0.1,
    });
    const headlightMat = new THREE.MeshStandardMaterial({
      color: '#FFF4C2',
      emissive: '#FDE073',
      emissiveIntensity: 0.45,
      roughness: 0.24,
    });

    // Twin caterpillar tracks resting flush at y = 0
    for (const tz of [-0.76, 0.76]) {
      const trackPod = new THREE.Mesh(makeRoundedBox(2.85, 0.68, 0.46, 0.28), trackMat);
      trackPod.position.set(-0.15, 0.35, tz);
      trackPod.castShadow = true;
      trackPod.receiveShadow = true;
      root.add(trackPod);

      for (const rx of [-1.15, -0.48, 0.18, 0.85]) {
        const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 14), ironMat);
        roller.rotation.x = Math.PI / 2;
        roller.position.set(rx, 0.35, tz);
        root.add(roller);
        wheels.push(roller);

        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.53, 10), brassMat);
        cap.rotation.x = Math.PI / 2;
        cap.position.set(rx, 0.35, tz);
        root.add(cap);
      }
    }

    // Undercarriage bridge & swivel ring
    const axleBridge = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.28, 1.3), ironMat);
    axleBridge.position.set(-0.15, 0.5, 0);
    axleBridge.castShadow = true;
    root.add(axleBridge);

    const swivelRing = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.74, 0.22, 18), ironMat);
    swivelRing.position.set(-0.15, 0.74, 0);
    bodyGroup.add(swivelRing);

    // Rotating upper turret + cab + articulated boom (+X forward)
    const turretGroup = new THREE.Group();
    turretGroup.position.set(-0.15, 0.84, 0);
    bodyGroup.add(turretGroup);

    const deck = new THREE.Mesh(makeRoundedBox(2.25, 0.55, 1.54, 0.16), orangeMat);
    deck.position.set(-0.12, 0.32, 0);
    deck.castShadow = true;
    deck.receiveShadow = true;
    turretGroup.add(deck);

    // Rear counterweight with cream accent stripe
    const counterweight = new THREE.Mesh(makeRoundedBox(0.74, 0.76, 1.52, 0.18), orangeMat);
    counterweight.position.set(-1.05, 0.62, 0);
    counterweight.castShadow = true;
    turretGroup.add(counterweight);

    const rearBand = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.16, 1.56), creamMat);
    rearBand.position.set(-1.05, 0.48, 0);
    turretGroup.add(rearBand);

    // Cozy rounded storybook cabin on +Z side of deck
    const cab = new THREE.Mesh(makeRoundedBox(1.26, 1.28, 0.96, 0.2), orangeMat);
    cab.position.set(0.16, 1.08, 0.26);
    cab.castShadow = true;
    cab.receiveShadow = true;
    turretGroup.add(cab);

    const frontWin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.66, 0.76), glassMat);
    frontWin.position.set(0.78, 1.24, 0.26);
    turretGroup.add(frontWin);

    const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.62, 1.0), glassMat);
    sideWin.position.set(0.18, 1.24, 0.26);
    turretGroup.add(sideWin);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.98), creamMat);
    visor.position.set(0.84, 1.66, 0.26);
    visor.rotation.z = -0.18;
    turretGroup.add(visor);

    // Vintage brass roof horn + exhaust stack
    const hornTube = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.13, 0.32, 12), brassMat);
    hornTube.rotation.z = Math.PI / 2;
    hornTube.position.set(0.22, 1.82, 0.26);
    turretGroup.add(hornTube);

    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.78, 10), ironMat);
    exhaust.position.set(-0.78, 1.24, -0.45);
    turretGroup.add(exhaust);

    // Friendly brass headlight eyes on the front deck
    for (const hz of [-0.14, 0.56]) {
      const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 14), brassMat);
      bezel.rotation.z = Math.PI / 2;
      bezel.position.set(0.98, 0.44, hz);
      turretGroup.add(bezel);
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 14), headlightMat);
      lamp.rotation.z = Math.PI / 2;
      lamp.position.set(1.0, 0.44, hz);
      turretGroup.add(lamp);
      const pupil = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.14, 10), trackMat);
      pupil.rotation.z = Math.PI / 2;
      pupil.position.set(1.01, 0.44, hz);
      turretGroup.add(pupil);
    }

    // Articulated Two-Joint Digging Boom & Bucket mounted on -Z side of cab
    const armBaseGroup = new THREE.Group();
    armBaseGroup.position.set(0.62, 0.56, -0.44);
    turretGroup.add(armBaseGroup);

    const boomLower = new THREE.Mesh(makeRoundedBox(1.85, 0.3, 0.26, 0.08), orangeMat);
    boomLower.position.set(0.72, 0.68, 0);
    boomLower.rotation.z = 0.72;
    boomLower.castShadow = true;
    armBaseGroup.add(boomLower);

    const hydro1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.25, 10), brassMat);
    hydro1.position.set(0.45, 0.68, 0);
    hydro1.rotation.z = -0.82;
    armBaseGroup.add(hydro1);

    const jointPin1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.34, 12), ironMat);
    jointPin1.rotation.x = Math.PI / 2;
    jointPin1.position.set(1.38, 1.32, 0);
    armBaseGroup.add(jointPin1);

    const armForeGroup = new THREE.Group();
    armForeGroup.position.set(1.38, 1.32, 0);
    armBaseGroup.add(armForeGroup);

    const foreStick = new THREE.Mesh(makeRoundedBox(0.24, 1.55, 0.24, 0.06), orangeMat);
    foreStick.position.set(0.35, -0.62, 0);
    foreStick.rotation.z = 0.48;
    foreStick.castShadow = true;
    armForeGroup.add(foreStick);

    const hydro2 = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.96, 10), brassMat);
    hydro2.position.set(0.15, -0.35, 0);
    hydro2.rotation.z = 0.32;
    armForeGroup.add(hydro2);

    const bucketGroup = new THREE.Group();
    bucketGroup.position.set(0.66, -1.24, 0);
    armForeGroup.add(bucketGroup);

    const bucketBack = new THREE.Mesh(makeRoundedBox(0.56, 0.52, 0.66, 0.1), ironMat);
    bucketBack.position.set(0.1, -0.18, 0);
    bucketBack.castShadow = true;
    bucketGroup.add(bucketBack);

    const bucketScoop = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.66), ironMat);
    bucketScoop.position.set(-0.08, -0.44, 0);
    bucketScoop.rotation.z = 0.22;
    bucketScoop.castShadow = true;
    bucketGroup.add(bucketScoop);

    for (const tz of [-0.24, -0.08, 0.08, 0.24]) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 6), brassMat);
      tooth.rotation.z = Math.PI / 2 + 0.2;
      tooth.position.set(-0.42, -0.48, tz);
      bucketGroup.add(tooth);
    }

    rig.turretGroup = turretGroup;
    rig.armBaseGroup = armBaseGroup;
    rig.armForeGroup = armForeGroup;
    rig.bucketGroup = bucketGroup;
  } else if (vehicleId === 'bus') {
    // Soft warm sepia contact shadow directly under school bus at y = 0.035
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 2.65),
      new THREE.MeshBasicMaterial({
        map: getShadowTexture(),
        transparent: true,
        depthWrite: false,
        opacity: 0.58,
      }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.035;
    root.add(shadowPlane);

    const yellowMat = makeGouacheMat('#F1B825', maxAnisotropy, { roughness: 0.54, metalness: 0.05 });
    const creamRoofMat = makeGouacheMat('#FFF6DE', maxAnisotropy, { roughness: 0.56, metalness: 0.04 });
    const sepiaMat = new THREE.MeshStandardMaterial({
      color: '#463529',
      bumpMap: paperBump,
      bumpScale: 0.02,
      roughness: 0.76,
      metalness: 0.14,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: '#C7E5F5',
      emissive: '#FFF5DA',
      emissiveIntensity: 0.1,
      roughness: 0.18,
      metalness: 0.1,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: '#E5BA58',
      roughness: 0.34,
      metalness: 0.56,
    });
    const creamMetalMat = new THREE.MeshStandardMaterial({
      color: '#F2E7D3',
      bumpMap: paperBump,
      bumpScale: 0.012,
      roughness: 0.4,
      metalness: 0.38,
    });
    const headlightMat = new THREE.MeshStandardMaterial({
      color: '#FFF4C2',
      emissive: '#FDE073',
      emissiveIntensity: 0.45,
      roughness: 0.24,
    });
    const busBeaconMat = new THREE.MeshStandardMaterial({
      color: '#F59E0B',
      emissive: '#F59E0B',
      emissiveIntensity: 0.5,
      roughness: 0.24,
    });

    // Chassis base
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.3, 1.5), sepiaMat);
    chassis.position.set(0.02, 0.56, 0);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    bodyGroup.add(chassis);

    // Classic rounded sunflower-yellow school bus coach body
    const coach = new THREE.Mesh(makeRoundedBox(3.55, 1.48, 1.56, 0.26), yellowMat);
    coach.position.set(-0.22, 1.44, 0);
    coach.castShadow = true;
    coach.receiveShadow = true;
    bodyGroup.add(coach);

    // Soft cream roof cap
    const roofCap = new THREE.Mesh(makeRoundedBox(3.32, 0.22, 1.44, 0.12), creamRoofMat);
    roofCap.position.set(-0.22, 2.2, 0);
    bodyGroup.add(roofCap);

    // Vintage bus engine hood nose (+X)
    const hood = new THREE.Mesh(makeRoundedBox(0.72, 0.78, 1.42, 0.18), yellowMat);
    hood.position.set(1.76, 1.08, 0);
    hood.castShadow = true;
    bodyGroup.add(hood);

    // Dark-sepia school bus side stripe
    const sideBand = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 1.62), sepiaMat);
    sideBand.position.set(-0.22, 1.12, 0);
    bodyGroup.add(sideBand);

    // Rounded wheel-arch fenders
    const fenderGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.24, 14, 1, false, 0, Math.PI);
    for (const fx of [1.26, -1.16]) {
      for (const sz of [-0.76, 0.76]) {
        const fender = new THREE.Mesh(fenderGeo, yellowMat);
        fender.rotation.x = Math.PI / 2;
        fender.rotation.y = Math.PI / 2;
        fender.position.set(fx, 0.5, sz);
        bodyGroup.add(fender);
      }
    }

    // Front panoramic windshield + 4 storybook passenger windows on each side
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.6, 1.32), glassMat);
    windshield.position.set(1.54, 1.68, 0);
    windshield.rotation.z = 0.1;
    bodyGroup.add(windshield);

    for (const wx of [-1.45, -0.75, -0.05, 0.65]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.54, 1.63), glassMat);
      win.position.set(wx, 1.66, 0);
      bodyGroup.add(win);
    }

    // Front amber roof marker lights
    for (const lz of [-0.46, 0.46]) {
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), busBeaconMat);
      light.position.set(1.48, 2.14, lz);
      bodyGroup.add(light);
    }

    // Cream bumper + friendly brass headlight eyes + smiling slatted grille
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 1.68), creamMetalMat);
    bumper.position.set(2.14, 0.66, 0);
    bodyGroup.add(bumper);

    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 1.66), creamMetalMat);
    rearBumper.position.set(-2.04, 0.66, 0);
    bodyGroup.add(rearBumper);

    for (const side of [-0.46, 0.46]) {
      const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 14), brassMat);
      bezel.rotation.z = Math.PI / 2;
      bezel.position.set(2.1, 1.06, side);
      bodyGroup.add(bezel);
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 14), headlightMat);
      lamp.rotation.z = Math.PI / 2;
      lamp.position.set(2.12, 1.06, side);
      bodyGroup.add(lamp);
      const pupil = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.14, 10), sepiaMat);
      pupil.rotation.z = Math.PI / 2;
      pupil.position.set(2.13, 1.06, side);
      bodyGroup.add(pupil);
    }

    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.54), brassMat);
    grille.position.set(2.13, 0.94, 0);
    bodyGroup.add(grille);

    // Side mirrors
    for (const sz of [-0.9, 0.9]) {
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.14), creamMetalMat);
      mirror.position.set(1.5, 1.56, sz);
      bodyGroup.add(mirror);
    }

    // Hinged Red Octagon STOP Paddle on +Z side (folds flush when rotation.y = 0, swings out at PI/2)
    const stopSignGroup = new THREE.Group();
    stopSignGroup.position.set(1.06, 1.38, 0.83);
    bodyGroup.add(stopSignGroup);

    const stopArm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.05), creamMetalMat);
    stopArm.position.set(-0.12, 0, 0);
    stopSignGroup.add(stopArm);

    const stopOctagon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.06, 8),
      makeGouacheMat('#D6342A', maxAnisotropy, { roughness: 0.45 }),
    );
    stopOctagon.rotation.x = Math.PI / 2;
    stopOctagon.rotation.z = Math.PI / 8;
    stopOctagon.position.set(-0.34, 0, 0);
    stopSignGroup.add(stopOctagon);

    const stopRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.07, 8),
      creamRoofMat,
    );
    stopRim.rotation.x = Math.PI / 2;
    stopRim.rotation.z = Math.PI / 8;
    stopRim.position.set(-0.34, 0, 0);
    stopSignGroup.add(stopRim);

    const stopCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.08, 8),
      makeGouacheMat('#D6342A', maxAnisotropy, { roughness: 0.45 }),
    );
    stopCore.rotation.x = Math.PI / 2;
    stopCore.rotation.z = Math.PI / 8;
    stopCore.position.set(-0.34, 0, 0);
    stopSignGroup.add(stopCore);

    // 4 School Bus wheels resting flush at y = 0.44
    for (const wx of [1.26, -1.16]) {
      for (const wz of [-0.82, 0.82]) {
        const w = createWheel(maxAnisotropy, 0.44, 0.28);
        w.position.set(wx, 0.44, wz);
        root.add(w);
        wheels.push(w);
      }
    }

    rig.stopSignGroup = stopSignGroup;
    rig.busBeaconMat = busBeaconMat;
  }

  // Tag all child meshes with vehicleId so Raycaster clicks on any sub-part resolve cleanly
  root.traverse((obj) => {
    obj.userData.vehicleId = vehicleId;
  });

  return rig;
}

export function buildCargoProp(type: CargoTypeId): THREE.Group {
  const g = new THREE.Group();
  const paperBump = getPaperBumpTexture(4);
  if (type === 'apple') {
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 14, 12),
      makeGouacheMat('#DF443A', 4, { roughness: 0.42 }),
    );
    body.position.y = 0.24;
    body.castShadow = true;
    g.add(body);
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.03, 0.14, 6),
      new THREE.MeshStandardMaterial({ color: '#6E4222', roughness: 0.88 }),
    );
    stem.position.y = 0.48;
    g.add(stem);
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 6),
      new THREE.MeshStandardMaterial({ color: '#5EA846', roughness: 0.65 }),
    );
    leaf.scale.set(1.5, 0.5, 0.8);
    leaf.position.set(0.08, 0.5, 0);
    g.add(leaf);
  } else if (type === 'wood') {
    const logMat = new THREE.MeshStandardMaterial({
      map: createWoodPlankTexture('#A96832', 4),
      bumpMap: paperBump,
      bumpScale: 0.03,
      roughness: 0.84,
    });
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.58, 12), logMat);
    log.rotation.z = Math.PI / 2;
    log.position.y = 0.18;
    log.castShadow = true;
    g.add(log);
    const endMat = new THREE.MeshStandardMaterial({ color: '#E8CFA2', roughness: 0.85 });
    for (const ex of [-0.295, 0.295]) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 12), endMat);
      cap.rotation.z = Math.PI / 2;
      cap.position.set(ex, 0.18, 0);
      g.add(cap);
    }
  } else if (type === 'box') {
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.42, 0.42),
      makeGouacheMat('#865DC9', 4, { roughness: 0.58 }),
    );
    cube.position.y = 0.21;
    cube.castShadow = true;
    g.add(cube);
    const ribbonMat = makeGouacheMat('#F3C443', 4, { roughness: 0.48 });
    const ribbonH = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.09, 0.44), ribbonMat);
    ribbonH.position.y = 0.21;
    const ribbonV = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.44, 0.44), ribbonMat);
    ribbonV.position.y = 0.21;
    const bow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), ribbonMat);
    bow.scale.set(1.5, 0.65, 1.0);
    bow.position.y = 0.45;
    g.add(ribbonH, ribbonV, bow);
  } else {
    const brick = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.24, 0.3),
      new THREE.MeshStandardMaterial({
        map: createBrickTexture('#CC5C34', 4),
        bumpMap: paperBump,
        bumpScale: 0.03,
        roughness: 0.88,
      }),
    );
    brick.position.y = 0.12;
    brick.castShadow = true;
    g.add(brick);
  }
  return g;
}

export function buildWasteProp(kind: WasteKind): THREE.Group {
  const g = new THREE.Group();
  const paperBump = getPaperBumpTexture(4);
  if (kind === 'banana') {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.09, 8, 14, Math.PI * 0.85),
      makeGouacheMat('#F2C53D', 4, { roughness: 0.62 }),
    );
    arc.position.y = 0.28;
    arc.rotation.z = 0.4;
    arc.castShadow = true;
    g.add(arc);
  } else if (kind === 'apple_core') {
    const redMat = makeGouacheMat('#DC453A', 4, { roughness: 0.5 });
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), redMat);
    top.scale.set(1, 0.55, 1);
    top.position.y = 0.42;
    g.add(top);
    const mid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.26, 8),
      new THREE.MeshStandardMaterial({ color: '#FBF1D4', roughness: 0.78 }),
    );
    mid.position.y = 0.25;
    g.add(mid);
    const bot = top.clone();
    bot.position.y = 0.1;
    g.add(bot);
  } else if (kind === 'leaf') {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 10, 8),
      makeGouacheMat('#6DA848', 4, { roughness: 0.74 }),
    );
    leaf.scale.set(1.3, 0.22, 0.8);
    leaf.position.y = 0.14;
    leaf.castShadow = true;
    g.add(leaf);
  } else if (kind === 'bottle') {
    const mat = new THREE.MeshStandardMaterial({
      color: '#5EC2E4',
      roughness: 0.24,
      metalness: 0.08,
      transparent: true,
      opacity: 0.84,
    });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.46, 12), mat);
    body.position.y = 0.23;
    body.castShadow = true;
    g.add(body);
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.12, 10),
      makeGouacheMat('#2D6CC0', 4, { roughness: 0.5 }),
    );
    cap.position.y = 0.52;
    g.add(cap);
  } else if (kind === 'can') {
    const can = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.42, 14),
      new THREE.MeshStandardMaterial({
        color: '#DDD6C8',
        bumpMap: paperBump,
        bumpScale: 0.015,
        roughness: 0.36,
        metalness: 0.62,
      }),
    );
    can.position.y = 0.21;
    can.castShadow = true;
    g.add(can);
    const label = new THREE.Mesh(
      new THREE.CylinderGeometry(0.165, 0.165, 0.2, 14),
      makeGouacheMat('#3E82C6', 4, { roughness: 0.6 }),
    );
    label.position.y = 0.21;
    g.add(label);
  } else {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.36, 0.38),
      new THREE.MeshStandardMaterial({
        map: createWoodPlankTexture('#C68C48', 4),
        bumpMap: paperBump,
        bumpScale: 0.025,
        roughness: 0.88,
      }),
    );
    box.position.y = 0.18;
    box.castShadow = true;
    g.add(box);
  }
  return g;
}

export function buildShapeStone(shapeId: ShapeId, maxAnisotropy: number): THREE.Group {
  const g = new THREE.Group();
  const opt = SHAPE_MAP[shapeId];
  const mat = makeGouacheMat(opt.hex, maxAnisotropy, { roughness: 0.48, metalness: 0.08 });
  const rimMat = new THREE.MeshStandardMaterial({
    color: '#FBF1DA',
    roughness: 0.65,
    metalness: 0.04,
  });

  if (shapeId === 'circle') {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.48, 0.24, 24), mat);
    disc.position.y = 0.14;
    disc.castShadow = true;
    disc.receiveShadow = true;
    const inner = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 8, 22), rimMat);
    inner.rotation.x = Math.PI / 2;
    inner.position.y = 0.27;
    g.add(disc, inner);
  } else if (shapeId === 'square') {
    const block = new THREE.Mesh(makeRoundedBox(0.84, 0.24, 0.84, 0.1), mat);
    block.position.y = 0.14;
    block.castShadow = true;
    block.receiveShadow = true;
    const inlay = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.04, 0.52), rimMat);
    inlay.position.y = 0.27;
    g.add(block, inlay);
  } else if (shapeId === 'triangle') {
    const prism = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.56, 0.24, 3), mat);
    prism.position.y = 0.14;
    prism.castShadow = true;
    prism.receiveShadow = true;
    const inlay = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 3), rimMat);
    inlay.position.y = 0.27;
    g.add(prism, inlay);
  } else {
    const starShape = new THREE.Shape();
    const spikes = 5;
    const outerR = 0.52;
    const innerR = 0.24;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    starShape.closePath();
    const geo = new THREE.ExtrudeGeometry(starShape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 2,
    });
    geo.rotateX(-Math.PI / 2);
    const starMesh = new THREE.Mesh(geo, mat);
    starMesh.position.y = 0.04;
    starMesh.castShadow = true;
    starMesh.receiveShadow = true;
    g.add(starMesh);
  }
  return g;
}
