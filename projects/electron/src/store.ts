import Store from 'electron-store';
import { StoreValueTypes } from '../../shared/store-keys';

type StoreType = StoreValueTypes & Record<string, any>;

export const store = new Store<StoreType>();
