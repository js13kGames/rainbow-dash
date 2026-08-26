// Production Build & Zip Pipeline for js13kGames
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { build as viteBuild } from 'vite';
import bestzip from 'bestzip';
import { minify } from 'html-minifier-terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function build() {
  console.log('🚀 Starting js13k production build pipeline...');

  const distDir = path.join(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }

  // 1. Run Vite build
  console.log('⚡ Running Vite build...');
  await viteBuild();

  // 2. Inline JS bundle into dist/index.html
  console.log('⚡ Inlining JS bundle into dist/index.html...');
  let htmlContent = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

  const assetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    for (const file of files) {
      if (file.endsWith('.js')) {
        const jsCode = fs.readFileSync(path.join(assetsDir, file), 'utf8');
        // Replace script tag pointing to assets/xxx.js with inline type="module" script
        htmlContent = htmlContent.replace(
          new RegExp(`<script[^>]*src="[^"]*assets/${file}"[^>]*><\\/script>`),
          `<script type="module">${jsCode}</script>`
        );
      }
    }
    // Clean assets folder so dist contains only index.html
    fs.rmSync(assetsDir, { recursive: true, force: true });
  }

  // Minify the final self-contained document, including its stylesheet.
  htmlContent = await minify(htmlContent, {
    collapseWhitespace: true,
    conservativeCollapse: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    minifyCSS: true
  });

  const distHtmlPath = path.join(distDir, 'index.html');
  fs.writeFileSync(distHtmlPath, htmlContent, 'utf8');

  // 3. Package into game.zip
  const zipPath = path.join(__dirname, 'game.zip');
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  console.log('📦 Creating compressed game.zip...');
  await bestzip({
    cwd: distDir,
    destination: zipPath,
    source: 'index.html',
    level: 9
  });

  // 4. Report archive size
  const stats = fs.statSync(zipPath);
  const sizeInBytes = stats.size;
  const maxSize = 13312; // 13 KiB

  console.log('\n==================================================');
  console.log(`📦 Zipped Game File: game.zip`);
  console.log(`📏 Zip Size: ${sizeInBytes} bytes (${(sizeInBytes / 1024).toFixed(2)} KiB)`);
  console.log(`🎯 Size Limit: ${maxSize} bytes (13 KiB)`);
  
  if (sizeInBytes <= maxSize) {
    console.log(`✅ SUCCESS: Game zip is within the 13KB size limit! (${maxSize - sizeInBytes} bytes remaining)`);
  } else {
    console.warn(`⚠️ Zip size exceeds the optional 13KB limit by ${sizeInBytes - maxSize} bytes.`);
    console.warn('The archive is self-contained and bundles Three.js locally.');
  }
  console.log('==================================================\n');
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
