import Store from 'electron-store';

export enum StoreKey {
  LAST_CHARACTER_PATH = 'last-character-path',
}

export type StoreType = Record<StoreKey, string> & Record<string, any>;

export const store = new Store<StoreType>();
