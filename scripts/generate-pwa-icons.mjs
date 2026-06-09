import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const icons = [
  {
    source: 'public/icons/app-icon-192.svg',
    output: 'public/icons/app-icon-192.png',
    size: 192,
  },
  {
    source: 'public/icons/app-icon-512.svg',
    output: 'public/icons/app-icon-512.png',
    size: 512,
  },
  {
    source: 'public/icons/app-icon-maskable.svg',
    output: 'public/icons/app-icon-maskable.png',
    size: 512,
  },
];

await Promise.all(
  icons.map(async ({ source, output, size }) => {
    const sourcePath = path.join(root, source);
    const outputPath = path.join(root, output);

    await mkdir(path.dirname(outputPath), { recursive: true });
    await sharp(sourcePath).resize(size, size).png().toFile(outputPath);
    console.log(`Generated ${output} (${size}x${size})`);
  }),
);
