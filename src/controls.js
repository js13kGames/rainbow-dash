// 3-Lane Controls — Spring Physics + Swipe

export function createControlsManager(THREE, scene, renderer, rainbowEnv) {
  let lane = 1;
  let cx = 0, cvx = 0;          // catcher X, velocity X
  let tilt = 0, tiltV = 0;      // lean tilt

  const cg = new THREE.Group();
  cg.position.set(0, 0.05, rainbowEnv.playerCatchZ);

  const rm = new THREE.MeshStandardMaterial({ color: 0xff66cc, emissive: 0xff66cc, emissiveIntensity: 0.9 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.12, 16, 32), rm);
  ring.rotation.x = Math.PI / 2;
  cg.add(ring);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.1, 3.5, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3 })
  );
  beam.position.y = 1.75;
  cg.add(beam);
  scene.add(cg);

  const xrCtrl = [renderer.xr.getController(0), renderer.xr.getController(1)];
  xrCtrl.forEach(c => scene.add(c));

  function setLane(l) {
    lane = Math.max(0, Math.min(2, l));
    rainbowEnv.highlightLane(lane);
    // Impulse kick toward target
    cvx += Math.sign(rainbowEnv.lanePositions[lane] - cx) * 4;
  }

  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') setLane(lane - 1);
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') setLane(lane + 1);
    else if (e.key === '1') setLane(0);
    else if (e.key === '2') setLane(1);
    else if (e.key === '3') setLane(2);
  });

  document.getElementById('btn-lane-left')?.addEventListener('click', e => { e.stopPropagation(); setLane(0); });
  document.getElementById('btn-lane-center')?.addEventListener('click', e => { e.stopPropagation(); setLane(1); });
  document.getElementById('btn-lane-right')?.addEventListener('click', e => { e.stopPropagation(); setLane(2); });

  window.addEventListener('pointerdown', e => {
    if (e.target.closest('#hud,#lane-controls,.overlay') || e.target.tagName === 'BUTTON') return;
    const f = e.clientX / window.innerWidth;
    setLane(f < 0.38 ? 0 : f > 0.62 ? 2 : 1);
  });

  // Swipe support
  let tsx = 0;
  window.addEventListener('touchstart', e => { tsx = e.touches[0].clientX; }, { passive: true });
  window.addEventListener('touchend', e => {
    if (e.target.closest('#hud,#lane-controls,.overlay') || e.target.tagName === 'BUTTON') return;
    const dx = e.changedTouches[0].clientX - tsx;
    if (Math.abs(dx) > 40) setLane(lane + (dx > 0 ? 1 : -1));
  }, { passive: true });

  return {
    getActiveLane() { return lane; },
    setLane,
    update(delta) {
      if (renderer.xr.isPresenting) {
        xrCtrl.forEach(c => {
          const v = new THREE.Vector3();
          c.getWorldPosition?.(v);
          setLane(v.x < -1.2 ? 0 : v.x > 1.2 ? 2 : 1);
        });
      }
      // Spring physics: F = k*(target-x) - b*v
      const tx = rainbowEnv.lanePositions[lane];
      cvx += ((tx - cx) * 180 - cvx * 18) * delta;
      cx += cvx * delta;
      cg.position.x = cx;

      // Sync lane to renderer
      if (renderer.activeLane !== undefined) renderer.activeLane = lane;

      // Tilt lean
      const tTarget = -cvx * 0.055;
      tiltV += ((tTarget - tilt) * 90 - tiltV * 12) * delta;
      tilt += tiltV * delta;
      cg.rotation.z = tilt;

      // Beam spin
      beam.rotation.y += delta * (2 + Math.abs(cvx) * 0.3);
    }
  };
}
