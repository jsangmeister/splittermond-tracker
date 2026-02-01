export enum StoreKey {
  BASE_CHARACTER_PATH = 'base-character-path',
  LAST_CHARACTERS = 'last-character-paths',
}

export interface StoreValueTypes {
  [StoreKey.BASE_CHARACTER_PATH]: string | undefined;
  [StoreKey.LAST_CHARACTERS]: string[] | undefined;
}
