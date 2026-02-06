export enum StoreKey {
  BASE_CHARACTER_PATH = 'base-character-path',
  LAST_CHARACTERS = 'last-characters-metadata',
}

export interface CharacterMetadata {
  type: 'character';
  id: string;
  selected?: boolean;
}

export interface StoreValueTypes {
  [StoreKey.BASE_CHARACTER_PATH]?: string;
  [StoreKey.LAST_CHARACTERS]?: CharacterMetadata[];
}
