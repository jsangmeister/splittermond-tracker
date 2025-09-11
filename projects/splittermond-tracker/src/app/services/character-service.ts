import { Injectable } from '@angular/core';
import { Char, UsageData } from '../models/char';

/**
 * Service to handle character-related operations like parsing XML character sheets
 * and saving/loading character state.
 */
@Injectable({
  providedIn: 'root'
})
export class CharacterService {
  private store = window.electron.storage;

  /**
   * Save the current state of a character.
   */
  async saveCharacterUsage(char: Char): Promise<void> {
    try {
      await this.store.set(`character:${char.name}`, char.getUsageData());
    } catch (error) {
      console.error('Error saving character state:', error);
      throw new Error(`Failed to save character state: ${(error as Error).message}`);
    }
  }
  
  /**
   * Load the saved state of a character.
   */
  async loadCharacterUsage(name: string): Promise<UsageData | undefined> {
    try {
      return this.store.get(`character:${name}`) as UsageData | undefined;
    } catch (error) {
      console.error('Error loading character state:', error);
      throw new Error(`Failed to load character state: ${(error as Error).message}`);
    }
  }
} 