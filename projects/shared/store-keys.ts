import { TextMode } from './text-mode';

export enum StoreKey {
  BASE_CHARACTER_PATH = 'base-character-path',
  LAST_CHARACTERS = 'last-characters-metadata',
  LAST_TEXT_MODE = TextMode.Source,
}

export interface CharacterMetadata {
  type: 'character';
  id: string;
  selected?: boolean;
}

export interface StoreValueTypes {
  [StoreKey.BASE_CHARACTER_PATH]?: string;
  [StoreKey.LAST_CHARACTERS]?: CharacterMetadata[];
  [StoreKey.LAST_TEXT_MODE]?: TextMode;
}
