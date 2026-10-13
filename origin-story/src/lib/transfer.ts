import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Platform, Share } from 'react-native';
import { migrate, type Hero } from '../engine/hero';

// Same envelope as the Origin Story web builder, so files move both ways.
export const APP_ID = 'origin-story-scrpg';

export const slug = (s: string) => (s || 'hero').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'hero';

export function heroJSON(h: Hero) {
  return JSON.stringify({ app: APP_ID, v: 1, hero: h }, null, 2);
}
export function allHeroesJSON(heroes: Record<string, Hero>) {
  return JSON.stringify({ app: APP_ID, v: 1, heroes }, null, 2);
}

/** Save a JSON file on web; on a phone, open the share sheet with the JSON text. */
export async function shareJSON(filename: string, text: string) {
  if (Platform.OS === 'web') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
    return;
  }
  await Share.share({ title: filename, message: text });
}

export async function copyText(text: string) {
  await Clipboard.setStringAsync(text);
}
export async function pasteText() {
  return Clipboard.getStringAsync();
}

/** Parse a single-hero or all-heroes export. Throws a readable error on bad input. */
export function parseHeroes(text: string): Hero[] {
  let j: any;
  try {
    j = JSON.parse(text);
  } catch {
    throw new Error("That isn't valid JSON.");
  }
  const list = j && j.heroes ? Object.values(j.heroes) : [j && (j.hero || j)];
  const out = (list as any[]).filter((raw) => raw && raw.info).map((raw) => migrate(raw));
  if (!out.length) throw new Error('No hero found in that file.');
  return out;
}

export async function pickHeroFile(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  if (Platform.OS === 'web' && asset.file) return asset.file.text();
  return new File(asset.uri).text();
}
