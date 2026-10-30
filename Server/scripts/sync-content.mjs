import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const source = new URL('../content/story.json', import.meta.url);
const folder = new URL('../src/content/', import.meta.url);
const clientFolder = new URL('../../Client/src/content/', import.meta.url);
if (process.argv.includes('--check')) {
  const canonical = JSON.stringify(JSON.parse(readFileSync(source, 'utf8')));
  for (const target of [
    new URL('story.json', folder),
    new URL('story.json', clientFolder),
  ]) {
    if (JSON.stringify(JSON.parse(readFileSync(target, 'utf8'))) !== canonical)
      throw new Error(
        'Story seeds are out of sync. Run npm run content:sync in Server.',
      );
  }
  console.log('Client and Server story seeds match the canonical content.');
  process.exit(0);
}
mkdirSync(folder, { recursive: true });
copyFileSync(source, new URL('story.json', folder));
mkdirSync(clientFolder, { recursive: true });
copyFileSync(source, new URL('story.json', clientFolder));
console.log(`Story content synced to ${fileURLToPath(folder)}`);
