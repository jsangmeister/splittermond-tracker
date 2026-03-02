import { vi } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const TEST_CHAR_PATH = path.resolve(process.cwd(), 'projects', 'splittermond-tracker', 'src', 'test', 'data', 'test-character.xml');

export function mockElectron(): void {
  vi.stubGlobal('electron', { storage: { set: vi.fn(), get: () => null }, getCharacters: () => Promise.resolve([{ path: '/path/to/char', content: readFileSync(TEST_CHAR_PATH, 'utf-8') }]) });
}
