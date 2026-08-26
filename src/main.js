// Main Game Loop & State Manager
import { THREE } from './mini3d.js';
import { sound } from './audio.js';
import { createRainbowEnvironment } from './rainbow.js';
import { createUnicornManager } from './unicorns.js';
import { createControlsManager } from './controls.js';

export function initGame() {
  const container = document.getElementById('game-container');
  if (!container) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020010);
  scene.fog = new THREE.FogExp2(0x020010, 0.01);

  const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 200);
  camera.position.set(0, 3.8, 12);
  camera.lookAt(0, 1.2, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.xr.enabled = true;
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // WebXR VR button
  if (navigator.xr) {
    const vb = document.createElement('button');
    vb.id = 'vr-button'; vb.innerText = 'ENTER VR';
    vb.onclick = () => navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] })
      .then(s => renderer.xr.setSession(s));
    document.getElementById('hud')?.appendChild(vb);
  }

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const dl = new THREE.DirectionalLight(0xffeedd, 1.2);
  dl.position.set(5, 15, 10); scene.add(dl);

  const rainbowEnv = createRainbowEnvironment(THREE, scene);
  const unicorns = createUnicornManager(THREE, scene, rainbowEnv);
  const controls = createControlsManager(THREE, scene, renderer, rainbowEnv);

  const STATE = { MENU: 0, PLAYING: 1, GAMEOVER: 2 };
  let state = STATE.MENU;
  let score = 0, combo = 0, maxCombo = 0, lives = 3;
  let highScore = +localStorage.getItem('rd_xr_hi') || 0;
  let spawnT = 0, spawnI = 1.2, gameT = 0;
  const clock = new THREE.Clock();

  // VR board canvas
  const vbc = document.createElement('canvas');
  vbc.width = 512; vbc.height = 256;
  const vbx = vbc.getContext('2d');
  const vbt = new THREE.CanvasTexture(vbc);
  const vrBoard = new THREE.Group();
  vrBoard.position.set(0, 4.2, 0);
  const vrMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8), new THREE.MeshBasicMaterial({ map: vbt, transparent: true }));
  vrBoard.add(vrMesh); scene.add(vrBoard);

  function drawVRBoard(t, l1, l2) {
    vbx.clearRect(0, 0, 512, 256);
    vbx.fillStyle = 'rgba(10,5,27,.85)'; vbx.beginPath(); vbx.roundRect(10, 10, 492, 236, 18); vbx.fill();
    vbx.strokeStyle = '#ff66cc'; vbx.lineWidth = 4; vbx.stroke();
    vbx.fillStyle = '#fff'; vbx.font = 'bold 34px sans-serif'; vbx.textAlign = 'center'; vbx.fillText(t, 256, 58);
    vbx.fillStyle = '#ffeb3b'; vbx.font = 'bold 28px sans-serif'; vbx.fillText(l1, 256, 116);
    vbx.fillStyle = '#00ffff'; vbx.font = 'bold 22px sans-serif'; vbx.fillText(l2, 256, 178);
    vbt.needsUpdate = true;
  }

  // DOM refs
  const $id = id => document.getElementById(id);
  const hudSc = $id('score-val'), hudCo = $id('combo-val'), hudLi = $id('lives-val'),
        hudHi = $id('high-val'), menuOv = $id('overlay-menu'), goOv = $id('overlay-gameover'),
        popup = $id('score-popup'), vignette = $id('vignette'), comboFill = $id('combo-bar-fill');

  if (hudHi) hudHi.innerText = highScore;

  let dScore = 0, sVel = 0; // animated score display

  function updateHUD() {
    if (hudCo) {
      hudCo.innerText = combo > 1 ? `${combo}x` : '1x';
      if (combo > 0 && combo % 5 === 0) { hudCo.classList.add('combo-flash'); setTimeout(() => hudCo.classList.remove('combo-flash'), 600); }
    }
    if (hudLi) {
      const h = '❤️'.repeat(Math.max(0, lives));
      if (hudLi.innerText !== h) { hudLi.innerText = h; hudLi.classList.add('life-lost'); setTimeout(() => hudLi.classList.remove('life-lost'), 500); }
    }
    if (comboFill) {
      const pct = Math.min(100, (combo / 10) * 100);
      comboFill.style.width = pct + '%';
      comboFill.style.background = combo >= 10
        ? 'linear-gradient(90deg,#ff66cc,#ffeb3b,#00ffff)'
        : 'linear-gradient(90deg,#ff66cc,#9933ff)';
    }
    if (score > highScore) { highScore = score; localStorage.setItem('rd_xr_hi', highScore); if (hudHi) hudHi.innerText = highScore; }
  }

  function showPopup(txt, color) {
    if (!popup) return;
    popup.innerText = txt; popup.style.color = color || '#ffeb3b';
    popup.style.opacity = '1'; popup.style.transform = 'translateX(-50%) translateY(-30px) scale(1)';
    popup.classList.remove('popup-hide');
    void popup.offsetWidth;
    popup.classList.add('popup-hide');
  }

  function flash(color, dur) {
    if (!vignette) return;
    vignette.style.background = `radial-gradient(ellipse at center,transparent 50%,${color}88 100%)`;
    vignette.style.opacity = '1'; vignette.style.transition = 'none';
    setTimeout(() => { vignette.style.transition = `opacity ${dur || 0.4}s ease-out`; vignette.style.opacity = '0'; }, 50);
  }

  function startGame() {
    score = dScore = sVel = combo = maxCombo = 0; lives = 3;
    spawnI = 1.2; spawnT = gameT = 0;
    unicorns.clearAll();
    state = STATE.PLAYING;
    menuOv?.classList.add('hidden');
    goOv?.classList.add('hidden');
    if (hudLi) hudLi.innerText = '❤️❤️❤️';
    updateHUD();
    sound.startBgMusic();
  }

  function gameOver() {
    state = STATE.GAMEOVER;
    sound.stopBgMusic(); sound.playGameOver();
    if (goOv) { goOv.classList.remove('hidden'); goOv.classList.add('overlay-enter'); setTimeout(() => goOv.classList.remove('overlay-enter'), 600); }
    const fs = $id('final-score'), fc = $id('final-combo');
    if (fs) fs.innerText = score;
    if (fc) fc.innerText = maxCombo;
    drawVRBoard('GAME OVER', `SCORE: ${score}`, `BEST COMBO: ${maxCombo}x`);
  }

  $id('start-btn')?.addEventListener('click', startGame);
  $id('restart-btn')?.addEventListener('click', startGame);
  $id('mute-btn')?.addEventListener('click', () => {
    const m = sound.toggleMute();
    $id('mute-btn').innerText = m ? '🔇 Muted' : '🔊 Sound';
  });

  function spawnEntity() {
    const l = Math.floor(Math.random() * 3), r = Math.random();
    const type = r < 0.28 ? 'DARK' : r < 0.50 ? 'GOLDEN' : 'SPARKLE';
    unicorns.spawn(type, l, 22 + Math.min(18, gameT * 0.4));
  }

  // Draw burst particles on canvas
  function drawBursts(cv) {
    const ctx = renderer.ctx; if (!ctx) return;
    const hor = cv.height * 0.34, bot = cv.height * 0.92;
    unicorns.getBursts().forEach(b => {
      const r = (b.color >> 16) & 0xff, g = (b.color >> 8) & 0xff, bl = b.color & 0xff;
      b.particles.forEach(p => {
        if (p.life <= 0) return;
        const d = Math.max(1, camera.position.z - p.z);
        const sc = cv.height / (d * 1.5);
        const sx = cv.width / 2 + p.x * sc;
        const sy = cv.height * 0.57 - (p.y - 1) * sc;
        if (sy < hor - 20 || sy > bot + 40) return;
        const sz = Math.max(2, sc * p.size * 0.4);
        ctx.globalAlpha = p.life * 0.85;
        ctx.fillStyle = `rgb(${r},${g},${bl})`;
        ctx.beginPath(); ctx.arc(sx, sy, sz, 0, Math.PI * 2); ctx.fill();
      });
    });
    ctx.globalAlpha = 1;
  }

  renderer.setAnimationLoop(() => {
    const delta = Math.min(clock.getDelta(), 0.1);
    const time = clock.getElapsedTime();
    rainbowEnv.update(time);
    controls.update(delta);
    if (renderer.combo !== undefined) renderer.combo = combo;

    if (state === STATE.MENU) {
      drawVRBoard('RAINBOW DASH XR', 'CATCH UNICORNS! DODGE BOMBS!', 'CLICK START TO PLAY');
    } else if (state === STATE.PLAYING) {
      gameT += delta;
      spawnI = Math.max(0.45, 1.2 - (gameT / 60) * 0.5);
      spawnT += delta;
      if (spawnT >= spawnI) { spawnT = 0; spawnEntity(); }

      const pl = controls.getActiveLane();
      unicorns.update(delta, time, pl,
        caught => {
          combo++; maxCombo = Math.max(maxCombo, combo);
          const pts = (caught.type === 'GOLDEN' ? 300 : 100) * Math.min(5, combo);
          score += pts;
          const col = caught.type === 'GOLDEN' ? '#ffd700' : '#ff66cc';
          showPopup(`+${pts}${combo > 1 ? ` ${combo}x!` : ''}`, col);
          flash(col, 0.3);
          renderer.triggerShake?.(caught.type === 'GOLDEN' ? 3 : 2, 0.18);
          rainbowEnv.triggerLaneFlash(caught.laneIndex, col);
          if (renderer._lFc) renderer._lFc[caught.laneIndex] = col;
          caught.type === 'GOLDEN' ? sound.playGolden() : sound.playCatch();
          updateHUD();
        },
        hit => {
          lives--; combo = 0; sound.playHit();
          renderer.triggerShake?.(10, 0.45);
          flash('#ff0044', 0.6);
          showPopup('💥 BOMB!', '#ff3366');
          rainbowEnv.triggerLaneFlash(hit.laneIndex, '#ff1744');
          if (renderer._lFc) renderer._lFc[hit.laneIndex] = '#ff1744';
          updateHUD();
          if (lives <= 0) gameOver();
        },
        () => { combo = 0; showPopup('MISS', '#777'); updateHUD(); }
      );

      // Smooth score roll
      if (dScore < score) {
        sVel += (score - dScore) * 10 * delta;
        sVel *= 1 - 8 * delta;
        dScore = Math.min(score, Math.round(dScore + sVel * delta));
        if (hudSc) hudSc.innerText = dScore;
      }

      drawVRBoard('PLAYING', `SCORE: ${score}`, `COMBO: ${combo}x | ❤️×${lives}`);
    }

    renderer.render(scene, camera);
    drawBursts(renderer.domElement);
  });

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
}
