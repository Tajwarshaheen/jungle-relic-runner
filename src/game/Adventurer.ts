import * as THREE from 'three';

export interface PlayerState {
  lane: number; // -1: Left, 0: Center, 1: Right
  targetX: number;
  currentX: number;
  y: number;
  vy: number;
  isGrounded: boolean;
  isJumping: boolean;
  isSliding: boolean;
  slideTimer: number;
  runCycle: number;
  isDead: boolean;
  hasShield: boolean;
  hasMagnet: boolean;
  hasRush: boolean;
}

export const LANE_WIDTH = 2.6;
export const getLaneX = (lane: number): number => -lane * LANE_WIDTH;
export const GRAVITY = 38;
export const JUMP_VELOCITY = 14.5;
export const SLIDE_DURATION = 0.75; // seconds

export class Adventurer {
  public group: THREE.Group;
  public state: PlayerState;
  private stumbleTimer = 0;

  // Hierarchical body parts
  private rootBody: THREE.Group;
  private torsoMesh: THREE.Mesh;
  private headGroup: THREE.Group;
  private backpackMesh: THREE.Mesh;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftForearmGroup: THREE.Group;
  private rightForearmGroup: THREE.Group;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;
  private leftShinGroup: THREE.Group;
  private rightShinGroup: THREE.Group;

  // Aura effects for Shield & Rush
  private shieldMesh: THREE.Mesh;
  private rushTrailMesh: THREE.Mesh;

  // Collision box (for obstacle checks)
  public collisionBox: THREE.Box3 = new THREE.Box3();
  public localBox: THREE.Box3 = new THREE.Box3();
  public isInvulnerable: boolean = false;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'adventurer';

    this.state = {
      lane: 0,
      targetX: 0,
      currentX: 0,
      y: 0,
      vy: 0,
      isGrounded: true,
      isJumping: false,
      isSliding: false,
      slideTimer: 0,
      runCycle: 0,
      isDead: false,
      hasShield: false,
      hasMagnet: false,
      hasRush: false,
    };

    // --- Materials with varied PBR roughness & color ---
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xdeb887,
      roughness: 0.6,
      metalness: 0.05,
    });
    const vestMat = new THREE.MeshStandardMaterial({
      color: 0x854d0e, // leather brown
      roughness: 0.7,
      metalness: 0.1,
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0xd4c5a3, // khaki explorer shirt
      roughness: 0.8,
      metalness: 0.0,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x3f3f46, // dark cargo trousers
      roughness: 0.85,
      metalness: 0.0,
    });
    const bootMat = new THREE.MeshStandardMaterial({
      color: 0x271910, // dark leather boots
      roughness: 0.6,
      metalness: 0.2,
    });
    const hatMat = new THREE.MeshStandardMaterial({
      color: 0x92400e, // fedora brown
      roughness: 0.75,
      metalness: 0.05,
    });
    const hatBandMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.5,
      metalness: 0.3,
    });
    const backpackMat = new THREE.MeshStandardMaterial({
      color: 0x365314, // olive drab pack
      roughness: 0.9,
      metalness: 0.05,
    });
    const goldBuckleMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.3,
      metalness: 0.85,
    });

    // Root pivot for the entire body
    this.rootBody = new THREE.Group();
    this.rootBody.position.y = 1.0;
    this.group.add(this.rootBody);

    // 1. Torso (Explorer Vest & Khaki Shirt)
    const torsoGeo = new THREE.BoxGeometry(0.68, 0.75, 0.44);
    this.torsoMesh = new THREE.Mesh(torsoGeo, vestMat);
    this.torsoMesh.castShadow = true;
    this.rootBody.add(this.torsoMesh);

    // Shirt collar insert
    const collarGeo = new THREE.BoxGeometry(0.4, 0.25, 0.46);
    const collar = new THREE.Mesh(collarGeo, shirtMat);
    collar.position.y = 0.3;
    this.torsoMesh.add(collar);

    // Belt and gold buckle
    const beltGeo = new THREE.BoxGeometry(0.7, 0.12, 0.46);
    const belt = new THREE.Mesh(beltGeo, bootMat);
    belt.position.y = -0.32;
    const buckleGeo = new THREE.BoxGeometry(0.18, 0.14, 0.48);
    const buckle = new THREE.Mesh(buckleGeo, goldBuckleMat);
    buckle.position.y = -0.32;
    this.torsoMesh.add(belt);
    this.torsoMesh.add(buckle);

    // 2. Backpack with rolled bedroll / relic map
    const packGeo = new THREE.BoxGeometry(0.5, 0.55, 0.3);
    this.backpackMesh = new THREE.Mesh(packGeo, backpackMat);
    this.backpackMesh.position.set(0, 0.05, -0.32);
    this.backpackMesh.castShadow = true;
    this.torsoMesh.add(this.backpackMesh);

    // Relic cylinder roll atop pack
    const rollGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.58, 8);
    rollGeo.rotateZ(Math.PI / 2);
    const roll = new THREE.Mesh(rollGeo, vestMat);
    roll.position.set(0, 0.32, -0.32);
    this.torsoMesh.add(roll);

    // 3. Head & Fedora Hat
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.56, 0);
    this.torsoMesh.add(this.headGroup);

    const headGeo = new THREE.BoxGeometry(0.38, 0.4, 0.38);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Adventurer Fedora Hat
    const hatCrownGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.24, 10);
    const hatCrown = new THREE.Mesh(hatCrownGeo, hatMat);
    hatCrown.position.y = 0.26;
    hatCrown.castShadow = true;

    const hatBrimGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.04, 16);
    const hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
    hatBrim.position.y = 0.16;
    hatBrim.castShadow = true;

    const hatBandGeo = new THREE.CylinderGeometry(0.26, 0.29, 0.06, 12);
    const hatBand = new THREE.Mesh(hatBandGeo, hatBandMat);
    hatBand.position.y = 0.18;

    this.headGroup.add(hatCrown);
    this.headGroup.add(hatBrim);
    this.headGroup.add(hatBand);

    // 4. Arms (Hierarchical: Shoulder -> Elbow -> Hand)
    // Left Arm
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.44, 0.28, 0);
    this.torsoMesh.add(this.leftArmGroup);

    const armGeo = new THREE.BoxGeometry(0.2, 0.42, 0.22);
    armGeo.translate(0, -0.18, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, shirtMat);
    leftArmMesh.castShadow = true;
    this.leftArmGroup.add(leftArmMesh);

    this.leftForearmGroup = new THREE.Group();
    this.leftForearmGroup.position.set(0, -0.38, 0);
    this.leftArmGroup.add(this.leftForearmGroup);

    const forearmGeo = new THREE.BoxGeometry(0.18, 0.4, 0.18);
    forearmGeo.translate(0, -0.16, 0);
    const leftForearmMesh = new THREE.Mesh(forearmGeo, skinMat);
    leftForearmMesh.castShadow = true;
    this.leftForearmGroup.add(leftForearmMesh);

    // Right Arm
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.44, 0.28, 0);
    this.torsoMesh.add(this.rightArmGroup);

    const rightArmMesh = new THREE.Mesh(armGeo, shirtMat);
    rightArmMesh.castShadow = true;
    this.rightArmGroup.add(rightArmMesh);

    this.rightForearmGroup = new THREE.Group();
    this.rightForearmGroup.position.set(0, -0.38, 0);
    this.rightArmGroup.add(this.rightForearmGroup);

    const rightForearmMesh = new THREE.Mesh(forearmGeo, skinMat);
    rightForearmMesh.castShadow = true;
    this.rightForearmGroup.add(rightForearmMesh);

    // 5. Legs (Hierarchical: Hip -> Knee -> Boot)
    // Left Leg
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.2, -0.38, 0);
    this.rootBody.add(this.leftLegGroup);

    const thighGeo = new THREE.BoxGeometry(0.24, 0.46, 0.26);
    thighGeo.translate(0, -0.2, 0);
    const leftThighMesh = new THREE.Mesh(thighGeo, pantsMat);
    leftThighMesh.castShadow = true;
    this.leftLegGroup.add(leftThighMesh);

    this.leftShinGroup = new THREE.Group();
    this.leftShinGroup.position.set(0, -0.42, 0);
    this.leftLegGroup.add(this.leftShinGroup);

    const shinGeo = new THREE.BoxGeometry(0.22, 0.44, 0.24);
    shinGeo.translate(0, -0.18, 0);
    const leftShinMesh = new THREE.Mesh(shinGeo, pantsMat);
    leftShinMesh.castShadow = true;
    this.leftShinGroup.add(leftShinMesh);

    // Boot
    const bootGeo = new THREE.BoxGeometry(0.24, 0.2, 0.38);
    bootGeo.translate(0, -0.36, 0.06);
    const leftBootMesh = new THREE.Mesh(bootGeo, bootMat);
    leftBootMesh.castShadow = true;
    this.leftShinGroup.add(leftBootMesh);

    // Right Leg
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.2, -0.38, 0);
    this.rootBody.add(this.rightLegGroup);

    const rightThighMesh = new THREE.Mesh(thighGeo, pantsMat);
    rightThighMesh.castShadow = true;
    this.rightLegGroup.add(rightThighMesh);

    this.rightShinGroup = new THREE.Group();
    this.rightShinGroup.position.set(0, -0.42, 0);
    this.rightLegGroup.add(this.rightShinGroup);

    const rightShinMesh = new THREE.Mesh(shinGeo, pantsMat);
    rightShinMesh.castShadow = true;
    this.rightShinGroup.add(rightShinMesh);

    const rightBootMesh = new THREE.Mesh(bootGeo, bootMat);
    rightBootMesh.castShadow = true;
    this.rightShinGroup.add(rightBootMesh);

    // 6. Relic Shield Sphere (Visible when shield active)
    const shieldGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.38,
      wireframe: true,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.y = 0.2;
    this.shieldMesh.visible = false;
    this.rootBody.add(this.shieldMesh);

    // 7. Rush Aura / Golden Relic Invincibility
    const rushGeo = new THREE.ConeGeometry(0.9, 2.4, 8);
    rushGeo.rotateX(Math.PI / 2);
    const rushMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.4,
    });
    this.rushTrailMesh = new THREE.Mesh(rushGeo, rushMat);
    this.rushTrailMesh.position.set(0, 0, -1.0);
    this.rushTrailMesh.visible = false;
    this.rootBody.add(this.rushTrailMesh);

    this.updateCollisionBox();
  }

  // --- Input Handlers ---

  public moveLeft(): boolean {
    if (this.state.isDead) return false;
    if (this.state.lane > -1) {
      this.state.lane -= 1;
      this.state.targetX = getLaneX(this.state.lane);
      return true;
    }
    return false;
  }

  public moveRight(): boolean {
    if (this.state.isDead) return false;
    if (this.state.lane < 1) {
      this.state.lane += 1;
      this.state.targetX = getLaneX(this.state.lane);
      return true;
    }
    return false;
  }

  public jump(): boolean {
    if (this.state.isDead) return false;
    if (this.state.isGrounded && !this.state.isJumping) {
      this.state.isJumping = true;
      this.state.isGrounded = false;
      this.state.vy = JUMP_VELOCITY;
      if (this.state.isSliding) {
        this.state.isSliding = false;
      }
      return true;
    }
    return false;
  }

  public slide(): boolean {
    if (this.state.isDead) return false;
    // Down swipe while jumping plunges faster to ground
    if (this.state.isJumping) {
      this.state.vy = -18;
    }
    this.state.isSliding = true;
    this.state.slideTimer = SLIDE_DURATION;
    return true;
  }

  public triggerStumble() {
    this.stumbleTimer = 0.55;
  }

  public reset() {
    this.stumbleTimer = 0;
    this.state.lane = 0;
    this.state.targetX = 0;
    this.state.currentX = 0;
    this.state.y = 0;
    this.state.vy = 0;
    this.state.isGrounded = true;
    this.state.isJumping = false;
    this.state.isSliding = false;
    this.state.slideTimer = 0;
    this.state.runCycle = 0;
    this.state.isDead = false;
    this.state.hasShield = false;
    this.state.hasMagnet = false;
    this.state.hasRush = false;

    this.group.position.set(0, 0, 0);
    this.group.rotation.set(0, 0, 0);
    this.rootBody.rotation.set(0, 0, 0);
    this.rootBody.position.y = 1.0;
    this.isInvulnerable = false;
    this.rootBody.visible = true;
    this.shieldMesh.visible = false;
    this.rushTrailMesh.visible = false;
    this.updateCollisionBox();
  }

  // --- Animation Update Tick ---

  public update(delta: number, speed: number, onFootstep?: (surface: 'stone' | 'wood') => void) {
    if (this.state.isDead) {
      // Defeat stumble backwards
      this.rootBody.visible = true;
      this.rootBody.rotation.x = THREE.MathUtils.damp(this.rootBody.rotation.x, -Math.PI / 2.5, 6, delta);
      this.rootBody.position.y = THREE.MathUtils.damp(this.rootBody.position.y, 0.4, 6, delta);
      return;
    }

    // Invulnerability visual flicker
    if (this.isInvulnerable) {
      this.rootBody.visible = Math.floor(performance.now() / 90) % 2 === 0;
    } else {
      this.rootBody.visible = true;
    }

    if (this.stumbleTimer > 0) {
      this.stumbleTimer -= delta;
      this.rootBody.rotation.x = THREE.MathUtils.damp(this.rootBody.rotation.x, -0.28, 14, delta);
      this.rootBody.position.y = 0.85;
      this.leftArmGroup.rotation.x = THREE.MathUtils.damp(this.leftArmGroup.rotation.x, -1.2, 14, delta);
      this.rightArmGroup.rotation.x = THREE.MathUtils.damp(this.rightArmGroup.rotation.x, -1.2, 14, delta);
    }

    // 1. Smooth Lane Transition (Damped X position)
    this.state.currentX = THREE.MathUtils.damp(this.state.currentX, this.state.targetX, 15, delta);
    this.group.position.x = this.state.currentX;

    // Banking tilt when switching lanes
    const dx = this.state.targetX - this.state.currentX;
    this.rootBody.rotation.z = THREE.MathUtils.damp(this.rootBody.rotation.z, dx * 0.16, 12, delta);

    // 2. Vertical Jump / Gravity Physics
    if (!this.state.isGrounded) {
      this.state.y += this.state.vy * delta;
      this.state.vy -= GRAVITY * delta;

      if (this.state.y <= 0) {
        this.state.y = 0;
        this.state.vy = 0;
        this.state.isGrounded = true;
        this.state.isJumping = false;
      }
    }
    this.group.position.y = this.state.y;

    // 3. Sliding Timer
    if (this.state.isSliding) {
      this.state.slideTimer -= delta;
      if (this.state.slideTimer <= 0) {
        this.state.isSliding = false;
      }
    }

    // 4. Power-up Visuals
    this.shieldMesh.visible = this.state.hasShield;
    if (this.state.hasShield) {
      this.shieldMesh.rotation.y += delta * 2;
    }
    this.rushTrailMesh.visible = this.state.hasRush;

    // 5. Procedural Hierarchical Kinematics & Poses
    if (this.state.isSliding) {
      // Sliding Pose: Body lowers, tilts back, legs slide out forward
      this.rootBody.position.y = THREE.MathUtils.damp(this.rootBody.position.y, 0.45, 16, delta);
      this.rootBody.rotation.x = THREE.MathUtils.damp(this.rootBody.rotation.x, -0.65, 16, delta);

      this.leftLegGroup.rotation.x = THREE.MathUtils.damp(this.leftLegGroup.rotation.x, -1.3, 16, delta);
      this.leftShinGroup.rotation.x = THREE.MathUtils.damp(this.leftShinGroup.rotation.x, 0.2, 16, delta);
      this.rightLegGroup.rotation.x = THREE.MathUtils.damp(this.rightLegGroup.rotation.x, 0.8, 16, delta);
      this.rightShinGroup.rotation.x = THREE.MathUtils.damp(this.rightShinGroup.rotation.x, 1.4, 16, delta);

      this.leftArmGroup.rotation.x = THREE.MathUtils.damp(this.leftArmGroup.rotation.x, 0.4, 16, delta);
      this.rightArmGroup.rotation.x = THREE.MathUtils.damp(this.rightArmGroup.rotation.x, 0.4, 16, delta);
    } else if (this.state.isJumping) {
      // Jumping Pose: Legs tuck up, arms raise outward for flight
      this.rootBody.position.y = THREE.MathUtils.damp(this.rootBody.position.y, 1.0, 12, delta);
      this.rootBody.rotation.x = THREE.MathUtils.damp(this.rootBody.rotation.x, 0.15, 10, delta);

      this.leftLegGroup.rotation.x = THREE.MathUtils.damp(this.leftLegGroup.rotation.x, -0.85, 14, delta);
      this.leftShinGroup.rotation.x = THREE.MathUtils.damp(this.leftShinGroup.rotation.x, 1.1, 14, delta);
      this.rightLegGroup.rotation.x = THREE.MathUtils.damp(this.rightLegGroup.rotation.x, -0.6, 14, delta);
      this.rightShinGroup.rotation.x = THREE.MathUtils.damp(this.rightShinGroup.rotation.x, 1.0, 14, delta);

      this.leftArmGroup.rotation.x = THREE.MathUtils.damp(this.leftArmGroup.rotation.x, -1.2, 12, delta);
      this.rightArmGroup.rotation.x = THREE.MathUtils.damp(this.rightArmGroup.rotation.x, -1.2, 12, delta);
    } else {
      // Natural Running Gait: Alternating stride with knee flexion & counter arms
      const strideFreq = Math.min(speed * 0.42, 16);
      this.state.runCycle += delta * strideFreq;
      const cycle = this.state.runCycle;

      // Vertical bounce
      this.rootBody.position.y = 1.0 + Math.abs(Math.sin(cycle * 2)) * 0.12;
      this.rootBody.rotation.x = 0.18; // athletic forward sprint lean

      const legSwing = Math.sin(cycle) * 0.85;
      this.leftLegGroup.rotation.x = legSwing;
      this.rightLegGroup.rotation.x = -legSwing;

      // Knees bend during backswing
      this.leftShinGroup.rotation.x = Math.max(0, -legSwing * 1.1);
      this.rightShinGroup.rotation.x = Math.max(0, legSwing * 1.1);

      // Arm swing in opposition
      this.leftArmGroup.rotation.x = -legSwing * 0.95;
      this.rightArmGroup.rotation.x = legSwing * 0.95;

      this.leftForearmGroup.rotation.x = -0.5 - Math.abs(legSwing * 0.4);
      this.rightForearmGroup.rotation.x = -0.5 - Math.abs(legSwing * 0.4);

      // Footstep sound trigger when foot strikes lowest point
      if (Math.abs(Math.sin(cycle)) < 0.15 && onFootstep) {
        onFootstep('stone');
      }
    }

    this.updateCollisionBox();
  }

  // --- Collision Box Alignment ---

  public updateCollisionBox() {
    const x = this.group.position.x;
    const y = this.group.position.y;
    const z = this.group.position.z;

    if (this.state.isSliding) {
      // Low bounding box when sliding (height ~0.65m)
      this.collisionBox.min.set(x - 0.45, y, z - 0.7);
      this.collisionBox.max.set(x + 0.45, y + 0.65, z + 0.7);
    } else {
      // Standard standing / jumping bounding box (height ~1.95m)
      this.collisionBox.min.set(x - 0.45, y, z - 0.45);
      this.collisionBox.max.set(x + 0.45, y + 1.95, z + 0.45);
    }
  }

  public updateLocalCollisionBox(distanceInChunk: number) {
    const px = this.state.currentX;
    const py = this.state.y;
    const pz = distanceInChunk;

    if (this.state.isSliding) {
      // Low bounding box when sliding (height ~0.65m)
      this.localBox.min.set(px - 0.45, py, pz - 0.7);
      this.localBox.max.set(px + 0.45, py + 0.65, pz + 0.7);
    } else {
      // Standard standing / jumping bounding box (height ~1.95m)
      this.localBox.min.set(px - 0.45, py, pz - 0.45);
      this.localBox.max.set(px + 0.45, py + 1.95, pz + 0.45);
    }
  }
}
