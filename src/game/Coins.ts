import * as THREE from 'three';
import { coinTexture } from './textures';
import { LANE_WIDTH, getLaneX } from './Adventurer';

export type PowerupType = 'magnet' | 'shield' | 'rush';

export interface CoinItem {
  mesh: THREE.Mesh;
  lane: number;
  z: number;
  baseY: number;
  collected: boolean;
  box: THREE.Box3;
}

export interface PowerupItem {
  group: THREE.Group;
  type: PowerupType;
  lane: number;
  z: number;
  collected: boolean;
  box: THREE.Box3;
}

export class CoinManager {
  private coinGeometry: THREE.CylinderGeometry;
  private coinMaterial: THREE.MeshStandardMaterial;

  constructor() {
    // 3D Ancient Gold Relic Coin (Coin cylinder with embossed sun face)
    this.coinGeometry = new THREE.CylinderGeometry(0.42, 0.42, 0.08, 18);
    this.coinGeometry.rotateX(Math.PI / 2); // face forward/back

    this.coinMaterial = new THREE.MeshStandardMaterial({
      map: coinTexture,
      color: 0xffdf00,
      metalness: 0.9,
      roughness: 0.25,
      emissive: 0x92400e,
      emissiveIntensity: 0.35,
    });
  }

  // Create single coin
  public createCoin(lane: number, y: number, z: number): CoinItem {
    const mesh = new THREE.Mesh(this.coinGeometry, this.coinMaterial);
    const x = getLaneX(lane);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;

    const box = new THREE.Box3();
    box.setFromCenterAndSize(new THREE.Vector3(x, y, z), new THREE.Vector3(0.9, 0.9, 0.9));

    return {
      mesh,
      lane,
      z,
      baseY: y,
      collected: false,
      box,
    };
  }

  // Create row of coins on a lane
  public createCoinRow(lane: number, startZ: number, count: number = 5, spacing: number = 3): CoinItem[] {
    const coins: CoinItem[] = [];
    for (let i = 0; i < count; i++) {
      const z = startZ + i * spacing;
      coins.push(this.createCoin(lane, 0.9, z));
    }
    return coins;
  }

  // Create arc of coins over an obstacle (guiding a jump!)
  public createCoinJumpArc(lane: number, startZ: number, count: number = 5, spacing: number = 2.4): CoinItem[] {
    const coins: CoinItem[] = [];
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1); // 0 to 1
      const arcY = 0.9 + Math.sin(t * Math.PI) * 1.8; // peaks at 2.7m
      const z = startZ + i * spacing;
      coins.push(this.createCoin(lane, arcY, z));
    }
    return coins;
  }

  // Create a 3D Powerup Relic (Magnet, Shield, Rush)
  public createPowerup(lane: number, z: number, type: PowerupType): PowerupItem {
    const group = new THREE.Group();
    const x = getLaneX(lane);
    const y = 1.2;

    if (type === 'magnet') {
      // U-shaped Red Magnet with silver tips
      const magnetMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        roughness: 0.3,
        metalness: 0.7,
        emissive: 0x7f1d1d,
        emissiveIntensity: 0.4,
      });
      const tipMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.2,
        metalness: 0.9,
      });

      const horseshoe = new THREE.TorusGeometry(0.35, 0.1, 8, 16, Math.PI);
      horseshoe.rotateZ(Math.PI);
      const ring = new THREE.Mesh(horseshoe, magnetMat);
      group.add(ring);

      const leftTip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), tipMat);
      leftTip.position.set(-0.35, -0.15, 0);
      const rightTip = leftTip.clone();
      rightTip.position.set(0.35, -0.15, 0);
      group.add(leftTip);
      group.add(rightTip);
    } else if (type === 'shield') {
      // Cyan Ancient Mayan Protective Glyph Shield
      const shieldMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        roughness: 0.2,
        metalness: 0.8,
        emissive: 0x0891b2,
        emissiveIntensity: 0.6,
      });
      const shieldGeo = new THREE.OctahedronGeometry(0.45, 0);
      const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
      group.add(shieldMesh);
    } else {
      // 'rush' - Golden Eagle Relic / Speed Rush
      const rushMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.2,
        metalness: 0.9,
        emissive: 0xd97706,
        emissiveIntensity: 0.8,
      });
      const rushGeo = new THREE.ConeGeometry(0.4, 0.9, 5);
      rushGeo.rotateZ(Math.PI / 2);
      const rushMesh = new THREE.Mesh(rushGeo, rushMat);
      group.add(rushMesh);
    }

    // Glowing halo ring around all powerups
    const haloMat = new THREE.MeshBasicMaterial({
      color: type === 'magnet' ? 0xff4444 : type === 'shield' ? 0x22d3ee : 0xfbbf24,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    const haloGeo = new THREE.TorusGeometry(0.65, 0.03, 8, 20);
    const halo = new THREE.Mesh(haloGeo, haloMat);
    group.add(halo);

    group.position.set(x, y, z);

    const box = new THREE.Box3();
    box.setFromCenterAndSize(new THREE.Vector3(x, y, z), new THREE.Vector3(1.2, 1.2, 1.2));

    return {
      group,
      type,
      lane,
      z,
      collected: false,
      box,
    };
  }
}
