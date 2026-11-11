import * as THREE from 'three';

export class ChaserBeast {
  public group: THREE.Group;

  // Hierarchical Body Parts
  private rootBody: THREE.Group;
  private torsoMesh: THREE.Mesh;
  private headGroup: THREE.Group;
  private jawMesh: THREE.Mesh;
  private leftEye: THREE.Mesh;
  private rightEye: THREE.Mesh;

  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftForearmGroup: THREE.Group;
  private rightForearmGroup: THREE.Group;

  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;

  // Animation cycle
  private gallopCycle: number = 0;
  public isAttacking: boolean = false;
  private attackTimer: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'chaser_beast';

    // Materials
    const beastSkinMat = new THREE.MeshStandardMaterial({
      color: 0x141210, // Charcoal demonic volcanic hide
      roughness: 0.9,
      metalness: 0.15,
    });
    const stoneSpikeMat = new THREE.MeshStandardMaterial({
      color: 0x221f1e,
      roughness: 0.6,
      metalness: 0.35,
    });
    const glowingEyeMat = new THREE.MeshBasicMaterial({
      color: 0xff1100, // Blazing blood-red demonic eyes
    });
    const teethMat = new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      roughness: 0.35,
    });
    const tongueMat = new THREE.MeshStandardMaterial({
      color: 0x881337,
      roughness: 0.7,
    });

    this.rootBody = new THREE.Group();
    this.rootBody.position.y = 1.2;
    this.group.add(this.rootBody);

    // 1. Massive Hunched Torso
    const torsoGeo = new THREE.BoxGeometry(1.5, 1.25, 1.2);
    this.torsoMesh = new THREE.Mesh(torsoGeo, beastSkinMat);
    this.torsoMesh.castShadow = true;
    this.rootBody.add(this.torsoMesh);

    // Back spikes / obsidian spine ridge
    for (let i = -0.45; i <= 0.45; i += 0.22) {
      const spikeGeo = new THREE.ConeGeometry(0.14, 0.55, 5);
      spikeGeo.rotateX(-0.55);
      const spike = new THREE.Mesh(spikeGeo, stoneSpikeMat);
      spike.position.set(0, 0.68, i);
      spike.castShadow = true;
      this.torsoMesh.add(spike);
    }

    // 2. Monstrous Horned Head
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.72, 0.7);
    this.torsoMesh.add(this.headGroup);

    const skullGeo = new THREE.BoxGeometry(0.9, 0.8, 0.9);
    const skull = new THREE.Mesh(skullGeo, beastSkinMat);
    skull.castShadow = true;
    this.headGroup.add(skull);

    // Demonic Horns
    const hornGeo = new THREE.ConeGeometry(0.16, 0.85, 6);
    hornGeo.rotateX(-0.65);
    const leftHorn = new THREE.Mesh(hornGeo, stoneSpikeMat);
    leftHorn.position.set(-0.45, 0.55, -0.1);
    leftHorn.rotation.z = -0.45;
    leftHorn.castShadow = true;
    this.headGroup.add(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeo, stoneSpikeMat);
    rightHorn.position.set(0.45, 0.55, -0.1);
    rightHorn.rotation.z = 0.45;
    rightHorn.castShadow = true;
    this.headGroup.add(rightHorn);

    // Glowing Red Demonic Eyes
    const eyeGeo = new THREE.BoxGeometry(0.2, 0.14, 0.08);
    this.leftEye = new THREE.Mesh(eyeGeo, glowingEyeMat);
    this.leftEye.position.set(-0.26, 0.14, 0.46);
    this.rightEye = new THREE.Mesh(eyeGeo, glowingEyeMat);
    this.rightEye.position.set(0.26, 0.14, 0.46);
    this.headGroup.add(this.leftEye);
    this.headGroup.add(this.rightEye);

    // Sharp Snapping Jaw with Fangs & Tongue
    const jawGeo = new THREE.BoxGeometry(0.8, 0.38, 0.8);
    this.jawMesh = new THREE.Mesh(jawGeo, beastSkinMat);
    this.jawMesh.position.set(0, -0.4, 0.22);
    this.headGroup.add(this.jawMesh);

    // Sharp fangs lining upper and lower jaws
    for (let f = -0.28; f <= 0.28; f += 0.18) {
      const fang = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.24, 4), teethMat);
      fang.position.set(f, 0.2, 0.35);
      this.jawMesh.add(fang);
    }
    const tongueGeo = new THREE.BoxGeometry(0.3, 0.08, 0.45);
    const tongue = new THREE.Mesh(tongueGeo, tongueMat);
    tongue.position.set(0, 0.14, 0.15);
    this.jawMesh.add(tongue);

    // 3. Heavy Forearms for Knuckle-Galloping
    // Left Arm
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.95, 0.35, 0.38);
    this.torsoMesh.add(this.leftArmGroup);

    const armGeo = new THREE.BoxGeometry(0.42, 0.85, 0.45);
    armGeo.translate(0, -0.38, 0);
    const lArmMesh = new THREE.Mesh(armGeo, beastSkinMat);
    lArmMesh.castShadow = true;
    this.leftArmGroup.add(lArmMesh);

    this.leftForearmGroup = new THREE.Group();
    this.leftForearmGroup.position.set(0, -0.75, 0);
    this.leftArmGroup.add(this.leftForearmGroup);

    const forearmGeo = new THREE.BoxGeometry(0.45, 0.85, 0.48);
    forearmGeo.translate(0, -0.38, 0);
    const lForearmMesh = new THREE.Mesh(forearmGeo, beastSkinMat);
    lForearmMesh.castShadow = true;
    this.leftForearmGroup.add(lForearmMesh);

    // Claws / Knuckles
    const knuckleGeo = new THREE.BoxGeometry(0.52, 0.28, 0.6);
    knuckleGeo.translate(0, -0.8, 0.08);
    const lKnuckle = new THREE.Mesh(knuckleGeo, stoneSpikeMat);
    lKnuckle.castShadow = true;
    this.leftForearmGroup.add(lKnuckle);

    // Razor claw tips
    for (let c = -0.16; c <= 0.16; c += 0.16) {
      const clawTip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.26, 4), stoneSpikeMat);
      clawTip.rotateX(Math.PI / 2);
      clawTip.position.set(c, -0.85, 0.4);
      this.leftForearmGroup.add(clawTip);
    }

    // Right Arm
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.95, 0.35, 0.38);
    this.torsoMesh.add(this.rightArmGroup);

    const rArmMesh = new THREE.Mesh(armGeo, beastSkinMat);
    rArmMesh.castShadow = true;
    this.rightArmGroup.add(rArmMesh);

    this.rightForearmGroup = new THREE.Group();
    this.rightForearmGroup.position.set(0, -0.75, 0);
    this.rightArmGroup.add(this.rightForearmGroup);

    const rForearmMesh = new THREE.Mesh(forearmGeo, beastSkinMat);
    rForearmMesh.castShadow = true;
    this.rightForearmGroup.add(rForearmMesh);

    const rKnuckle = new THREE.Mesh(knuckleGeo, stoneSpikeMat);
    rKnuckle.castShadow = true;
    this.rightForearmGroup.add(rKnuckle);

    for (let c = -0.16; c <= 0.16; c += 0.16) {
      const clawTip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.26, 4), stoneSpikeMat);
      clawTip.rotateX(Math.PI / 2);
      clawTip.position.set(c, -0.85, 0.4);
      this.rightForearmGroup.add(clawTip);
    }

    // 4. Hind Legs
    const legGeo = new THREE.BoxGeometry(0.45, 0.9, 0.48);
    legGeo.translate(0, -0.42, 0);

    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.48, -0.48, -0.38);
    this.torsoMesh.add(this.leftLegGroup);
    const lLegMesh = new THREE.Mesh(legGeo, beastSkinMat);
    lLegMesh.castShadow = true;
    this.leftLegGroup.add(lLegMesh);

    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.48, -0.48, -0.38);
    this.torsoMesh.add(this.rightLegGroup);
    const rLegMesh = new THREE.Mesh(legGeo, beastSkinMat);
    rLegMesh.castShadow = true;
    this.rightLegGroup.add(rLegMesh);

    // Sleek demon monkey scale (compact & menacing, doesn't block player sightline)
    this.group.scale.setScalar(0.72);
  }

  public update(delta: number, speed: number, isGameOver: boolean) {
    if (isGameOver) {
      // Ferocious pounce and tackle attack pose
      this.attackTimer += delta;
      this.rootBody.position.y = THREE.MathUtils.damp(this.rootBody.position.y, 1.9, 10, delta);
      this.rootBody.rotation.x = THREE.MathUtils.damp(this.rootBody.rotation.x, 0.65, 10, delta);

      // Claws lunging forward to grab the adventurer
      this.leftArmGroup.rotation.x = THREE.MathUtils.damp(this.leftArmGroup.rotation.x, -2.1, 14, delta);
      this.rightArmGroup.rotation.x = THREE.MathUtils.damp(this.rightArmGroup.rotation.x, -2.1, 14, delta);
      this.leftForearmGroup.rotation.x = THREE.MathUtils.damp(this.leftForearmGroup.rotation.x, -0.4, 14, delta);
      this.rightForearmGroup.rotation.x = THREE.MathUtils.damp(this.rightForearmGroup.rotation.x, -0.4, 14, delta);

      this.jawMesh.rotation.x = 0.6; // Wide open snarling jaws
      return;
    }

    // Ferocious Gallop Animation
    const gallopFreq = Math.min(Math.max(speed * 0.48, 8), 20);
    this.gallopCycle += delta * gallopFreq;
    const cycle = this.gallopCycle;

    // Heavy body bounding bob
    this.rootBody.position.y = 1.1 + Math.abs(Math.sin(cycle * 2)) * 0.25;
    this.rootBody.rotation.x = 0.38 + Math.sin(cycle * 2) * 0.14; // aggressive forward slouch

    // Alternating heavy knuckle swings
    const armSwing = Math.sin(cycle) * 1.05;
    this.leftArmGroup.rotation.x = armSwing - 0.25;
    this.rightArmGroup.rotation.x = -armSwing - 0.25;

    this.leftForearmGroup.rotation.x = -0.65 + Math.max(0, -armSwing * 0.65);
    this.rightForearmGroup.rotation.x = -0.65 + Math.max(0, armSwing * 0.65);

    // Hind legs galloping
    this.leftLegGroup.rotation.x = -armSwing * 0.85;
    this.rightLegGroup.rotation.x = armSwing * 0.85;

    // Snarling and snapping jaws
    this.jawMesh.rotation.x = 0.2 + Math.abs(Math.sin(cycle * 1.5)) * 0.28;

    // Head swaying with predator lock
    this.headGroup.rotation.y = Math.sin(cycle * 0.5) * 0.12;
    this.headGroup.rotation.x = Math.sin(cycle * 2) * 0.08;
  }
}
