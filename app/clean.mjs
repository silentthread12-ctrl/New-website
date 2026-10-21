// Remove old built assets from the repo root before a new build,
// so renamed files do not pile up.
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const assets = fileURLToPath(new URL('../assets', import.meta.url));
rmSync(assets, { recursive: true, force: true });
