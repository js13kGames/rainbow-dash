// Unicorns & Hazard Entities — Physics entry bounce (fixed spawn position)

export function createUnicornManager(THREE, scene, rainbowEnv) {
  const activeEntities = [];
  const activeBursts = []; // RAF delta-time particles

  const sparkleMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const hornMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b, emissive: 0xffcc00, emissiveIntensity: 1 });
  const goldBodyMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
  const goldHornMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 1 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1f062b });
  const hazardMat = new THREE.MeshStandardMaterial({ color: 0xff0044, emissive: 0xff0044, emissiveIntensity: 1 });

  function buildMesh(type) {
    const g = new THREE.Group();
    if (type === 'DARK') {
      g.add(Object.assign(new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), darkMat), { position: new THREE.Vector3(0, 1, 0) }));
      for (let i = 0; i < 4; i++) {
        const s = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.9, 4), hazardMat);
        s.rotation.z = i * Math.PI / 2;
        s.position.set(Math.cos(i * Math.PI / 2) * 0.9, 1, Math.sin(i * Math.PI / 2) * 0.9);
        g.add(s);
      }
      return { mesh: g, legs: [], type };
    }
    const isGold = type === 'GOLDEN';
    const bm = isGold ? goldBodyMat : sparkleMat;
    const hm = isGold ? goldHornMat : hornMat;

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 1.5), bm);
    torso.position.y = 0.9; g.add(torso);

    const hg = new THREE.Group();
    hg.position.set(0, 1.3, 0.6);
    hg.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.5), bm));
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.8), bm);
    head.position.set(0, 0.4, 0.3); hg.add(head);
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.9, 8), hm);
    horn.rotation.x = 0.5; horn.position.set(0, 0.7, 0.6); hg.add(horn);
    g.add(hg);

    const legs = [];
    [[0.35, 0.45], [-0.35, 0.45], [0.35, -0.45], [-0.35, -0.45]].forEach(([x, z]) => {
      const lp = new THREE.Group();
      lp.position.set(x, 0.8, z);
      const lm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.8, 0.22), bm);
      lm.position.y = -0.4; lp.add(lm); g.add(lp); legs.push(lp);
    });
    g.scale.set(0.9, 0.9, 0.9);
    return { mesh: g, legs, type };
  }

  function burst(pos, color, count, upBias) {
    const particles = [];
    for (let i = 0; i < (count || 24); i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 3 + Math.random() * 6;
      particles.push({
        x: pos.x, y: pos.y + 0.5, z: pos.z,
        vx: Math.cos(a) * sp, vy: Math.random() * 5 * (upBias || 1) + 2, vz: Math.sin(a) * sp * 0.3,
        life: 1, decay: 0.8 + Math.random() * 0.5, size: 0.1 + Math.random() * 0.25
      });
    }
    activeBursts.push({ particles, color });
  }

  return {
    spawn(type, laneIndex, speed) {
      const e = buildMesh(type);
      const ent = {
        ...e, laneIndex,
        z: -90,
        speed: speed || (type === 'GOLDEN' ? 28 : type === 'DARK' ? 26 : 22),
        processed: false, active: true,
        // Bounce physics — START AT 0 so entities appear on the road, not above horizon
        bY: 0,           // bounce Y offset (starts on ground)
        bVY: 0,          // bounce velocity Y
        bounceTriggered: false, // bounce fires when entity enters visible range
      };
      ent.mesh.position.set(rainbowEnv.lanePositions[laneIndex], 0, ent.z);
      scene.add(ent.mesh);
      activeEntities.push(ent);
      return ent;
    },

    update(delta, time, playerLane, onCatch, onHit, onMiss) {
      const catchZ = rainbowEnv.playerCatchZ;

      // Update particles (gravity + drag)
      for (let b = activeBursts.length - 1; b >= 0; b--) {
        const bst = activeBursts[b];
        let any = false;
        for (const p of bst.particles) {
          if (p.life <= 0) continue;
          any = true;
          p.life -= delta * p.decay;
          p.x += p.vx * delta; p.y += p.vy * delta; p.z += p.vz * delta;
          p.vy -= 9.8 * delta; // gravity
          p.vx *= 1 - delta; p.vz *= 1 - delta; // drag
        }
        if (!any) activeBursts.splice(b, 1);
      }

      for (let i = activeEntities.length - 1; i >= 0; i--) {
        const ent = activeEntities[i];
        if (!ent.active) continue;

        ent.z += ent.speed * delta;
        const posX = rainbowEnv.lanePositions[ent.laneIndex];

        // Trigger a landing bounce when entity enters visible zone (z > -20)
        if (!ent.bounceTriggered && ent.z > -20) {
          ent.bounceTriggered = true;
          ent.bY = 1.8;   // pop up briefly then spring back down
          ent.bVY = -3.0;
        }

        // Damped spring back to ground
        if (ent.bounceTriggered && (Math.abs(ent.bY) > 0.002 || Math.abs(ent.bVY) > 0.005)) {
          const a = -24 * ent.bY - 6 * ent.bVY; // spring k=24, damping b=6
          ent.bVY += a * delta;
          ent.bY += ent.bVY * delta;
          if (Math.abs(ent.bY) < 0.002 && Math.abs(ent.bVY) < 0.005) { ent.bY = 0; ent.bVY = 0; }
        }

        ent.mesh.position.set(posX, ent.bY, ent.z);

        // Animations
        if (ent.type === 'DARK') {
          ent.mesh.rotation.y = time * 4;
        } else if (ent.legs.length >= 4) {
          const la = Math.sin(time * 14 + ent.laneIndex) * 0.6;
          ent.legs[0].rotation.x = la; ent.legs[1].rotation.x = -la;
          ent.legs[2].rotation.x = -la; ent.legs[3].rotation.x = la;
        }

        // Catch zone check
        if (!ent.processed && ent.z >= catchZ - 0.8 && ent.z <= catchZ + 1.2) {
          ent.processed = true;
          if (ent.laneIndex === playerLane) {
            if (ent.type === 'DARK') {
              burst(ent.mesh.position, 0xff0044, 32, 0.5);
              onHit(ent);
            } else {
              burst(ent.mesh.position, ent.type === 'GOLDEN' ? 0xffd700 : 0xff66cc, 30, 1.4);
              onCatch(ent);
            }
            ent.active = false;
            scene.remove(ent.mesh);
            activeEntities.splice(i, 1);
            continue;
          }
        }

        // Passed player
        if (ent.z > 9) {
          ent.active = false;
          scene.remove(ent.mesh);
          activeEntities.splice(i, 1);
          if (!ent.processed && ent.type !== 'DARK') onMiss(ent);
        }
      }
    },

    getBursts() { return activeBursts; },
    getActiveEntities() { return activeEntities; },
    clearAll() {
      activeEntities.forEach(e => scene.remove(e.mesh));
      activeEntities.length = 0;
      activeBursts.length = 0;
    }
  };
}
