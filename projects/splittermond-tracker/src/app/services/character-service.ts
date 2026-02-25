import {
  computed,
  effect,
  inject,
  Injectable,
  Injector,
  linkedSignal,
  resource,
  ResourceRef,
  Signal,
  WritableSignal,
} from '@angular/core';
import * as xml2js from 'xml2js';

import { CharacterMetadata, StoreKey } from '../../../../shared/store-keys';
import { Char, RACE_LABELS, USAGE_FIELDS, UsageData } from '../models/char';
import { KeysOfValue } from '../utils/types';

type UsageDataWithNote = UsageData & { note?: string };

type NumberSignalCharAttribute = KeysOfValue<Char, WritableSignal<number>>;

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

  private readonly injector = inject(Injector);

  private readonly store = window.electron.storage;

  private readonly parser = new xml2js.Parser({ explicitArray: false });

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
            (metadata) => metadata.id === char.path(),
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
        id: char.path(),
        selected: true,
      }),
    );
  }

  public closeCharacter(char: Char): void {
    this.openedCharactersMetadata.update((chars) =>
      chars.filter((c) => c.id !== char.path()),
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
    char.path.set(path);
    const characterData = xml.splimochar;

    // Set basic properties
    char.race.set(characterData.$.race as keyof typeof RACE_LABELS);
    char.spentExp.set(parseInt(characterData.$.expinv ?? '0'));
    const freeExp = parseInt(characterData.$.expfree ?? '0');
    char.totalExp.set(char.spentExp() + freeExp);

    // Set character name
    if (characterData.name) {
      char.name.set(characterData.name);
    }

    // Set powerrefs (special abilities)
    if (characterData.powerrefs) {
      for (const power of characterData.powerrefs.powerref) {
        if (power.$.ref === 'addsplinter') {
          char.additional_splinters.set(2 * parseInt(power.$.count));
        } else if (power.$.ref === 'focuspool') {
          char.additional_focus.set(5 * parseInt(power.$.count));
        } else if (power.$.ref === 'sturdy') {
          char.additional_lp.set(parseInt(power.$.count));
        } else if (power.$.ref === 'focusregen') {
          char.additional_focus_regeneration.set(parseInt(power.$.count));
        } else if (power.$.ref === 'liferegen') {
          char.additional_lp_regeneration.set(parseInt(power.$.count));
        }
      }
    }

    // Set attributes
    if (characterData.attributes) {
      for (const attr of characterData.attributes.attr) {
        const attrId = attr.$.id.toLowerCase();
        if (char.hasOwnProperty(attrId)) {
          char[attrId as NumberSignalCharAttribute].set(parseInt(attr.$.value));
        }
      }
    }

    // Set skills
    if (characterData.skillvals) {
      for (const skill of characterData.skillvals.skillval) {
        const skillId = '_' + skill.$.skill;
        if (char.hasOwnProperty(skillId)) {
          char[skillId as NumberSignalCharAttribute].set(
            parseInt(skill.$.val ?? '0'),
          );
        }
      }
    }

    const data = await this.loadCharacterUsage(char.name());
    if (data) {
      for (const field of USAGE_FIELDS) {
        if (data[field] !== undefined) {
          char[field].set(data[field]);
        }
      }
      char.note.set(data.note ?? '');
    }

    // save usage data on every update
    effect(
      () => {
        void this.saveCharacterUsage(char);
      },
      { injector: this.injector },
    );

    return char;
  }

  /**
   * Save the current state of a character.
   */
  private async saveCharacterUsage(char: Char): Promise<void> {
    const data: UsageDataWithNote = char.getUsageData();
    data.note = char.note();
    try {
      await this.store.set(`character:${char.name()}`, data);
    } catch (error) {
      console.error('Error saving character state:', error);
      throw new Error(`Failed to save character state.`, {
        cause: error,
      });
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
      throw new Error(`Failed to load character state.`, {
        cause: error,
      });
    }
  }
}
