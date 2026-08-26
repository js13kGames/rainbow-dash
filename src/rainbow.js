// Simplified & Crystal Clear 3-Lane Rainbow Highway for WebXR & Desktop

export function createRainbowEnvironment(THREE, scene) {
  const group = new THREE.Group();

  // Lane positions: 0: Left (-3.2), 1: Center (0.0), 2: Right (+3.2)
  const lanePositions = [-3.2, 0.0, 3.2];
  const roadLength = 120;

  // 1. Rainbow Highway Ribbon (7 HSL Stripes)
  const ribbonGeo = new THREE.PlaneGeometry(10.5, roadLength, 7, 40);
  ribbonGeo.rotateX(-Math.PI / 2);
  ribbonGeo.translate(0, 0, -roadLength / 2 + 10);

  const posAttr = ribbonGeo.attributes.position;
  const colors = [];
  const rainbowColors = [
    [1.0, 0.2, 0.4], // Red
    [1.0, 0.5, 0.1], // Orange
    [1.0, 0.9, 0.2], // Yellow
    [0.2, 0.9, 0.4], // Green
    [0.1, 0.8, 1.0], // Cyan
    [0.3, 0.3, 1.0], // Blue
    [0.7, 0.2, 0.9]  // Violet
  ];

  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const colorIdx = Math.floor(((vx + 5.25) / 10.5) * 7);
    const c = rainbowColors[Math.max(0, Math.min(6, colorIdx))];
    colors.push(c[0], c[1], c[2]);
  }

  ribbonGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const ribbonMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.3,
    metalness: 0.1,
    emissive: new THREE.Color(0x111133),
    emissiveIntensity: 0.4
  });

  const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
  group.add(ribbonMesh);

  // 2. Glowing Lane Dividers
  [-1.6, 1.6].forEach(dividerX => {
    const dGeo = new THREE.BoxGeometry(0.1, 0.05, roadLength);
    const dMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    const dMesh = new THREE.Mesh(dGeo, dMat);
    dMesh.position.set(dividerX, 0.03, -roadLength / 2 + 10);
    group.add(dMesh);
  });

  // 3. Player Catch Line Target Markers (Z = 6.0)
  const padGroup = new THREE.Group();
  padGroup.position.z = 6.0;
  const pads = [];

  lanePositions.forEach((lx, i) => {
    const padGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.08, 32);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.8
    });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.set(lx, 0.04, 0);
    padGroup.add(padMesh);
    pads.push({ mesh: padMesh, mat: padMat, pulsePhase: i * 1.2 });
  });
  group.add(padGroup);

  // 4. Starfield & Cosmic Nebula
  const starCount = 600;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i += 3) {
    starPos[i] = (Math.random() - 0.5) * 200;
    starPos[i + 1] = Math.random() * 80;
    starPos[i + 2] = (Math.random() - 0.5) * 200;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ size: 1.2, color: 0xffffff, transparent: true, opacity: 0.85 });
  const stars = new THREE.Points(starGeo, starMat);
  group.add(stars);

  // 5. Nebula clouds (distant large faint points)
  const nebulaCount = 80;
  const nebulaGeo = new THREE.BufferGeometry();
  const nebulaPos = new Float32Array(nebulaCount * 3);
  for (let i = 0; i < nebulaCount * 3; i += 3) {
    nebulaPos[i] = (Math.random() - 0.5) * 160;
    nebulaPos[i + 1] = 10 + Math.random() * 50;
    nebulaPos[i + 2] = (Math.random() - 0.5) * 160;
  }
  nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPos, 3));
  const nebulaMat = new THREE.PointsMaterial({ size: 4.5, color: 0x9933ff, transparent: true, opacity: 0.18 });
  const nebula = new THREE.Points(nebulaGeo, nebulaMat);
  group.add(nebula);

  scene.add(group);

  // Lane flash state
  const laneFlash = [0, 0, 0];
  const laneFlashColors = [0x00ffff, 0x00ffff, 0x00ffff];

  return {
    group,
    lanePositions,
    playerCatchZ: 6.0,

    highlightLane(activeLane) {
      pads.forEach((pad, idx) => {
        if (idx === activeLane) {
          pad.mat.emissive.setHex(0xff66cc);
          pad.mat.emissiveIntensity = 1.0;
          pad.mesh.scale.set(1.2, 1.5, 1.2);
        } else {
          pad.mat.emissive.setHex(0x00ffff);
          pad.mat.emissiveIntensity = 0.3;
          pad.mesh.scale.set(1.0, 1.0, 1.0);
        }
      });
    },

    triggerLaneFlash(laneIdx, color) {
      laneFlash[laneIdx] = 1.0;
      laneFlashColors[laneIdx] = color || 0xff66cc;
    },

    update(time) {
      // Rotate stars gently + nebula drift
      stars.rotation.y = time * 0.012;
      nebula.rotation.y = time * 0.007;
      nebula.rotation.x = time * 0.003;

      // Animate pads: pulse scale and emissive
      pads.forEach((pad, i) => {
        const pulse = 0.04 * Math.sin(time * 3.5 + pad.pulsePhase);
        pad.mesh.position.y = 0.04 + pulse;
      });

      // Decay lane flash
      for (let i = 0; i < 3; i++) {
        laneFlash[i] = Math.max(0, laneFlash[i] - 0.016 * 3.5);
      }
    }
  };
}
