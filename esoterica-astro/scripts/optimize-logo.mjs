// Optimize /public/logo.png (3840×3840, ~3.2MB) into responsive WebP + PNG fallbacks.
// Outputs go to /public/logo/ so the original file can be deleted after verification.
import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, '../public/logo.png');
const OUT_DIR = resolve(__dirname, '../public/logo');

// Sizes chosen to cover every rendering site at 1x and 2x DPR:
//   footer 44×44  → 48 (1x) + 96 (2x)
//   nav    36×36  → 48 (1x) + 96 (2x) [shares 48/96 with footer]
//   hero  140×140 → 160 (1x) + 320 (2x)
const SIZES = [48, 96, 160, 320];

await mkdir(OUT_DIR, { recursive: true });

const meta = await sharp(SRC).metadata();
const st = await stat(SRC);
const mb = (st.size / 1024 / 1024).toFixed(2);
console.log(`Source: ${meta.width}×${meta.height} ${meta.format} (${mb} MB)`);

for (const size of SIZES) {
  const resized = sharp(SRC).resize(size, size, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
  const webpPath = resolve(OUT_DIR, `logo-${size}.webp`);
  const pngPath = resolve(OUT_DIR, `logo-${size}.png`);
  await resized.clone().webp({ quality: 88, effort: 6 }).toFile(webpPath);
  await resized.clone().png({ compressionLevel: 9, palette: true }).toFile(pngPath);
  console.log(`  ✓ logo-${size}.webp  logo-${size}.png`);
}
console.log('Done. Review /public/logo/ and delete /public/logo.png when satisfied.');
