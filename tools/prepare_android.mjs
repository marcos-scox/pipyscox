import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webDir = path.join(root, 'www');

await rm(webDir, { recursive: true, force: true });
await mkdir(webDir, { recursive: true });
await cp(path.join(root, 'index.html'), path.join(webDir, 'index.html'));
await cp(path.join(root, 'assets'), path.join(webDir, 'assets'), { recursive: true });
await build({
  absWorkingDir: root,
  entryPoints: ['tools/android-download-bridge.js'],
  outfile: 'www/assets/js/mobile-download-bridge.js',
  bundle: true,
  minify: true,
  platform: 'browser',
  format: 'iife',
  target: ['es2020'],
});

const indexPath = path.join(webDir, 'index.html');
const html = await readFile(indexPath, 'utf8');
const injection = '  <script src="assets/js/mobile-download-bridge.js"></script>\n';
if (!html.includes('</body>')) throw new Error('index.html não contém </body>');
await writeFile(indexPath, html.replace('</body>', `${injection}</body>`));
console.log(`App Android preparado em ${webDir}`);
