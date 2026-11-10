import * as THREE from 'three';
import { relicRuinTexture, stoneTexture, woodTexture, flameParticleTexture } from './textures';
import { LANE_WIDTH, getLaneX } from './Adventurer';

export type ObstacleType = 'low' | 'high' | 'blocker';

export interface ObstacleInstance {
  group: THREE.Group;
  type: ObstacleType;
  lane: number; // -1, 0, 1 or special multi-lane
  z: number;
  box: THREE.Box3;
  clearHeight: number; // for low obstacles (min jump height to clear)
  slideClearance: number; // for high obstacles (max standing height to pass under)
  active: boolean;
}

export class ObstacleManager {
  private materials: {
    stone: THREE.MeshStandardMaterial;
    wood: THREE.MeshStandardMaterial;
    relic: THREE.MeshStandardMaterial;
    moss: THREE.MeshStandardMaterial;
    darkStone: THREE.MeshStandardMaterial;
    fireBrazier: THREE.MeshStandardMaterial;
  };

  constructor() {
    this.materials = {
      stone: new THREE.MeshStandardMaterial({
        map: stoneTexture,
        roughness: 0.85,
        metalness: 0.1,
      }),
      wood: new THREE.MeshStandardMaterial({
        map: woodTexture,
        roughness: 0.8,
        metalness: 0.05,
      }),
      relic: new THREE.MeshStandardMaterial({
        map: relicRuinTexture,
        roughness: 0.65,
        metalness: 0.2,
      }),
      moss: new THREE.MeshStandardMaterial({
        color: 0x2e4f2b,
        roughness: 0.95,
        metalness: 0.0,
      }),
      darkStone: new THREE.MeshStandardMaterial({
        color: 0x1c1917,
        roughness: 0.9,
        metalness: 0.15,
      }),
      fireBrazier: new THREE.MeshStandardMaterial({
        color: 0x44403c,
        roughness: 0.7,
        metalness: 0.4,
      }),
    };
  }

  // 1. Fallen Mossy Log (Low obstacle - jump over)
  public createFallenLog(lane: number, z: number): ObstacleInstance {
    const group = new THREE.Group();
    const x = getLaneX(lane);

    // Main log
    const logGeo = new THREE.CylinderGeometry(0.38, 0.42, 2.4, 8);
    logGeo.rotateZ(Math.PI / 2);
    const logMesh = new THREE.Mesh(logGeo, this.materials.wood);
    logMesh.position.set(0, 0.38, 0);
    logMesh.castShadow = true;
    logMesh.receiveShadow = true;
    group.add(logMesh);

    // Moss patches on top
    const mossGeo = new THREE.CylinderGeometry(0.39, 0.43, 1.2, 8, 1, false, 0, Math.PI);
    mossGeo.rotateZ(Math.PI / 2);
    const mossMesh = new THREE.Mesh(mossGeo, this.materials.moss);
    mossMesh.position.set(0, 0.39, 0);
    group.add(mossMesh);

    // Broken branch stub
    const stubGeo = new THREE.CylinderGeometry(0.12, 0.18, 0.6, 6);
    stubGeo.rotateX(0.5);
    const stub = new THREE.Mesh(stubGeo, this.materials.wood);
    stub.position.set(0.4, 0.6, 0.1);
    group.add(stub);

    group.position.set(x, 0, z);

    const box = new THREE.Box3();
    box.setFromCenterAndSize(new THREE.Vector3(x, 0.45, z), new THREE.Vector3(2.4, 0.9, 0.9));

    return {
      group,
      type: 'low',
      lane,
      z,
      box,
      clearHeight: 0.9,
      slideClearance: 0,
      active: true,
    };
  }

  // 2. Low Stone Barrier / Spike Barricade (Low obstacle - jump over)
  public createLowBarrier(lane: number, z: number): ObstacleInstance {
    const group = new THREE.Group();
    const x = getLaneX(lane);

    // Stone base
    const baseGeo = new THREE.BoxGeometry(2.3, 0.4, 0.6);
    const base = new THREE.Mesh(baseGeo, this.materials.relic);
    base.position.set(0, 0.2, 0);
    base.castShadow = true;
    group.add(base);

    // Ancient wooden spiked stakes
    for (let i = -0.8; i <= 0.8; i += 0.5) {
      const stakeGeo = new THREE.ConeGeometry(0.12, 0.65, 5);
      const stake = new THREE.Mesh(stakeGeo, this.materials.wood);
      stake.position.set(i, 0.65, 0);
      stake.castShadow = true;
      group.add(stake);
    }

    group.position.set(x, 0, z);

    const box = new THREE.Box3();
    box.setFromCenterAndSize(new THREE.Vector3(x, 0.5, z), new THREE.Vector3(2.4, 1.0, 0.8));

    return {
      group,
      type: 'low',
      lane,
      z,
      box,
      clearHeight: 1.0,
      slideClearance: 0,
      active: true,
    };
  }

  // 3. Low Hanging Temple Arch / Carved Lintel (High obstacle - slide under)
  public createHangingArch(lane: number, z: number): ObstacleInstance {
    const group = new THREE.Group();
    const x = getLaneX(lane);

    // Left and right support brackets on sides
    const leftBracket = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.8, 0.7), this.materials.stone);
    leftBracket.position.set(-1.15, 1.6, 0);
    leftBracket.castShadow = true;

    const rightBracket = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.8, 0.7), this.materials.stone);
    rightBracket.position.set(1.15, 1.6, 0);
    rightBracket.castShadow = true;

    // Heavy overhead stone beam with runes
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.8, 0.8), this.materials.relic);
    lintel.position.set(0, 1.6, 0); // bottom sits at 1.2m above track
    lintel.castShadow = true;

    // Hanging jungle creepers / vines from bottom of arch
    const vineMat = new THREE.MeshStandardMaterial({ color: 0x1e3a1e, roughness: 0.9 });
    for (let v = -0.8; v <= 0.8; v += 0.4) {
      const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 4), vineMat);
      vine.position.set(v, 1.0, 0);
      group.add(vine);
    }

    group.add(leftBracket);
    group.add(rightBracket);
    group.add(lintel);
    group.position.set(x, 0, z);

    const box = new THREE.Box3();
    // Hitbox only covers the upper portion (from y = 0.95 to 2.2)
    box.setFromCenterAndSize(new THREE.Vector3(x, 1.6, z), new THREE.Vector3(2.5, 0.9, 0.8));

    return {
      group,
      type: 'high',
      lane,
      z,
      box,
      clearHeight: 99,
      slideClearance: 0.85, // standing character hits this, sliding passes under!
      active: true,
    };
  }

  // 4. Giant Ancient Stone Idol Head (Blocker - change lanes!)
  public createIdolBlocker(lane: number, z: number): ObstacleInstance {
    const group = new THREE.Group();
    const x = getLaneX(lane);

    // Giant carved stone head
    const headGeo = new THREE.BoxGeometry(1.6, 2.4, 1.6);
    const headMesh = new THREE.Mesh(headGeo, this.materials.relic);
    headMesh.position.set(0, 1.2, 0);
    headMesh.castShadow = true;
    group.add(headMesh);

    // Stone brow & headdress
    const browGeo = new THREE.BoxGeometry(1.8, 0.45, 1.8);
    const browMesh = new THREE.Mesh(browGeo, this.materials.stone);
    browMesh.position.set(0, 2.2, 0);
    browMesh.castShadow = true;
    group.add(browMesh);

    // Glowing ruby eyes
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.1), eyeMat);
    leftEye.position.set(-0.4, 1.4, -0.82);
    const rightEye = leftEye.clone();
    rightEye.position.set(0.4, 1.4, -0.82);
    group.add(leftEye);
    group.add(rightEye);

    // Broken temple rubble around base
    const rubbleMat = this.materials.darkStone;
    for (let r = 0; r < 4; r++) {
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25), rubbleMat);
      stone.position.set((Math.random() - 0.5) * 1.8, 0.2, (Math.random() - 0.5) * 1.8);
      group.add(stone);
    }

    group.position.set(x, 0, z);

    const box = new THREE.Box3();
    box.setFromCenterAndSize(new THREE.Vector3(x, 1.2, z), new THREE.Vector3(1.8, 2.5, 1.8));

    return {
      group,
      type: 'blocker',
      lane,
      z,
      box,
      clearHeight: 99,
      slideClearance: 0,
      active: true,
    };
  }

  // 5. Flaming Temple Brazier (Blocker - change lanes!)
  public createFlamingBrazier(lane: number, z: number): ObstacleInstance {
    const group = new THREE.Group();
    const x = getLaneX(lane);

    // Stone pedestal
    const pedGeo = new THREE.CylinderGeometry(0.65, 0.8, 0.7, 8);
    const pedestal = new THREE.Mesh(pedGeo, this.materials.fireBrazier);
    pedestal.position.y = 0.35;
    pedestal.castShadow = true;
    group.add(pedestal);

    // Iron fire bowl
    const bowlGeo = new THREE.CylinderGeometry(0.85, 0.45, 0.5, 8);
    const bowl = new THREE.Mesh(bowlGeo, this.materials.darkStone);
    bowl.position.y = 0.85;
    bowl.castShadow = true;
    group.add(bowl);

    // Dynamic fire flame sprite / mesh
    const fireGeo = new THREE.ConeGeometry(0.65, 1.1, 7);
    const fireMat = new THREE.MeshStandardMaterial({
      color: 0xffa500,
      emissive: 0xff4500,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    });
    const fire = new THREE.Mesh(fireGeo, fireMat);
    fire.position.y = 1.45;
    group.add(fire);

    // Warm flickering point light
    const fireLight = new THREE.PointLight(0xff7700, 2.2, 7);
    fireLight.position.set(0, 1.5, 0);
    group.add(fireLight);

    group.position.set(x, 0, z);

    const box = new THREE.Box3();
    box.setFromCenterAndSize(new THREE.Vector3(x, 0.9, z), new THREE.Vector3(1.6, 2.0, 1.6));

    return {
      group,
      type: 'blocker',
      lane,
      z,
      box,
      clearHeight: 99,
      slideClearance: 0,
      active: true,
    };
  }

  // 6. Fallen Broken Pillar across 2 lanes (Forces player to the 1 remaining open lane)
  public createDoubleLanePillar(blockedLanes: [number, number], z: number): ObstacleInstance {
    const group = new THREE.Group();
    const midX = (getLaneX(blockedLanes[0]) + getLaneX(blockedLanes[1])) / 2;

    // Massive cracked marble/stone pillar
    const pillarGeo = new THREE.CylinderGeometry(0.55, 0.6, LANE_WIDTH * 2.2, 10);
    pillarGeo.rotateZ(Math.PI / 2);
    const pillarMesh = new THREE.Mesh(pillarGeo, this.materials.stone);
    pillarMesh.position.set(0, 0.55, 0);
    pillarMesh.castShadow = true;
    group.add(pillarMesh);

    // Capital ring details
    const ringGeo = new THREE.TorusGeometry(0.62, 0.1, 8, 16);
    ringGeo.rotateY(Math.PI / 2);
    const ring1 = new THREE.Mesh(ringGeo, this.materials.relic);
    ring1.position.set(-LANE_WIDTH * 0.8, 0.55, 0);
    const ring2 = ring1.clone();
    ring2.position.set(LANE_WIDTH * 0.8, 0.55, 0);
    group.add(ring1);
    group.add(ring2);

    group.position.set(midX, 0, z);

    const box = new THREE.Box3();
    box.setFromCenterAndSize(new THREE.Vector3(midX, 0.8, z), new THREE.Vector3(LANE_WIDTH * 2.1, 1.6, 1.2));

    return {
      group,
      type: 'blocker',
      lane: blockedLanes[0],
      z,
      box,
      clearHeight: 99,
      slideClearance: 0,
      active: true,
    };
  }
}
