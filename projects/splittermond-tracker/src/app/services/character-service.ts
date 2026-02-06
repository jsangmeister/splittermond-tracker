import {
  computed,
  effect,
  Injectable,
  linkedSignal,
  resource,
  ResourceRef,
  Signal,
  WritableSignal,
} from '@angular/core';
import { Subject } from 'rxjs';
import * as xml2js from 'xml2js';

import { CharacterMetadata, StoreKey } from '../../../../shared/store-keys';
import {
  ChangeData,
  Char,
  RACE_LABELS,
  USAGE_FIELDS,
  UsageData,
} from '../models/char';

type UsageDataWithNote = UsageData & { note?: string };

/**
 * Service to handle character-related operations like parsing XML character sheets
 * and saving/loading character state.
 */
@Injectable({
  providedIn: 'root',
})
export class CharacterService {
  public readonly openedCharacters: Signal<Char[]>;
  public readonly notOpenedCharacters: Signal<Char[]>;
  public readonly selectedCharacterIndex: WritableSignal<number>;

  protected readonly allCharacters: ResourceRef<Char[]>;
  protected readonly openedCharactersMetadata: WritableSignal<
    CharacterMetadata[]
  >;

  private readonly store = window.electron.storage;

  private readonly parser = new xml2js.Parser({ explicitArray: false });

  private readonly _onChange$ = new Subject<ChangeData>();

  public constructor() {
    this.allCharacters = resource({
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

    const initiallyOpenedCharacters = resource({
      loader: () =>
        window.electron.storage
          .get(StoreKey.LAST_CHARACTERS)
          .then((data) => data ?? []),
      defaultValue: [],
    });

    this.openedCharactersMetadata = linkedSignal(() =>
      initiallyOpenedCharacters.value(),
    );
    this.selectedCharacterIndex = linkedSignal(() =>
      this.openedCharactersMetadata().findIndex(
        (metadata) => metadata.selected,
      ),
    );
    this.openedCharacters = linkedSignal(() =>
      this.allCharacters
        .value()
        .filter((char) =>
          this.openedCharactersMetadata().find(
            (metadata) => metadata.id === char.path,
          ),
        ),
    );
    this.notOpenedCharacters = computed(() =>
      this.allCharacters
        .value()
        .filter((char) => !this.openedCharacters().includes(char)),
    );

    effect(() => {
      this.openedCharactersMetadata.update((chars) =>
        chars.map((c, i) => ({
          ...c,
          selected: i === this.selectedCharacterIndex(),
        })),
      );
      this.saveCharacterMetadata(); // nested effects do not trigger
    });

    // save metadata whenever it changes
    effect(() => {
      this.saveCharacterMetadata();
    });
  }

  public reloadCharacters(): void {
    this.allCharacters.reload();
  }

  public openCharacter(char: Char): void {
    this.openedCharactersMetadata.update((chars) =>
      chars.concat({
        type: 'character',
        id: char.path,
        selected: true,
      }),
    );
  }

  public closeCharacter(char: Char): void {
    this.openedCharactersMetadata.update((chars) =>
      chars.filter((c) => c.id !== char.path),
    );
  }

  private saveCharacterMetadata(): void {
    void window.electron.storage.set(
      StoreKey.LAST_CHARACTERS,
      this.openedCharactersMetadata(),
    );
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
    char.race = characterData.$.race as keyof typeof RACE_LABELS;
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
      char.note.set(data.note ?? '');
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
    data.note = char.note();
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
