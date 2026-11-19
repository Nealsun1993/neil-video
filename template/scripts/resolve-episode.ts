import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {prepareEpisode} from '../src/kit/timing';
const name = process.argv[2];
try {
  const ep = JSON.parse(readFileSync(resolve('public/episodes', name, 'episode.json'), 'utf8'));
  process.stdout.write(JSON.stringify(prepareEpisode(ep)));
} catch (e) { console.error(String(e)); process.exitCode = 1; }
