import * as THREE from 'three';
import { stoneTexture, woodTexture, relicRuinTexture, turnArrowTexture } from './textures';
import { ObstacleManager, ObstacleInstance } from './Obstacles';
import { CoinManager, CoinItem, PowerupItem, PowerupType } from './Coins';
import { LANE_WIDTH, getLaneX } from './Adventurer';

export const CHUNK_LENGTH = 45; // meters per straight chunk
export const TRACK_WIDTH = LANE_WIDTH * 3.4; // width of 3 lanes plus side margin (~8.8m)

export type ChunkType = 'stone' | 'wood' | 'ruins' | 'gap' | 'turn_left' | 'turn_right';

export interface TrackChunk {
  group: THREE.Group;
  index: number;
  type: ChunkType;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  headingAngle: number; // radians: 0, π/2, π, -π/2
  exitAngle: number;
  dir: THREE.Vector3;
  right: THREE.Vector3;
  length: number;
  obstacles: ObstacleInstance[];
  coins: CoinItem[];
  powerups: PowerupItem[];
  pointLights: THREE.PointLight[];
  // Turn specifics
  isCorner: boolean;
  turnDirection?: 'left' | 'right';
  turnDist?: number; // local Z where turn intersection sits
  turnZoneStart?: number;
  turnZoneEnd?: number;
  hasTurned?: boolean;
  // Gap specifics
  hasGap?: boolean;
  gapZStart?: number;
  gapZEnd?: number;
  gapLanes?: number[];
}

export class TrackGenerator {
  public scene: THREE.Scene;
  public chunks: TrackChunk[] = [];
  public obstacleMgr: ObstacleManager;
  public coinMgr: CoinManager;

  // Shared Materials
  private stonePathMat: THREE.MeshStandardMaterial;
  private woodPathMat: THREE.MeshStandardMaterial;
  private ruinPillarMat: THREE.MeshStandardMaterial;
  private jungleTrunkMat: THREE.MeshStandardMaterial;
  private jungleLeafMat: THREE.MeshStandardMaterial;
  private jungleRockMat: THREE.MeshStandardMaterial;
  private ropeMat: THREE.MeshStandardMaterial;
  private chasmMat: THREE.MeshBasicMaterial;
  private turnArrowMat: THREE.MeshBasicMaterial;

  private currentChunkIndex: number = 0;
  private straightCountSinceTurn: number = 0;

  constructor(scene: THREE.Scene, obstacleMgr: ObstacleManager, coinMgr: CoinManager) {
    this.scene = scene;
    this.obstacleMgr = obstacleMgr;
    this.coinMgr = coinMgr;

    // Stone pathway material with procedural texture
    const stoneTex = stoneTexture.clone();
    stoneTex.repeat.set(2, 10);
    this.stonePathMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.8,
      metalness: 0.15,
    });

    // Wood bridge material
    const woodTex = woodTexture.clone();
    woodTex.repeat.set(1, 10);
    this.woodPathMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.85,
      metalness: 0.05,
    });

    // Ruined pillar & stone balustrade material
    this.ruinPillarMat = new THREE.MeshStandardMaterial({
      map: relicRuinTexture,
      roughness: 0.75,
      metalness: 0.15,
    });

    // Jungle foliage materials
    this.jungleTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x3d2714,
      roughness: 0.9,
      metalness: 0.0,
    });
    this.jungleLeafMat = new THREE.MeshStandardMaterial({
      color: 0x1e5622,
      roughness: 0.7,
      metalness: 0.05,
      flatShading: true,
    });
    this.jungleRockMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.95,
      metalness: 0.05,
    });
    this.ropeMat = new THREE.MeshStandardMaterial({
      color: 0x785324,
      roughness: 0.9,
    });
    this.chasmMat = new THREE.MeshBasicMaterial({
      color: 0x05130b,
    });
    this.turnArrowMat = new THREE.MeshBasicMaterial({
      map: turnArrowTexture,
      transparent: true,
      opacity: 0.95,
    });
  }

  // Initialize track sequence
  public initTrack(initialChunks: number = 6) {
    this.clearAll();
    this.straightCountSinceTurn = 0;

    let currentStart = new THREE.Vector3(0, 0, 0);
    let currentAngle = 0;

    for (let i = 0; i < initialChunks; i++) {
      let type: ChunkType = 'stone';
      if (i < 2) {
        type = 'stone';
      } else if (i === 2) {
        type = 'ruins';
      } else if (i === 3) {
        // First turn appears on chunk 3!
        type = Math.random() > 0.5 ? 'turn_left' : 'turn_right';
      } else {
        type = this.pickNextChunkType();
      }

      const chunk = this.createChunk(type, currentStart, currentAngle, i < 1);
      this.chunks.push(chunk);
      this.scene.add(chunk.group);

      currentStart = chunk.endPos.clone();
      currentAngle = chunk.exitAngle;
    }
  }

  private pickNextChunkType(): ChunkType {
    // Force a turn after 2-3 straight chunks
    if (this.straightCountSinceTurn >= 2) {
      this.straightCountSinceTurn = 0;
      return Math.random() > 0.5 ? 'turn_left' : 'turn_right';
    }

    this.straightCountSinceTurn++;
    const r = Math.random();
    if (r < 0.2) return 'gap';
    if (r < 0.5) return 'stone';
    if (r < 0.75) return 'ruins';
    return 'wood';
  }

  // Maintain active chunks ahead of current runner position
  public updateAhead(activeChunkIdx: number, difficulty: number) {
    // Keep at least 4 chunks generated ahead of active chunk
    const chunksAhead = this.chunks.length - 1 - activeChunkIdx;
    if (chunksAhead < 4) {
      const lastChunk = this.chunks[this.chunks.length - 1];
      const type = this.pickNextChunkType();
      const newChunk = this.createChunk(type, lastChunk.endPos, lastChunk.exitAngle, false, difficulty);
      this.chunks.push(newChunk);
      this.scene.add(newChunk.group);
    }

    // Recycle chunks that are more than 2 behind the active chunk
    while (activeChunkIdx > 2 && this.chunks.length > 5) {
      const oldChunk = this.chunks.shift()!;
      this.scene.remove(oldChunk.group);
      oldChunk.pointLights.forEach((light) => {
        this.scene.remove(light);
        light.dispose();
      });
      oldChunk.group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          (obj as THREE.Mesh).geometry.dispose();
        }
      });
      // Adjust active index for caller
      return true; // indicates a chunk was removed from front
    }

    return false;
  }

  // Build a single track chunk
  private createChunk(
    type: ChunkType,
    startPos: THREE.Vector3,
    headingAngle: number,
    isSafe: boolean = false,
    difficulty: number = 1
  ): TrackChunk {
    const group = new THREE.Group();
    group.name = `chunk_${this.currentChunkIndex}`;
    group.position.copy(startPos);
    group.rotation.y = headingAngle;

    const dir = new THREE.Vector3(Math.sin(headingAngle), 0, Math.cos(headingAngle));
    const right = new THREE.Vector3(-dir.z, 0, dir.x);

    const obstacles: ObstacleInstance[] = [];
    const coins: CoinItem[] = [];
    const powerups: PowerupItem[] = [];
    const pointLights: THREE.PointLight[] = [];

    const isCorner = type === 'turn_left' || type === 'turn_right';
    let exitAngle = headingAngle;
    let endPos = new THREE.Vector3();
    let length = CHUNK_LENGTH;

    let turnDirection: 'left' | 'right' | undefined;
    let turnDist: number | undefined;
    let turnZoneStart: number | undefined;
    let turnZoneEnd: number | undefined;

    let hasGap = false;
    let gapZStart: number | undefined;
    let gapZEnd: number | undefined;
    let gapLanes: number[] | undefined;

    if (isCorner) {
      // =========================================================================
      // 90-DEGREE CORNER TURN CHUNK
      // =========================================================================
      turnDirection = type === 'turn_left' ? 'left' : 'right';
      turnDist = 26; // meters to the intersection
      length = turnDist;
      turnZoneStart = 15; // turn warning & input window opens
      turnZoneEnd = 28.5; // must turn before this or crash!

      // 1. Straight path up to intersection
      const straightLen = turnDist + TRACK_WIDTH / 2;
      const roadGeo = new THREE.BoxGeometry(TRACK_WIDTH, 1.2, straightLen);
      const road = new THREE.Mesh(roadGeo, this.stonePathMat);
      road.position.set(0, -0.6, straightLen / 2);
      road.receiveShadow = true;
      group.add(road);

      // 2. Dead-end Wall straight ahead (impassable temple wall with runes)
      const wallGeo = new THREE.BoxGeometry(TRACK_WIDTH + 2, 7, 2.5);
      const wall = new THREE.Mesh(wallGeo, this.ruinPillarMat);
      wall.position.set(0, 3.5, straightLen + 1.25);
      wall.castShadow = true;
      wall.receiveShadow = true;
      group.add(wall);

      // Giant relief idol face on the dead-end wall
      const idolGeo = new THREE.BoxGeometry(3.5, 3.5, 0.6);
      const idolFace = new THREE.Mesh(idolGeo, this.ruinPillarMat);
      idolFace.position.set(0, 3.5, straightLen - 0.1);
      group.add(idolFace);

      // Glowing red warning eyes on dead-end wall idol
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.2), eyeMat);
      leftEye.position.set(-0.8, 3.8, straightLen - 0.4);
      const rightEye = leftEye.clone();
      rightEye.position.set(0.8, 3.8, straightLen - 0.4);
      group.add(leftEye);
      group.add(rightEye);

      // 3. Side Branch (The new corridor opening 90 degrees left or right)
      const branchLen = 14;
      const branchGeo = new THREE.BoxGeometry(branchLen, 1.2, TRACK_WIDTH);
      const branch = new THREE.Mesh(branchGeo, this.stonePathMat);

      // In local coordinates: +X is Left, -X is Right
      const branchSign = turnDirection === 'left' ? 1 : -1;
      branch.position.set(branchSign * (TRACK_WIDTH / 2 + branchLen / 2 - 1.5), -0.6, turnDist);
      branch.receiveShadow = true;
      group.add(branch);

      // 4. Glowing Floor Turn Chevron / Arrow
      const arrowGeo = new THREE.PlaneGeometry(3.5, 3.5);
      arrowGeo.rotateX(-Math.PI / 2);
      // Rotate arrow to point left (+X, rotation Y = Math.PI/2) or right (-X, rotation Y = -Math.PI/2)
      arrowGeo.rotateY(branchSign * (Math.PI / 2));
      const arrowMesh = new THREE.Mesh(arrowGeo, this.turnArrowMat);
      arrowMesh.position.set(0, 0.04, turnDist - 1);
      group.add(arrowMesh);

      // Second arrow earlier in the turn zone
      const arrow2 = arrowMesh.clone();
      arrow2.position.set(0, 0.04, turnDist - 7);
      group.add(arrow2);

      // 5. Flaming Torches at the Corner
      const cornerTorch = this.createPillarWithTorch(turnDist);
      cornerTorch.position.set(-branchSign * (TRACK_WIDTH / 2 + 1.2), 0, turnDist);
      group.add(cornerTorch);

      const cornerTorch2 = this.createPillarWithTorch(turnDist);
      cornerTorch2.position.set(branchSign * (TRACK_WIDTH / 2 + branchLen), 0, turnDist + TRACK_WIDTH / 2 + 1.2);
      group.add(cornerTorch2);

      // Point lights
      const tLight = new THREE.PointLight(0xff9900, 3.0, 16);
      tLight.position.set(0, 3.5, turnDist);
      group.add(tLight);
      pointLights.push(tLight);

      // Coins leading into the turn!
      for (let i = 0; i < 4; i++) {
        const coin = this.coinMgr.createCoin(0, 0.9, turnDist - 10 + i * 2.5);
        group.add(coin.mesh);
        coins.push(coin);
      }

      // Calculate exit transform for next chunk:
      // Turn left adds +π/2, turn right subtracts -π/2
      exitAngle = headingAngle + (turnDirection === 'left' ? Math.PI / 2 : -Math.PI / 2);
      const newDir = new THREE.Vector3(Math.sin(exitAngle), 0, Math.cos(exitAngle));

      // Local exit point at the end of the branch
      const localExit = new THREE.Vector3(branchSign * (TRACK_WIDTH / 2 + branchLen - 2), 0, turnDist);
      localExit.applyAxisAngle(new THREE.Vector3(0, 1, 0), headingAngle);
      endPos = startPos.clone().add(localExit);
    } else {
      // =========================================================================
      // STRAIGHT CHUNK (Stone, Wood Bridge, Ruins, Gap)
      // =========================================================================
      length = CHUNK_LENGTH;
      exitAngle = headingAngle;
      endPos = startPos.clone().addScaledVector(dir, length);

      if (type === 'gap') {
        hasGap = true;
        gapZStart = 16;
        gapZEnd = 26;
        const gapPattern = Math.random();
        gapLanes = gapPattern < 0.5 ? [0] : gapPattern < 0.75 ? [-1, 0] : [0, 1];

        // Road segment before gap
        const seg1Len = gapZStart;
        const road1Geo = new THREE.BoxGeometry(TRACK_WIDTH, 1.2, seg1Len);
        const road1 = new THREE.Mesh(road1Geo, this.stonePathMat);
        road1.position.set(0, -0.6, seg1Len / 2);
        road1.receiveShadow = true;
        group.add(road1);

        // Road segment after gap
        const seg2Len = length - gapZEnd;
        const road2Geo = new THREE.BoxGeometry(TRACK_WIDTH, 1.2, seg2Len);
        const road2 = new THREE.Mesh(road2Geo, this.stonePathMat);
        road2.position.set(0, -0.6, gapZEnd + seg2Len / 2);
        road2.receiveShadow = true;
        group.add(road2);

        // Bottomless dark abyss
        const pitGeo = new THREE.PlaneGeometry(TRACK_WIDTH * 1.5, gapZEnd - gapZStart);
        pitGeo.rotateX(-Math.PI / 2);
        const pit = new THREE.Mesh(pitGeo, this.chasmMat);
        pit.position.set(0, -12, (gapZStart + gapZEnd) / 2);
        group.add(pit);

        // Coin arc across the gap
        const arcCoins = this.coinMgr.createCoinJumpArc(gapLanes[0], gapZStart - 2, 5, 2.3);
        arcCoins.forEach((c) => {
          group.add(c.mesh);
          coins.push(c);
        });
      } else if (type === 'wood') {
        // Wooden Rope Bridge
        const bridgeGeo = new THREE.BoxGeometry(TRACK_WIDTH * 0.9, 0.4, length);
        const bridge = new THREE.Mesh(bridgeGeo, this.woodPathMat);
        bridge.position.set(0, -0.2, length / 2);
        bridge.receiveShadow = true;
        group.add(bridge);

        // Suspension ropes
        const ropeGeo = new THREE.CylinderGeometry(0.08, 0.08, length, 6);
        ropeGeo.rotateX(Math.PI / 2);
        const leftRope = new THREE.Mesh(ropeGeo, this.ropeMat);
        leftRope.position.set(-TRACK_WIDTH * 0.44, 1.1, length / 2);
        const rightRope = leftRope.clone();
        rightRope.position.set(TRACK_WIDTH * 0.44, 1.1, length / 2);
        group.add(leftRope);
        group.add(rightRope);

        // Posts
        for (let pz = 3; pz < length; pz += 6) {
          const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 1.6, 6);
          const lPost = new THREE.Mesh(postGeo, this.woodPathMat);
          lPost.position.set(-TRACK_WIDTH * 0.44, 0.6, pz);
          const rPost = lPost.clone();
          rPost.position.set(TRACK_WIDTH * 0.44, 0.6, pz);
          group.add(lPost);
          group.add(rPost);
        }
      } else {
        // Ancient Stone Temple Causeway
        const roadGeo = new THREE.BoxGeometry(TRACK_WIDTH, 1.2, length);
        const road = new THREE.Mesh(roadGeo, this.stonePathMat);
        road.position.set(0, -0.6, length / 2);
        road.receiveShadow = true;
        group.add(road);

        // Carved stone curbs
        const curbGeo = new THREE.BoxGeometry(0.5, 0.5, length);
        const leftCurb = new THREE.Mesh(curbGeo, this.ruinPillarMat);
        leftCurb.position.set(-TRACK_WIDTH / 2 + 0.25, 0.25, length / 2);
        leftCurb.receiveShadow = true;
        const rightCurb = leftCurb.clone();
        rightCurb.position.set(TRACK_WIDTH / 2 - 0.25, 0.25, length / 2);
        group.add(leftCurb);
        group.add(rightCurb);
      }

      // Pillars with flaming torches
      for (let pz = 8; pz < length; pz += 16) {
        const lPillar = this.createPillarWithTorch(pz);
        lPillar.position.set(-TRACK_WIDTH / 2 - 1.2, 0, pz);
        group.add(lPillar);

        const rPillar = this.createPillarWithTorch(pz);
        rPillar.position.set(TRACK_WIDTH / 2 + 1.2, 0, pz);
        group.add(rPillar);

        const torchLight = new THREE.PointLight(0xff9900, 2.2, 12, 1.8);
        torchLight.position.set(0, 3.2, pz);
        group.add(torchLight);
        pointLights.push(torchLight);
      }

      // Dense Jungle Trees & Boulders flanking track
      for (let tz = 4; tz < length; tz += 8) {
        const lTree = this.createJungleTree();
        lTree.position.set(-TRACK_WIDTH / 2 - 4.5 - Math.random() * 3, 0, tz + (Math.random() - 0.5) * 3);
        group.add(lTree);

        const lRock = this.createJungleRock();
        lRock.position.set(-TRACK_WIDTH / 2 - 2.5, 0, tz + 4);
        group.add(lRock);

        const rTree = this.createJungleTree();
        rTree.position.set(TRACK_WIDTH / 2 + 4.5 + Math.random() * 3, 0, tz + (Math.random() - 0.5) * 3);
        group.add(rTree);

        const rRock = this.createJungleRock();
        rRock.position.set(TRACK_WIDTH / 2 + 2.5, 0, tz + 4);
        group.add(rRock);
      }

      // Obstacles in straight chunks
      if (!isSafe && type !== 'gap') {
        const numObstacles = Math.random() > 0.4 ? 2 : 1;
        const positionsZ = numObstacles === 1 ? [22] : [14, 30];

        positionsZ.forEach((obsZ) => {
          const rand = Math.random();
          if (rand < 0.3) {
            // Fallen Log (jumpable)
            const lane = Math.floor(Math.random() * 3) - 1;
            const log = this.obstacleMgr.createFallenLog(lane, obsZ);
            group.add(log.group);
            obstacles.push(log);

            const jumpCoins = this.coinMgr.createCoinJumpArc(lane, obsZ - 2.5, 4, 1.8);
            jumpCoins.forEach((c) => {
              group.add(c.mesh);
              coins.push(c);
            });
          } else if (rand < 0.55) {
            // Low Stone Barrier (jumpable)
            const lane = Math.floor(Math.random() * 3) - 1;
            const barrier = this.obstacleMgr.createLowBarrier(lane, obsZ);
            group.add(barrier.group);
            obstacles.push(barrier);

            const jumpCoins = this.coinMgr.createCoinJumpArc(lane, obsZ - 2.5, 4, 1.8);
            jumpCoins.forEach((c) => {
              group.add(c.mesh);
              coins.push(c);
            });
          } else if (rand < 0.75) {
            // High Hanging Arch (slide under)
            const lane = Math.floor(Math.random() * 3) - 1;
            const arch = this.obstacleMgr.createHangingArch(lane, obsZ);
            group.add(arch.group);
            obstacles.push(arch);

            const lowCoins = this.coinMgr.createCoinRow(lane, obsZ - 3, 3, 2.5);
            lowCoins.forEach((c) => {
              c.mesh.position.y = 0.4;
              group.add(c.mesh);
              coins.push(c);
            });
          } else if (rand < 0.82) {
            // Blocker: Stone Idol Head
            const lane = Math.floor(Math.random() * 3) - 1;
            const idol = this.obstacleMgr.createIdolBlocker(lane, obsZ);
            group.add(idol.group);
            obstacles.push(idol);

            const openLane = lane === 0 ? 1 : 0;
            const safeCoins = this.coinMgr.createCoinRow(openLane, obsZ - 4, 4, 2.5);
            safeCoins.forEach((c) => {
              group.add(c.mesh);
              coins.push(c);
            });
          } else if (rand < 0.92) {
            // Blocker: Flaming Temple Brazier
            const lane = Math.floor(Math.random() * 3) - 1;
            const brazier = this.obstacleMgr.createFlamingBrazier(lane, obsZ);
            group.add(brazier.group);
            obstacles.push(brazier);

            const openLane = lane === 0 ? -1 : 0;
            const safeCoins = this.coinMgr.createCoinRow(openLane, obsZ - 4, 4, 2.5);
            safeCoins.forEach((c) => {
              group.add(c.mesh);
              coins.push(c);
            });
          } else {
            // Double Lane Blocker
            const safeLane = Math.floor(Math.random() * 3) - 1;
            const blockedLanes: [number, number] =
              safeLane === -1 ? [0, 1] : safeLane === 1 ? [-1, 0] : [-1, 1];
            const pillar = this.obstacleMgr.createDoubleLanePillar(blockedLanes, obsZ);
            group.add(pillar.group);
            obstacles.push(pillar);

            const safeCoins = this.coinMgr.createCoinRow(safeLane, obsZ - 4, 4, 2.5);
            safeCoins.forEach((c) => {
              group.add(c.mesh);
              coins.push(c);
            });
          }
        });
      }

      // Coins & Powerups in straight chunks
      if (type !== 'gap') {
        const freeLane = Math.floor(Math.random() * 3) - 1;
        const coinRun = this.coinMgr.createCoinRow(freeLane, 6, 4, 2.8);
        coinRun.forEach((c) => {
          group.add(c.mesh);
          coins.push(c);
        });

        if (this.currentChunkIndex > 2 && Math.random() < 0.28) {
          const pTypes: PowerupType[] = ['magnet', 'shield', 'rush'];
          const chosen = pTypes[Math.floor(Math.random() * pTypes.length)];
          const pLane = Math.floor(Math.random() * 3) - 1;
          const powerup = this.coinMgr.createPowerup(pLane, 20, chosen);
          group.add(powerup.group);
          powerups.push(powerup);
        }
      }
    }

    this.currentChunkIndex++;

    return {
      group,
      index: this.currentChunkIndex,
      type,
      startPos,
      endPos,
      headingAngle,
      exitAngle,
      dir,
      right,
      length,
      obstacles,
      coins,
      powerups,
      pointLights,
      isCorner,
      turnDirection,
      turnDist,
      turnZoneStart,
      turnZoneEnd,
      hasTurned: false,
      hasGap,
      gapZStart,
      gapZEnd,
      gapLanes,
    };
  }

  // --- Procedural Scenery Builder Helpers ---

  private createPillarWithTorch(z: number): THREE.Group {
    const group = new THREE.Group();

    const colGeo = new THREE.CylinderGeometry(0.5, 0.6, 5.5, 8);
    const colMesh = new THREE.Mesh(colGeo, this.ruinPillarMat);
    colMesh.position.y = 2.75;
    colMesh.castShadow = true;
    group.add(colMesh);

    const capGeo = new THREE.BoxGeometry(1.4, 0.5, 1.4);
    const capMesh = new THREE.Mesh(capGeo, this.ruinPillarMat);
    capMesh.position.y = 5.6;
    capMesh.castShadow = true;
    group.add(capMesh);

    const bracketGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.7, 6);
    const bracket = new THREE.Mesh(bracketGeo, this.jungleTrunkMat);
    bracket.position.set(0, 3.2, 0.55);
    bracket.rotation.x = 0.35;
    group.add(bracket);

    const flameGeo = new THREE.ConeGeometry(0.25, 0.6, 6);
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xff4500,
      emissiveIntensity: 1.8,
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(0, 3.7, 0.65);
    group.add(flame);

    return group;
  }

  private createJungleTree(): THREE.Group {
    const group = new THREE.Group();

    const height = 8 + Math.random() * 4;
    const trunkGeo = new THREE.CylinderGeometry(0.6, 1.1, height, 7);
    const trunk = new THREE.Mesh(trunkGeo, this.jungleTrunkMat);
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    group.add(trunk);

    const tiers = 3;
    for (let t = 0; t < tiers; t++) {
      const radius = 3.6 - t * 0.8 + Math.random() * 0.5;
      const canopyGeo = new THREE.ConeGeometry(radius, 3.2, 7);
      const canopy = new THREE.Mesh(canopyGeo, this.jungleLeafMat);
      canopy.position.y = height * 0.65 + t * 2.1;
      canopy.castShadow = true;
      group.add(canopy);
    }

    return group;
  }

  private createJungleRock(): THREE.Mesh {
    const rockGeo = new THREE.DodecahedronGeometry(1.2 + Math.random() * 0.8, 1);
    const rock = new THREE.Mesh(rockGeo, this.jungleRockMat);
    rock.position.y = 0.8;
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    rock.castShadow = true;
    rock.receiveShadow = true;
    return rock;
  }

  public clearAll() {
    this.chunks.forEach((chunk) => {
      this.scene.remove(chunk.group);
      chunk.pointLights.forEach((l) => {
        this.scene.remove(l);
        l.dispose();
      });
      chunk.group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          (obj as THREE.Mesh).geometry.dispose();
        }
      });
    });
    this.chunks = [];
    this.currentChunkIndex = 0;
    this.straightCountSinceTurn = 0;
  }
}
