import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  color: THREE.Color;
}

export class ParticleSystem {
  public group: THREE.Group;
  private particles: Particle[] = [];
  private dustGeo: THREE.DodecahedronGeometry;
  private sparkGeo: THREE.TetrahedronGeometry;

  // Shared particle materials
  private dustMat: THREE.MeshBasicMaterial;
  private coinSparkMat: THREE.MeshBasicMaterial;

  // Ambient Jungle Fireflies
  private firefliesGroup: THREE.Points;
  private fireflyCount: number = 75;
  private fireflyPositions: Float32Array;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'particle_system';

    this.dustGeo = new THREE.DodecahedronGeometry(0.08, 0);
    this.sparkGeo = new THREE.TetrahedronGeometry(0.1, 0);

    this.dustMat = new THREE.MeshBasicMaterial({
      color: 0xd4c5a3,
      transparent: true,
      opacity: 0.7,
    });

    this.coinSparkMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.9,
    });

    // Ambient floating jungle fireflies
    const fireflyGeo = new THREE.BufferGeometry();
    this.fireflyPositions = new Float32Array(this.fireflyCount * 3);
    for (let i = 0; i < this.fireflyCount; i++) {
      this.fireflyPositions[i * 3 + 0] = (Math.random() - 0.5) * 20;
      this.fireflyPositions[i * 3 + 1] = 0.5 + Math.random() * 4.5;
      this.fireflyPositions[i * 3 + 2] = Math.random() * 100;
    }
    fireflyGeo.setAttribute('position', new THREE.BufferAttribute(this.fireflyPositions, 3));

    const fireflyMat = new THREE.PointsMaterial({
      color: 0xa3e635, // luminous lime-green firefly glow
      size: 0.28,
      transparent: true,
      opacity: 0.85,
    });
    this.firefliesGroup = new THREE.Points(fireflyGeo, fireflyMat);
    this.group.add(this.firefliesGroup);
  }

  // Dust puff from running footstep
  public emitRunningDust(x: number, y: number, z: number) {
    for (let i = 0; i < 3; i++) {
      const mesh = new THREE.Mesh(this.dustGeo, this.dustMat.clone());
      mesh.position.set(x + (Math.random() - 0.5) * 0.3, y + 0.05, z - 0.2);
      this.group.add(mesh);

      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 0.8,
        vy: 0.5 + Math.random() * 0.8,
        vz: -1.2 - Math.random() * 1.5,
        life: 0.35,
        maxLife: 0.35,
        color: new THREE.Color(0xd4c5a3),
      });
    }
  }

  // Intense sparks & dust when sliding
  public emitSlideSparks(x: number, y: number, z: number) {
    for (let i = 0; i < 4; i++) {
      const isSpark = Math.random() > 0.4;
      const mesh = new THREE.Mesh(
        isSpark ? this.sparkGeo : this.dustGeo,
        isSpark ? this.coinSparkMat.clone() : this.dustMat.clone()
      );
      mesh.position.set(x + (Math.random() - 0.5) * 0.4, y + 0.05, z);
      this.group.add(mesh);

      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 2.5,
        vy: 0.8 + Math.random() * 1.5,
        vz: -3.5 - Math.random() * 2.0,
        life: 0.4,
        maxLife: 0.4,
        color: new THREE.Color(isSpark ? 0xf59e0b : 0x78716c),
      });
    }
  }

  // Golden burst when collecting a coin
  public emitCoinBurst(x: number, y: number, z: number) {
    for (let i = 0; i < 12; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, this.coinSparkMat.clone());
      mesh.position.set(x, y, z);
      this.group.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 3.5;

      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 1.5,
        vz: (Math.random() - 0.5) * 2.0,
        life: 0.5,
        maxLife: 0.5,
        color: new THREE.Color(0xfacc15),
      });
    }
  }

  // Impact debris on crash
  public emitCrashDebris(x: number, y: number, z: number) {
    for (let i = 0; i < 20; i++) {
      const mesh = new THREE.Mesh(this.dustGeo, this.dustMat.clone());
      mesh.position.set(x, y + 0.8, z);
      mesh.scale.setScalar(1.5 + Math.random() * 1.5);
      this.group.add(mesh);

      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 6.0,
        vy: 2.0 + Math.random() * 5.0,
        vz: (Math.random() - 0.5) * 6.0,
        life: 0.8,
        maxLife: 0.8,
        color: new THREE.Color(0xa8a29e),
      });
    }
  }

  public update(delta: number, playerZ: number) {
    // 1. Update active particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.group.remove(p.mesh);
        p.mesh.geometry.dispose();
        if (p.mesh.material instanceof THREE.Material) {
          p.mesh.material.dispose();
        }
        this.particles.splice(i, 1);
        continue;
      }

      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;
      p.vy -= 9.8 * delta; // gravity on debris

      // Fade out
      const alpha = p.life / p.maxLife;
      if (p.mesh.material instanceof THREE.Material && 'opacity' in p.mesh.material) {
        p.mesh.material.opacity = alpha;
      }
      p.mesh.scale.setScalar(alpha);
    }

    // 2. Recycle and shift ambient fireflies ahead of player
    const posAttr = this.firefliesGroup.geometry.getAttribute('position') as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < this.fireflyCount; i++) {
      let z = array[i * 3 + 2];
      // If firefly is behind player, shift it ahead
      if (z < playerZ - 10) {
        z = playerZ + 40 + Math.random() * 70;
        array[i * 3 + 0] = (Math.random() - 0.5) * 16;
        array[i * 3 + 1] = 0.5 + Math.random() * 4.5;
        array[i * 3 + 2] = z;
      } else {
        // Gentle bobbing hover
        array[i * 3 + 1] += Math.sin(performance.now() * 0.003 + i) * 0.015;
      }
    }
    posAttr.needsUpdate = true;
  }

  public clear() {
    this.particles.forEach((p) => {
      this.group.remove(p.mesh);
    });
    this.particles = [];
  }
}
