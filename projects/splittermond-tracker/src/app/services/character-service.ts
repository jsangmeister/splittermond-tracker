import { Injectable } from '@angular/core';
import { Char, USAGE_FIELDS, UsageData } from '../models/char';

/**
 * Service to handle character-related operations like parsing XML character sheets
 * and saving/loading character state.
 */
@Injectable({
  providedIn: 'root',
})
export class CharacterService {
  private store = window.electron.storage;

  public async createChar(xml: any): Promise<Char | undefined> {
    if (!xml) return;
    const char = new Char();
    const characterData = xml.splimochar;

    // Set basic properties
    char.race = characterData.$.race ?? '';
    const ep = parseInt(characterData.$.expinv ?? '0');

    // Calculate level based on experience points
    if (ep < 100) {
      char.level = 1;
    } else if (ep < 300) {
      char.level = 2;
    } else if (ep < 600) {
      char.level = 3;
    } else {
      char.level = 4;
    }

    // Set character name
    if (characterData.name) {
      char.name = characterData.name;
    }

    // Set powerrefs (special abilities)
    if (characterData.powerrefs) {
      for (const power of characterData.powerrefs.powerref) {
        if (power.$.ref === 'addsplinter') {
          char.additional_splinters = 2 * parseInt(power.$.count);
        } else if (power.$.ref === 'focuspool') {
          char.additional_focus = 5 * parseInt(power.$.count);
        } else if (power.$.ref === 'sturdy') {
          char.additional_lp = parseInt(power.$.count);
        } else if (power.$.ref === 'focusregen') {
          char.additional_focus_regeneration = parseInt(power.$.count);
        } else if (power.$.ref === 'liferegen') {
          char.additional_lp_regeneration = parseInt(power.$.count);
        }
      }
    }

    // Set attributes
    if (characterData.attributes) {
      for (const attr of characterData.attributes.attr) {
        const attrId = attr.$.id.toLowerCase();
        if (char.hasOwnProperty(attrId)) {
          (char as any)[attrId] = parseInt(attr.$.value);
        }
      }
    }

    // Set skills
    if (characterData.skillvals) {
      for (const skill of characterData.skillvals.skillval) {
        const skillId = '_' + skill.$.skill;
        if (char.hasOwnProperty(skillId)) {
          (char as any)[skillId] = parseInt(skill.$.val ?? '0');
        }
      }
    }

    const data = await this.loadCharacterUsage(char.name);
    if (data) {
      for (const field of USAGE_FIELDS) {
        if (data[field] !== undefined) {
          char[field] = data[field];
        }
      }
    }

    const _this = this;
    const proxy = new Proxy(char, {
      set(target, p, newValue): boolean {
        const res = Reflect.set(target, p, newValue);
        void _this.saveCharacterUsage(target);
        return res;
      },
    });
    return proxy;
  }

  /**
   * Save the current state of a character.
   */
  private async saveCharacterUsage(char: Char): Promise<void> {
    try {
      await this.store.set(`character:${char.name}`, char.getUsageData());
    } catch (error) {
      console.error('Error saving character state:', error);
      throw new Error(
        `Failed to save character state: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Load the saved state of a character.
   */
  private loadCharacterUsage(name: string): Promise<UsageData | undefined> {
    try {
      return this.store.get(`character:${name}`);
    } catch (error) {
      console.error('Error loading character state:', error);
      throw new Error(
        `Failed to load character state: ${(error as Error).message}`,
      );
    }
  }
}
