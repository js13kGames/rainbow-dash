# Rainbow Dash XR 🦄🌈 (js13kGames 2026 Entry)

An immersive WebXR 3D game created for the **js13kGames 2026** competition under the theme **"Unicorns and Rainbows"**.

---

## 🎮 Game Concept & Features

- **Setting**: A winding, glowing 7-color 3D Rainbow Bridge racing through a cosmic starry galaxy with floating low-poly clouds.
- **Goal**: Catch galloping magical **Sparkle Unicorns** (+100 pts) and rare **Golden Pegasus Unicorns** (+300 pts & Frenzy Mode) across 3 dynamic lanes.
- **Hazard / Loss Condition**: Avoid **Dark Storm Shadow Horses**! Colliding with a dark storm shadow horse reduces your lives (3 Hearts maximum). The game ends when all 3 hearts are lost.
- **Combo System**: Catching consecutive unicorns without missing increases your score multiplier (x2, x3, x4!).
- **Dual Support**: Plays seamlessly in full **WebXR VR Mode** (Quest, Vive, WebXR browser extension) AND **2D Desktop/Mobile Mode** (Keyboard, Mouse, Touch).
- **Procedural Sound Synthesizer**: Built using zero-byte Web Audio API (chimes, explosions, victory fanfares, and 8-bit background music).
- **High Score Persistence**: Automatically saves your top score in `localStorage` (`js13k_2026_rainbow_xr_highscore`).

---

## 📦 Zip Size Verification

- **Archive File**: `game.zip`
- **Actual Build Size**: `~220 KB` (bundled and compressed)
- **Runtime dependencies**: None; Three.js is bundled into the archive.

---

## 🕹️ Controls

| Platform | Lane Movement | Catch Action |
| :--- | :--- | :--- |
| 🥽 **WebXR VR Headset** | Move physical controllers / hands | Point catcher ring & Squeeze trigger |
| ⌨️ **Desktop Keyboard** | `A` / `D` or `Left Arrow` / `Right Arrow` | `Spacebar` / `Enter` |
| 🖱️ **Desktop Mouse** | Click Left / Center / Right third of screen | Click screen |
| 📱 **Mobile Touch** | Tap Left / Center / Right third of screen | Tap screen |

---

## 🧪 Testing & Running Guide

### 1. Running Locally (Development Mode)

```bash
# Install dependencies
npm install

# Start Vite local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### 2. Building Production Package (`game.zip`)

```bash
# Minify code, inline bundle, and compress into game.zip
npm run build
```

This generates `game.zip` in the project root directory.

---

### 3. How to Test WebXR VR Features

#### Option A: WebXR API Emulator Extension (Recommended for Desktop Devs)
1. Install the official **WebXR API Emulator** extension for Chrome or Firefox:
   - [Chrome Web Store - WebXR API Emulator](https://chromewebstore.google.com/detail/webxr-api-emulator/mjddjgegcldfeiplkbgochenhhgkcjbe)
   - [Firefox Add-ons - WebXR API Emulator](https://addons.mozilla.org/en-US/firefox/addon/webxr-api-emulator/)
2. Open Chrome/Firefox DevTools (`F12`).
3. Select the **WebXR** tab in DevTools.
4. Choose a headset profile (e.g. *Meta Quest 2* or *Oculus Touch*).
5. Refresh the game page. The **ENTER VR** button will appear in the HUD!
6. Click **ENTER VR** and use the DevTools WebXR panel sliders to simulate controller movement and trigger presses.

#### Option B: Standalone VR Headset (Meta Quest 2/3/Pro, Pico, HTC Vive)
1. Host the project locally or via HTTPS (e.g. `npx vite --host` or GitHub Pages / Vercel).
2. Open the Meta Quest Browser on your VR headset.
3. Navigate to the game URL and click **ENTER VR**.
4. Reach out with your VR controllers to catch unicorns directly along the rainbow bridge!

#### Option C: Non-VR Desktop & Mobile Verification
1. Open the game in standard Chrome or Firefox.
2. Click **PLAY GAME**.
3. Use `A` / `D` or `Left` / `Right` arrow keys to change lanes.
4. Press `Spacebar` to pulse your magical catcher net.
5. Collect unicorns, avoid dark storm horses, and aim for a high score!

---

## 📄 License & Category Rules

Three.js is bundled locally so the extracted `index.html` can run without external resources.
