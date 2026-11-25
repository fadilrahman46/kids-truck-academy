import * as THREE from 'three';
import type { CargoTypeId, VehicleId, WasteKind } from '../types/game';
import { createContactShadowTexture, createMixerStripeTexture } from './textures';

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
  // Crane specific
  turretGroup?: THREE.Group;
  boomGroup?: THREE.Group;
  cableMesh?: THREE.Mesh;
  hookGroup?: THREE.Group;
  // Pemadam specific
  sirenLeftMat?: THREE.MeshStandardMaterial;
  sirenRightMat?: THREE.MeshStandardMaterial;
  nozzleGroup?: THREE.Group;
  // Sampah specific
  hopperGroup?: THREE.Group;
}

let sharedShadowTex: THREE.CanvasTexture | null = null;
function getShadowTexture(): THREE.CanvasTexture {
  if (!sharedShadowTex) {
    sharedShadowTex = createContactShadowTexture();
  }
  return sharedShadowTex;
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

function createWheel(radius = 0.44, width = 0.28): THREE.Group {
  const wheel = new THREE.Group();
  const tireMat = new THREE.MeshStandardMaterial({
    color: '#2B3340',
    roughness: 0.88,
    metalness: 0.04,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: '#E2E8F0',
    roughness: 0.22,
    metalness: 0.78,
  });
  const hubMat = new THREE.MeshStandardMaterial({
    color: '#F59E0B',
    roughness: 0.35,
    metalness: 0.4,
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
    new THREE.CylinderGeometry(radius * 0.22, radius * 0.22, width + 0.06, 10),
    hubMat,
  );
  hub.rotation.x = Math.PI / 2;
  wheel.add(hub);

  // Small spoke bar so wheel rotation is super obvious to kids!
  const spoke = new THREE.Mesh(
    new THREE.BoxGeometry(radius * 0.86, 0.08, width + 0.045),
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
  wheelCount: 4 | 6 = 4,
): void {
  // Soft contact shadow directly under truck at y = 0.035
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 2.5),
    new THREE.MeshBasicMaterial({
      map: getShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    }),
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.035;
  root.add(shadowPlane);

  const chassisMat = new THREE.MeshStandardMaterial({
    color: '#334155',
    roughness: 0.72,
    metalness: 0.25,
  });
  const cabMat = new THREE.MeshStandardMaterial({
    color: cabColorHex,
    roughness: 0.42,
    metalness: 0.08,
  });
  const stripeMat = new THREE.MeshStandardMaterial({
    color: stripeColorHex,
    roughness: 0.48,
    metalness: 0.05,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#BAE6FD',
    roughness: 0.12,
    metalness: 0.15,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: '#F1F5F9',
    roughness: 0.2,
    metalness: 0.82,
  });
  const headlightMat = new THREE.MeshStandardMaterial({
    color: '#FEF08A',
    emissive: '#FDE047',
    emissiveIntensity: 0.4,
    roughness: 0.2,
    metalness: 0.1,
  });

  // Main Chassis Beam
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.34, 1.48), chassisMat);
  chassis.position.set(0, 0.58, 0);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  bodyGroup.add(chassis);

  // Front Beveled Cab (+X is front of truck)
  const cab = new THREE.Mesh(makeRoundedBox(1.25, 1.32, 1.46, 0.22), cabMat);
  cab.position.set(1.18, 1.38, 0);
  cab.castShadow = true;
  cab.receiveShadow = true;
  bodyGroup.add(cab);

  // Cab Nose Hood
  const hood = new THREE.Mesh(makeRoundedBox(0.55, 0.72, 1.4, 0.15), cabMat);
  hood.position.set(1.86, 1.08, 0);
  hood.castShadow = true;
  bodyGroup.add(hood);

  // Accent Stripe across cab side
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.18, 1.54), stripeMat);
  stripe.position.set(1.18, 1.0, 0);
  bodyGroup.add(stripe);

  // Windshield
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.54, 1.24), glassMat);
  windshield.position.set(1.8, 1.62, 0);
  windshield.rotation.z = 0.12;
  bodyGroup.add(windshield);

  // Side windows
  const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.48, 1.54), glassMat);
  sideWin.position.set(1.26, 1.58, 0);
  bodyGroup.add(sideWin);

  // Chrome front bumper
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 1.66), chromeMat);
  bumper.position.set(2.14, 0.68, 0);
  bumper.castShadow = true;
  bodyGroup.add(bumper);

  // Friendly expressive headlight eyes!
  for (const side of [-0.46, 0.46]) {
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 14), headlightMat);
    lamp.rotation.z = Math.PI / 2;
    lamp.position.set(2.14, 1.06, side);
    bodyGroup.add(lamp);

    // Cute pupil dot inside headlight for friendly storybook character
    const pupil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.14, 10),
      chassisMat,
    );
    pupil.rotation.z = Math.PI / 2;
    pupil.position.set(2.15, 1.06, side);
    bodyGroup.add(pupil);
  }

  // Cheerful chrome grille
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.26, 0.52), chromeMat);
  grille.position.set(2.16, 0.94, 0);
  bodyGroup.add(grille);

  // Exhaust Pipe behind cab
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 10), chromeMat);
  exhaust.position.set(0.42, 1.45, -0.78);
  exhaust.castShadow = true;
  bodyGroup.add(exhaust);

  // Wheels resting flush at y = 0.44 -> bottom at y = 0
  const wheelXs = wheelCount === 6 ? [1.28, -0.45, -1.42] : [1.22, -1.08];
  for (const wx of wheelXs) {
    for (const wz of [-0.8, 0.8]) {
      const w = createWheel(0.44, 0.28);
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

  const rig: TruckRig = {
    id: vehicleId,
    root,
    bodyGroup,
    wheels,
  };

  if (vehicleId === 'molen') {
    addBaseChassisAndCab(root, bodyGroup, wheels, '#F59E0B', '#FEF3C7', 6);

    // Drum cradle support
    const supportMat = new THREE.MeshStandardMaterial({
      color: '#475569',
      roughness: 0.65,
      metalness: 0.35,
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

    const stripeTex = createMixerStripeTexture('#F59E0B', maxAnisotropy);
    const drumMat = new THREE.MeshStandardMaterial({
      map: stripeTex,
      roughness: 0.36,
      metalness: 0.12,
    });
    const drumMesh = new THREE.Mesh(drumGeo, drumMat);
    drumMesh.castShadow = true;
    drumMesh.receiveShadow = true;
    drumGroup.add(drumMesh);

    // Rear chute
    const chuteGroup = new THREE.Group();
    chuteGroup.position.set(-1.82, 1.48, 0);
    const chuteMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.14, 0.42),
      new THREE.MeshStandardMaterial({ color: '#94A3B8', roughness: 0.35, metalness: 0.6 }),
    );
    chuteMesh.position.set(-0.32, -0.2, 0);
    chuteMesh.rotation.z = 0.45;
    chuteGroup.add(chuteMesh);
    bodyGroup.add(chuteGroup);

    rig.drumGroup = drumGroup;
    rig.drumMaterial = drumMat;
    rig.chuteGroup = chuteGroup;
  } else if (vehicleId === 'angkut') {
    addBaseChassisAndCab(root, bodyGroup, wheels, '#2563EB', '#DBEAFE', 4);

    // Hinged Cargo / Dump Bed
    const bedGroup = new THREE.Group();
    bedGroup.position.set(-1.6, 0.85, 0); // pivot near rear
    bodyGroup.add(bedGroup);

    const bedMat = new THREE.MeshStandardMaterial({
      color: '#F59E0B',
      roughness: 0.46,
      metalness: 0.12,
    });
    const bedTrimMat = new THREE.MeshStandardMaterial({
      color: '#D97706',
      roughness: 0.55,
      metalness: 0.15,
    });

    // Floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.18, 1.6), bedMat);
    floor.position.set(1.05, 0.1, 0);
    floor.castShadow = true;
    floor.receiveShadow = true;
    bedGroup.add(floor);

    // Side walls
    for (const sz of [-0.76, 0.76]) {
      const side = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.68, 0.12), bedMat);
      side.position.set(1.05, 0.48, sz);
      side.castShadow = true;
      bedGroup.add(side);
    }
    // Front bulkhead
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.82, 1.6), bedTrimMat);
    frontWall.position.set(2.08, 0.54, 0);
    frontWall.castShadow = true;
    bedGroup.add(frontWall);

    // Rear tailgate
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 1.52), bedTrimMat);
    backWall.position.set(0.02, 0.44, 0);
    bedGroup.add(backWall);

    const cargoSlot = new THREE.Group();
    cargoSlot.position.set(1.05, 0.22, 0);
    bedGroup.add(cargoSlot);

    rig.bedGroup = bedGroup;
    rig.cargoSlot = cargoSlot;
  } else if (vehicleId === 'tangki') {
    addBaseChassisAndCab(root, bodyGroup, wheels, '#0284C7', '#E0F2FE', 6);

    // White & sky-blue cylindrical tanker body
    const tankShellMat = new THREE.MeshStandardMaterial({
      color: '#F8FAFC',
      roughness: 0.28,
      metalness: 0.25,
    });
    const capMat = new THREE.MeshStandardMaterial({
      color: '#0369A1',
      roughness: 0.35,
      metalness: 0.35,
    });
    const glassWindowMat = new THREE.MeshStandardMaterial({
      color: '#E0F2FE',
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.35,
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

    // Rounded end caps
    for (const ex of [-1.78, 0.42]) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.77, 18, 14), capMat);
      cap.scale.set(0.45, 1, 1);
      cap.position.set(ex, 1.55, 0);
      bodyGroup.add(cap);
    }

    // Top hatch domes
    for (const hx of [-1.15, -0.25]) {
      const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.18, 14), capMat);
      hatch.position.set(hx, 2.35, 0);
      bodyGroup.add(hatch);
    }

    // Big side water gauge window (on +Z side facing camera)
    const gaugeFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.48, 0.92, 0.14),
      new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.45, metalness: 0.4 }),
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
      color: '#38BDF8',
      emissive: '#0284C7',
      emissiveIntensity: 0.35,
      roughness: 0.15,
      metalness: 0.1,
    });
    const waterFillMesh = new THREE.Mesh(waterFillGeo, waterFillMat);
    waterFillMesh.position.set(-0.68, 1.19, 0.79);
    waterFillMesh.scale.y = 0.05;
    bodyGroup.add(waterFillMesh);

    rig.waterFillMesh = waterFillMesh;
  } else if (vehicleId === 'crane') {
    addBaseChassisAndCab(root, bodyGroup, wheels, '#EAB308', '#1E293B', 6);

    // Turret base
    const turretGroup = new THREE.Group();
    turretGroup.position.set(-0.72, 0.84, 0);
    bodyGroup.add(turretGroup);

    const turretMat = new THREE.MeshStandardMaterial({
      color: '#CA8A04',
      roughness: 0.4,
      metalness: 0.25,
    });
    const darkMetal = new THREE.MeshStandardMaterial({
      color: '#334155',
      roughness: 0.5,
      metalness: 0.65,
    });

    const baseCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.68, 0.38, 16), darkMetal);
    baseCyl.position.y = 0.18;
    turretGroup.add(baseCyl);

    const craneHouse = new THREE.Mesh(makeRoundedBox(1.15, 0.82, 1.05, 0.12), turretMat);
    craneHouse.position.set(-0.1, 0.72, 0);
    craneHouse.castShadow = true;
    turretGroup.add(craneHouse);

    // Boom arm extending upward and outward
    const boomGroup = new THREE.Group();
    boomGroup.position.set(0.1, 0.95, 0);
    turretGroup.add(boomGroup);

    const boomMesh = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.32, 0.34), turretMat);
    boomMesh.position.set(-1.35, 1.35, 0);
    boomMesh.rotation.z = -0.78;
    boomMesh.castShadow = true;
    boomGroup.add(boomMesh);

    const pulley = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.42, 14), darkMetal);
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
      new THREE.MeshStandardMaterial({ color: '#F97316', roughness: 0.35, metalness: 0.5 }),
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
    addBaseChassisAndCab(root, bodyGroup, wheels, '#DC2626', '#FFFFFF', 6);

    const redBodyMat = new THREE.MeshStandardMaterial({
      color: '#DC2626',
      roughness: 0.36,
      metalness: 0.12,
    });
    const shutterMat = new THREE.MeshStandardMaterial({
      color: '#E2E8F0',
      roughness: 0.32,
      metalness: 0.65,
    });
    const ladderMat = new THREE.MeshStandardMaterial({
      color: '#F1F5F9',
      roughness: 0.25,
      metalness: 0.72,
    });

    // Rear fire engine equipment box
    const equipBox = new THREE.Mesh(makeRoundedBox(2.2, 1.28, 1.52, 0.12), redBodyMat);
    equipBox.position.set(-0.68, 1.36, 0);
    equipBox.castShadow = true;
    equipBox.receiveShadow = true;
    bodyGroup.add(equipBox);

    // Equipment roller shutters on sides
    for (const sz of [-0.79, 0.79]) {
      const shutter = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.66, 0.06), shutterMat);
      shutter.position.set(-0.68, 1.24, sz);
      bodyGroup.add(shutter);
    }

    // Flashing roof beacons (red & blue)
    const sirenLeftMat = new THREE.MeshStandardMaterial({
      color: '#EF4444',
      emissive: '#EF4444',
      emissiveIntensity: 0.25,
      roughness: 0.2,
    });
    const sirenRightMat = new THREE.MeshStandardMaterial({
      color: '#3B82F6',
      emissive: '#3B82F6',
      emissiveIntensity: 0.25,
      roughness: 0.2,
    });
    const beaconL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.22, 12), sirenLeftMat);
    beaconL.position.set(1.25, 2.15, -0.35);
    bodyGroup.add(beaconL);

    const beaconR = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.22, 12), sirenRightMat);
    beaconR.position.set(1.25, 2.15, 0.35);
    bodyGroup.add(beaconR);

    // Roof ladder
    const ladderRail1 = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.08, 0.08), ladderMat);
    ladderRail1.position.set(-0.65, 2.12, -0.26);
    bodyGroup.add(ladderRail1);
    const ladderRail2 = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.08, 0.08), ladderMat);
    ladderRail2.position.set(-0.65, 2.12, 0.26);
    bodyGroup.add(ladderRail2);
    for (let i = 0; i < 6; i++) {
      const rung = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.5), ladderMat);
      rung.position.set(-1.55 + i * 0.36, 2.12, 0);
      bodyGroup.add(rung);
    }

    // Aimable 3D water cannon nozzle mounted atop rear deck
    const nozzleGroup = new THREE.Group();
    nozzleGroup.position.set(0.05, 2.28, 0);
    const turret = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.24, 12),
      new THREE.MeshStandardMaterial({ color: '#FACC15', roughness: 0.3, metalness: 0.5 }),
    );
    nozzleGroup.add(turret);
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.11, 0.72, 12),
      new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.25, metalness: 0.8 }),
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.12, 0.32);
    nozzleGroup.add(barrel);
    bodyGroup.add(nozzleGroup);

    rig.sirenLeftMat = sirenLeftMat;
    rig.sirenRightMat = sirenRightMat;
    rig.nozzleGroup = nozzleGroup;
  } else if (vehicleId === 'sampah') {
    addBaseChassisAndCab(root, bodyGroup, wheels, '#16A34A', '#FEF08A', 6);

    const greenBodyMat = new THREE.MeshStandardMaterial({
      color: '#22C55E',
      roughness: 0.44,
      metalness: 0.08,
    });
    const whiteTrimMat = new THREE.MeshStandardMaterial({
      color: '#F8FAFC',
      roughness: 0.42,
      metalness: 0.1,
    });
    const darkTrim = new THREE.MeshStandardMaterial({
      color: '#15803D',
      roughness: 0.5,
      metalness: 0.15,
    });

    // Compactor box
    const compactor = new THREE.Mesh(makeRoundedBox(1.9, 1.38, 1.56, 0.14), greenBodyMat);
    compactor.position.set(-0.48, 1.42, 0);
    compactor.castShadow = true;
    compactor.receiveShadow = true;
    bodyGroup.add(compactor);

    // Clean white recycle stripe
    const band = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.34, 1.6), whiteTrimMat);
    band.position.set(-0.48, 1.45, 0);
    bodyGroup.add(band);

    // Rear articulated hopper / compactor tail
    const hopperGroup = new THREE.Group();
    hopperGroup.position.set(-1.42, 1.85, 0);
    bodyGroup.add(hopperGroup);

    const hopperShell = new THREE.Mesh(makeRoundedBox(0.75, 1.15, 1.5, 0.14), darkTrim);
    hopperShell.position.set(-0.28, -0.45, 0);
    hopperShell.castShadow = true;
    hopperGroup.add(hopperShell);

    rig.hopperGroup = hopperGroup;
  }

  // Tag all child meshes with vehicleId so Raycaster clicks on any sub-part resolve cleanly
  root.traverse((obj) => {
    obj.userData.vehicleId = vehicleId;
  });

  return rig;
}

export function buildCargoProp(type: CargoTypeId): THREE.Group {
  const g = new THREE.Group();
  if (type === 'apple') {
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 14, 12),
      new THREE.MeshStandardMaterial({ color: '#EF4444', roughness: 0.32, metalness: 0.05 }),
    );
    body.position.y = 0.24;
    body.castShadow = true;
    g.add(body);
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.03, 0.14, 6),
      new THREE.MeshStandardMaterial({ color: '#78350F', roughness: 0.8 }),
    );
    stem.position.y = 0.48;
    g.add(stem);
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 6),
      new THREE.MeshStandardMaterial({ color: '#22C55E', roughness: 0.5 }),
    );
    leaf.scale.set(1.5, 0.5, 0.8);
    leaf.position.set(0.08, 0.5, 0);
    g.add(leaf);
  } else if (type === 'wood') {
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.58, 12),
      new THREE.MeshStandardMaterial({ color: '#B45309', roughness: 0.78, metalness: 0.02 }),
    );
    log.rotation.z = Math.PI / 2;
    log.position.y = 0.18;
    log.castShadow = true;
    g.add(log);
  } else if (type === 'box') {
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.42, 0.42),
      new THREE.MeshStandardMaterial({ color: '#8B5CF6', roughness: 0.45, metalness: 0.05 }),
    );
    cube.position.y = 0.21;
    cube.castShadow = true;
    g.add(cube);
    const ribbon = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.1, 0.44),
      new THREE.MeshStandardMaterial({ color: '#FACC15', roughness: 0.35 }),
    );
    ribbon.position.y = 0.21;
    g.add(ribbon);
  } else {
    const brick = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.24, 0.3),
      new THREE.MeshStandardMaterial({ color: '#EA580C', roughness: 0.82, metalness: 0.02 }),
    );
    brick.position.y = 0.12;
    brick.castShadow = true;
    g.add(brick);
  }
  return g;
}

export function buildWasteProp(kind: WasteKind): THREE.Group {
  const g = new THREE.Group();
  if (kind === 'banana') {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.09, 8, 14, Math.PI * 0.85),
      new THREE.MeshStandardMaterial({ color: '#FACC15', roughness: 0.5 }),
    );
    arc.position.y = 0.28;
    arc.rotation.z = 0.4;
    arc.castShadow = true;
    g.add(arc);
  } else if (kind === 'apple_core') {
    const top = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 10, 8),
      new THREE.MeshStandardMaterial({ color: '#EF4444', roughness: 0.4 }),
    );
    top.scale.set(1, 0.55, 1);
    top.position.y = 0.42;
    g.add(top);
    const mid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.26, 8),
      new THREE.MeshStandardMaterial({ color: '#FEF3C7', roughness: 0.7 }),
    );
    mid.position.y = 0.25;
    g.add(mid);
    const bot = top.clone();
    bot.position.y = 0.1;
    g.add(bot);
  } else if (kind === 'leaf') {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 10, 8),
      new THREE.MeshStandardMaterial({ color: '#22C55E', roughness: 0.6 }),
    );
    leaf.scale.set(1.3, 0.22, 0.8);
    leaf.position.y = 0.14;
    leaf.castShadow = true;
    g.add(leaf);
  } else if (kind === 'bottle') {
    const mat = new THREE.MeshStandardMaterial({
      color: '#38BDF8',
      roughness: 0.18,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.46, 12), mat);
    body.position.y = 0.23;
    body.castShadow = true;
    g.add(body);
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.12, 10),
      new THREE.MeshStandardMaterial({ color: '#2563EB', roughness: 0.4 }),
    );
    cap.position.y = 0.52;
    g.add(cap);
  } else if (kind === 'can') {
    const can = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.42, 14),
      new THREE.MeshStandardMaterial({ color: '#CBD5E1', roughness: 0.22, metalness: 0.82 }),
    );
    can.position.y = 0.21;
    can.castShadow = true;
    g.add(can);
    const label = new THREE.Mesh(
      new THREE.CylinderGeometry(0.165, 0.165, 0.2, 14),
      new THREE.MeshStandardMaterial({ color: '#3B82F6', roughness: 0.45 }),
    );
    label.position.y = 0.21;
    g.add(label);
  } else {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.36, 0.38),
      new THREE.MeshStandardMaterial({ color: '#D97706', roughness: 0.85, metalness: 0.02 }),
    );
    box.position.y = 0.18;
    box.castShadow = true;
    g.add(box);
  }
  return g;
}
