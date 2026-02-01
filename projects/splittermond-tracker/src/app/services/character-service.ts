import {
  computed,
  effect,
  Injectable,
  linkedSignal,
  resource,
} from '@angular/core';
import { ChangeData, Char, USAGE_FIELDS, UsageData } from '../models/char';
import { Subject } from 'rxjs';
import * as xml2js from 'xml2js';
import { StoreKey } from '../../../../shared/store-keys';

type UsageDataWithNote = UsageData & { note?: string };

const RACE_LABELS = {
  dwarf: 'Zwerg',
  alben: 'Alb',
  human: 'Mensch',
  gnome: 'Gnom',
  varg: 'Varg',
};

/**
 * Service to handle character-related operations like parsing XML character sheets
 * and saving/loading character state.
 */
@Injectable({
  providedIn: 'root',
})
export class CharacterService {
  public readonly allCharacters = resource({
    loader: () =>
      window.electron
        .getCharacters()
        .then(async (res) =>
          (
            await Promise.all(
              res.map(
                async ({ path, content }) =>
                  await this.loadCharacter(content, path),
              ),
            )
          ).filter((c) => c !== undefined),
        ),
    defaultValue: [],
  });

  public readonly lastOpenedCharacters = resource({
    loader: () =>
      window.electron.storage
        .get(StoreKey.LAST_CHARACTERS)
        .then((data) => data ?? []),
    defaultValue: [],
  });

  public readonly openedCharacters = linkedSignal(() =>
    this.allCharacters
      .value()
      .filter((char) => this.lastOpenedCharacters.value().includes(char.path)),
  );

  public readonly notOpenedCharacters = computed(() =>
    this.allCharacters
      .value()
      .filter((char) => !this.openedCharacters().includes(char)),
  );

  private readonly store = window.electron.storage;

  private readonly parser = new xml2js.Parser({ explicitArray: false });

  private readonly _onChange$ = new Subject<ChangeData>();

  public constructor() {
    effect(() => {
      void window.electron.storage.set(
        StoreKey.LAST_CHARACTERS,
        this.openedCharacters().map((c) => c.path),
      );
    });
  }

  public closeCharacter(char: Char): void {
    this.openedCharacters.update((chars) => chars.filter((c) => c !== char));
  }

  private async loadCharacter(
    xmlContent: string,
    path: string,
  ): Promise<Char | undefined> {
    const result = await this.parser.parseStringPromise(xmlContent);
    let char = undefined;
    try {
      char = await this.createChar(result, path);
    } catch (e: any) {
      console.error(
        `Failed to parse character file at path: ${path} (Reason: ${e.message})`,
      );
    }
    if (!char) {
      console.error('Failed to create character from path:', path);
    }
    return char;
  }

  private async createChar(xml: any, path: string): Promise<Char | undefined> {
    if (!xml) return;
    const char = new Char();
    char.path = path;
    const characterData = xml.splimochar;

    // Set basic properties
    char.race = RACE_LABELS[characterData.$.race as keyof typeof RACE_LABELS];
    char.spentExp = parseInt(characterData.$.expinv ?? '0');
    const freeExp = parseInt(characterData.$.expfree ?? '0');
    char.totalExp = char.spentExp + freeExp;

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
      char.note = data.note ?? '';
    }

    char.onChange$.subscribe(this._onChange$);

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
    const data: UsageDataWithNote = char.getUsageData();
    data.note = char.note;
    try {
      await this.store.set(`character:${char.name}`, data);
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
  private loadCharacterUsage(
    name: string,
  ): Promise<UsageDataWithNote | undefined> {
    try {
      return this.store.get(`character:${name}`) as Promise<
        UsageDataWithNote | undefined
      >;
    } catch (error) {
      console.error('Error loading character state:', error);
      throw new Error(
        `Failed to load character state: ${(error as Error).message}`,
      );
    }
  }
}
