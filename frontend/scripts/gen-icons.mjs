// Genera le icone PWA (PNG) dal vettore, una sola volta.
// Eseguito a mano con sharp installato --no-save; i PNG risultanti sono
// committati in public/, quindi la build/CI NON dipende da sharp.
//   node scripts/gen-icons.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, '..', 'public');

// "C" disegnata come arco vettoriale (niente dipendenza da font di sistema).
const C_ARC = 'M 333.2 164.1 A 120 120 0 1 0 333.2 347.9';

const rounded = (radius) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${radius}" fill="#000000"/>
  ${radius ? '<rect x="10" y="10" width="492" height="492" rx="' + (radius - 8) + '" fill="none" stroke="#dc2626" stroke-width="10"/>' : ''}
  <path d="${C_ARC}" fill="none" stroke="#ffffff" stroke-width="46" stroke-linecap="round"/>
  <circle cx="356" cy="170" r="26" fill="#ff3b30"/>
</svg>`;

// Maskable: full-bleed nero, contenuto entro la safe-zone centrale.
const maskable = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#000000"/>
  <g transform="translate(256 256) scale(0.8) translate(-256 -256)">
    <path d="${C_ARC}" fill="none" stroke="#ffffff" stroke-width="46" stroke-linecap="round"/>
    <circle cx="356" cy="170" r="26" fill="#ff3b30"/>
  </g>
</svg>`;

const jobs = [
  { svg: rounded(96), size: 192, file: 'pwa-192.png' },
  { svg: rounded(96), size: 512, file: 'pwa-512.png' },
  { svg: maskable, size: 512, file: 'maskable-512.png' },
  { svg: maskable, size: 180, file: 'apple-touch-icon.png' },
];

for (const { svg, size, file } of jobs) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(out, file));
  console.log('generato', file, size + 'px');
}
