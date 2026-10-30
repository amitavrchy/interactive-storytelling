import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const source = new URL('../Shared/story.json', import.meta.url);
const folder = new URL('../Server/src/content/', import.meta.url);
mkdirSync(folder, { recursive: true });
copyFileSync(source, new URL('story.json', folder));
console.log(`Story content synced to ${fileURLToPath(folder)}`);
