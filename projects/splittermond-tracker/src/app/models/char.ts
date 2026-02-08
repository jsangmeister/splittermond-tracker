import { computed, Signal, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { CHAR_SHORT_LABELS } from '../utils/char-short-labels';
import { KeysOfValue } from '../utils/types';

interface CharSignalPart {
  label: string;
  value: Signal<number>;
  modifier: '+' | '-';
}

export interface CharSignal extends Signal<number> {
  parts: Signal<CharSignalPart[]>;
}

const RACE_SIZES = {
  gnome: 3,
  dwarf: 4,
  alben: 5,
  human: 5,
  varg: 6,
};

export const RACE_LABELS = {
  dwarf: 'Zwerg',
  alben: 'Alb',
  human: 'Mensch',
  gnome: 'Gnom',
  varg: 'Varg',
};

export const USAGE_FIELDS = [
  'channeled_focus',
  'exhausted_focus',
  'consumed_focus',
  'channeled_lp',
  'exhausted_lp',
  'consumed_lp',
  'channeled_splinters',
  'exhausted_splinters',
  'consumed_splinters',
] as const;

export const GENERAL_SKILLS = [
  'acrobatics',
  'alchemy',
  'leadership',
  'arcanelore',
  'athletics',
  'performance',
  'diplomacy',
  'clscraft',
  'empathy',
  'determination',
  'dexterity',
  'history',
  'craftmanship',
  'heal',
  'stealth',
  'hunting',
  'countrylore',
  'nature',
  'eloquence',
  'locksntraps',
  'swim',
  'seafaring',
  'streetlore',
  'animals',
  'survival',
  'perception',
  'endurance',
] as const;

export const MAGIC_SCHOOLS = [
  'antimagic',
  'controlmagic',
  'motionmagic',
  'insightmagic',
  'stonemagic',
  'firemagic',
  'healmagic',
  'illusionmagic',
  'combatmagic',
  'lightmagic',
  'naturemagic',
  'shadowmagic',
  'fatemagic',
  'protectionmagic',
  'enhancemagic',
  'deathmagic',
  'transformationmagic',
  'watermagic',
  'windmagic',
] as const;

export type GeneralSkillKey = (typeof GENERAL_SKILLS)[number];

export type MagicSchoolKey = (typeof MAGIC_SCHOOLS)[number];

export type SkillKey = GeneralSkillKey | MagicSchoolKey;

export type UsageType = 'channeled' | 'exhausted' | 'consumed';

export type FullUsageData = Record<(typeof USAGE_FIELDS)[number], number>;

export type UsageData = Partial<FullUsageData>;

export enum Action {
  SPEND_LP = 1,
  RESTORE_LP,
  SPEND_FOCUS,
  RESTORE_FOCUS,
  SPEND_SPLINTERS,
  RESTORE_SPLINTERS,
  CONVERT_CHANNELED,
  SHORT_REST,
  LONG_REST,
  RESET,
  HISTORY,
}

export interface ChangeData {
  char: Char;
  before: FullUsageData;
  after: UsageData;
  action: Action;
  info?: string;
}

export class Char {
  // Observables
  private _onChange$ = new Subject<ChangeData>();
  public onChange$: Observable<ChangeData> = this._onChange$;

  // Character basic info
  public readonly name = signal('');
  public readonly race = signal<keyof typeof RACE_SIZES>('human');
  public readonly spentExp = signal(0);
  public readonly totalExp = signal(0);
  public readonly path = signal('');

  // Attributes
  public readonly charisma = signal(0);
  public readonly agility = signal(0);
  public readonly intuition = signal(0);
  public readonly constitution = signal(0);
  public readonly mystic = signal(0);
  public readonly strength = signal(0);
  public readonly mind = signal(0);
  public readonly willpower = signal(0);

  // Additional values
  public readonly additional_splinters = signal(0);
  public readonly additional_lp = signal(0);
  public readonly additional_focus = signal(0);
  public readonly additional_lp_regeneration = signal(0);
  public readonly additional_focus_regeneration = signal(0);

  // Usage tracking
  public readonly channeled_focus = signal(0);
  public readonly exhausted_focus = signal(0);
  public readonly consumed_focus = signal(0);

  public readonly channeled_lp = signal(0);
  public readonly exhausted_lp = signal(0);
  public readonly consumed_lp = signal(0);

  public readonly channeled_splinters = signal(0);
  public readonly exhausted_splinters = signal(0);
  public readonly consumed_splinters = signal(0);

  public readonly note = signal('');

  // Skills - general
  private readonly _acrobatics = signal(0);
  private readonly _alchemy = signal(0);
  private readonly _leadership = signal(0);
  private readonly _arcanelore = signal(0);
  private readonly _athletics = signal(0);
  private readonly _performance = signal(0);
  private readonly _diplomacy = signal(0);
  private readonly _clscraft = signal(0);
  private readonly _empathy = signal(0);
  private readonly _determination = signal(0);
  private readonly _dexterity = signal(0);
  private readonly _history = signal(0);
  private readonly _craftmanship = signal(0);
  private readonly _heal = signal(0);
  private readonly _stealth = signal(0);
  private readonly _hunting = signal(0);
  private readonly _countrylore = signal(0);
  private readonly _nature = signal(0);
  private readonly _eloquence = signal(0);
  private readonly _locksntraps = signal(0);
  private readonly _swim = signal(0);
  private readonly _seafaring = signal(0);
  private readonly _streetlore = signal(0);
  private readonly _animals = signal(0);
  private readonly _survival = signal(0);
  private readonly _perception = signal(0);
  private readonly _endurance = signal(0);

  // Skills - magic
  private readonly _antimagic = signal(0);
  private readonly _controlmagic = signal(0);
  private readonly _motionmagic = signal(0);
  private readonly _insightmagic = signal(0);
  private readonly _stonemagic = signal(0);
  private readonly _firemagic = signal(0);
  private readonly _healmagic = signal(0);
  private readonly _illusionmagic = signal(0);
  private readonly _combatmagic = signal(0);
  private readonly _lightmagic = signal(0);
  private readonly _naturemagic = signal(0);
  private readonly _shadowmagic = signal(0);
  private readonly _fatemagic = signal(0);
  private readonly _protectionmagic = signal(0);
  private readonly _enhancemagic = signal(0);
  private readonly _deathmagic = signal(0);
  private readonly _transformationmagic = signal(0);
  private readonly _watermagic = signal(0);
  private readonly _windmagic = signal(0);

  public readonly size_class = computed(() => RACE_SIZES[this.race()]);

  public readonly stealthModifier = computed(() => 5 - this.size_class());

  public readonly raceLabel = computed(() => RACE_LABELS[this.race()]);

  public readonly level = computed(() => {
    if (this.spentExp() < 100) {
      return 1;
    } else if (this.spentExp() < 300) {
      return 2;
    } else if (this.spentExp() < 600) {
      return 3;
    } else {
      return 4;
    }
  });

  // BASE VALUES
  public readonly speed = computed(
    () => this.size_class() + this.agility() - this.wounded_deduction(),
  );

  public readonly initiative = computed(
    () => 10 - this.intuition() + this.wounded_deduction(),
  );

  public readonly lp = computed(
    () => this.size_class() + this.constitution() + this.additional_lp(),
  );

  public readonly max_lp = computed(() => this.lp() * 5);

  public readonly used_lp = computed(
    () => this.channeled_lp() + this.exhausted_lp() + this.consumed_lp(),
  );

  public readonly free_lp = computed(() => this.max_lp() - this.used_lp());

  public readonly lp_regeneration = computed(() =>
    Math.max(1, this.constitution() * (2 + this.additional_lp_regeneration())),
  );

  public readonly wounded_level = computed(() =>
    Math.floor(this.consumed_lp() / this.lp()),
  );

  public readonly wounded_deduction = computed(() =>
    Math.floor(Math.pow(2, this.wounded_level() - 1)),
  );

  public readonly max_focus = computed(
    () => 2 * (this.mystic() + this.willpower()) + this.additional_focus(),
  );

  public readonly used_focus = computed(
    () =>
      this.channeled_focus() + this.exhausted_focus() + this.consumed_focus(),
  );

  public readonly free_focus = computed(
    () => this.max_focus() - this.used_focus(),
  );

  public readonly focus_regeneration = computed(() =>
    Math.max(1, this.willpower() * (2 + this.additional_focus_regeneration())),
  );

  public readonly max_splinters = computed(
    () => 3 + this.additional_splinters() + this.level() - 1,
  );

  public readonly used_splinters = computed(
    () =>
      this.channeled_splinters() +
      this.exhausted_splinters() +
      this.consumed_splinters(),
  );

  public readonly free_splinters = computed(
    () => this.max_splinters() - this.used_splinters(),
  );

  public readonly defense = computed(
    () =>
      12 +
      this.agility() +
      this.strength() +
      2 * (5 - this.size_class()) +
      2 * (this.level() - 1),
  );

  public readonly mental_resistance = computed(
    () => 12 + this.mind() + this.willpower() + 2 * (this.level() - 1),
  );

  public readonly physical_resistance = computed(
    () => 12 + this.constitution() + this.willpower() + 2 * (this.level() - 1),
  );

  // SKILLS - GENERAL
  public readonly acrobatics = this.charComputed(
    'agility',
    'strength',
    '_acrobatics',
  );

  public readonly alchemy = this.charComputed('mystic', 'mind', '_alchemy');

  public readonly leadership = this.charComputed(
    'charisma',
    'willpower',
    '_leadership',
  );

  public readonly arcanelore = this.charComputed(
    'mystic',
    'mind',
    '_arcanelore',
  );

  public readonly athletics = this.charComputed(
    'agility',
    'strength',
    '_athletics',
  );

  public readonly performance = this.charComputed(
    'charisma',
    'willpower',
    '_performance',
  );

  public readonly diplomacy = this.charComputed(
    'charisma',
    'mind',
    '_diplomacy',
  );

  public readonly clscraft = this.charComputed(
    'intuition',
    'mind',
    '_clscraft',
  );

  public readonly empathy = this.charComputed('intuition', 'mind', '_empathy');

  public readonly determination = this.charComputed(
    'charisma',
    'willpower',
    '_determination',
  );

  public readonly dexterity = this.charComputed(
    'charisma',
    'agility',
    '_dexterity',
  );

  public readonly history = this.charComputed('mystic', 'mind', '_history');

  public readonly craftmanship = this.charComputed(
    'constitution',
    'mind',
    '_craftmanship',
  );

  public readonly heal = this.charComputed('intuition', 'mind', '_heal');

  public readonly stealth = this.charComputed(
    'agility',
    'intuition',
    '_stealth',
    'stealthModifier',
  );

  public readonly hunting = this.charComputed(
    'constitution',
    'mind',
    '_hunting',
  );

  public readonly countrylore = this.charComputed(
    'intuition',
    'mind',
    '_countrylore',
  );

  public readonly nature = this.charComputed('intuition', 'mind', '_nature');

  public readonly eloquence = this.charComputed(
    'charisma',
    'willpower',
    '_eloquence',
  );

  public readonly locksntraps = this.charComputed(
    'intuition',
    'agility',
    '_locksntraps',
  );

  public readonly swim = this.charComputed('constitution', 'strength', '_swim');

  public readonly seafaring = this.charComputed(
    'agility',
    'constitution',
    '_seafaring',
  );

  public readonly streetlore = this.charComputed(
    'charisma',
    'intuition',
    '_streetlore',
  );

  public readonly animals = this.charComputed(
    'charisma',
    'agility',
    '_animals',
  );

  public readonly survival = this.charComputed(
    'intuition',
    'constitution',
    '_survival',
  );

  public readonly perception = this.charComputed(
    'intuition',
    'willpower',
    '_perception',
  );

  public readonly endurance = this.charComputed(
    'constitution',
    'willpower',
    '_endurance',
  );

  // SKILLS - MAGIC
  public readonly antimagic = this.charComputed(
    'mystic',
    'willpower',
    '_antimagic',
  );

  public readonly controlmagic = this.charComputed(
    'mystic',
    'willpower',
    '_controlmagic',
  );

  public readonly motionmagic = this.charComputed(
    'mystic',
    'agility',
    '_motionmagic',
  );

  public readonly insightmagic = this.charComputed(
    'mystic',
    'mind',
    '_insightmagic',
  );

  public readonly stonemagic = this.charComputed(
    'mystic',
    'constitution',
    '_stonemagic',
  );

  public readonly firemagic = this.charComputed(
    'mystic',
    'charisma',
    '_firemagic',
  );

  public readonly healmagic = this.charComputed(
    'mystic',
    'charisma',
    '_healmagic',
  );

  public readonly illusionmagic = this.charComputed(
    'mystic',
    'charisma',
    '_illusionmagic',
  );

  public readonly combatmagic = this.charComputed(
    'mystic',
    'strength',
    '_combatmagic',
  );

  public readonly lightmagic = this.charComputed(
    'mystic',
    'charisma',
    '_lightmagic',
  );

  public readonly naturemagic = this.charComputed(
    'mystic',
    'charisma',
    '_naturemagic',
  );

  public readonly shadowmagic = this.charComputed(
    'mystic',
    'intuition',
    '_shadowmagic',
  );

  public readonly fatemagic = this.charComputed(
    'mystic',
    'charisma',
    '_fatemagic',
  );

  public readonly protectionmagic = this.charComputed(
    'mystic',
    'charisma',
    '_protectionmagic',
  );

  public readonly enhancemagic = this.charComputed(
    'mystic',
    'strength',
    '_enhancemagic',
  );

  public readonly deathmagic = this.charComputed(
    'mystic',
    'mind',
    '_deathmagic',
  );

  public readonly transformationmagic = this.charComputed(
    'mystic',
    'constitution',
    '_transformationmagic',
  );

  public readonly watermagic = this.charComputed(
    'mystic',
    'intuition',
    '_watermagic',
  );

  public readonly windmagic = this.charComputed('mystic', 'mind', '_windmagic');

  public update(update: UsageData, action: Action, info?: string): void {
    const before = this.getUsageData();
    for (const [field, value] of Object.entries(update)) {
      this[field as keyof UsageData].set(value);
    }
    if (action !== Action.HISTORY) {
      this._onChange$.next({
        char: this,
        before,
        after: update,
        action,
        info,
      });
    }
  }

  // Get usage data for saving
  public getUsageData(): FullUsageData {
    const data: UsageData = {};
    for (const field of USAGE_FIELDS) {
      data[field] = this[field]();
    }
    return data as FullUsageData;
  }

  public resetUsageData(): void {
    const update: UsageData = {};
    for (const field of USAGE_FIELDS) {
      update[field] = 0;
    }
    this.update(update, Action.RESET);
  }

  public shortRest(): void {
    const update: UsageData = {};
    for (const type of ['lp', 'focus'] as const) {
      update[`exhausted_${type}`] = 0;
    }
    this.update(update, Action.SHORT_REST);
  }

  public longRest(): void {
    const update: UsageData = {};
    for (const type of ['lp', 'focus'] as const) {
      update[`exhausted_${type}`] = update[`channeled_${type}`] = 0;
      update[`consumed_${type}`] =
        this[`consumed_${type}`]() -
        Math.min(this[`consumed_${type}`](), this[`${type}_regeneration`]());
    }
    this.update(update, Action.LONG_REST);
  }

  private charComputed(
    ...parts: (KeysOfValue<Char, Signal<number>> | `_${SkillKey}`)[]
  ): CharSignal {
    const c = computed(
      () =>
        parts.reduce((sum, part) => sum + this[part](), 0) -
        this.wounded_deduction(),
    ) as CharSignal;
    c.parts = computed(() =>
      parts
        .map(
          (part): CharSignalPart => ({
            label:
              CHAR_SHORT_LABELS[part.replace('_', '') as keyof Char] ??
              'MISSING_LABEL',
            value: this[part],
            modifier: '+',
          }),
        )
        .concat([
          {
            label: 'Wundabz.',
            value: this.wounded_deduction,
            modifier: '-',
          },
        ]),
    );
    return c;
  }
}
