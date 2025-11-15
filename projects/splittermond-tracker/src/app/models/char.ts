import { Observable, Subject } from 'rxjs';

const RACE_SIZES: Record<string, number> = {
  gnome: 3,
  dwarf: 4,
  alben: 5,
  human: 5,
  varg: 6,
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
  public name = '';
  public race = '';
  public level = 1;

  // Attributes
  public charisma = 0;
  public agility = 0;
  public intuition = 0;
  public constitution = 0;
  public mystic = 0;
  public strength = 0;
  public mind = 0;
  public willpower = 0;

  // Additional values
  public additional_splinters = 0;
  public additional_lp = 0;
  public additional_focus = 0;
  public additional_lp_regeneration = 0;
  public additional_focus_regeneration = 0;

  // Usage tracking
  public channeled_focus = 0;
  public exhausted_focus = 0;
  public consumed_focus = 0;

  public channeled_lp = 0;
  public exhausted_lp = 0;
  public consumed_lp = 0;

  public channeled_splinters = 0;
  public exhausted_splinters = 0;
  public consumed_splinters = 0;

  // Skills - general
  private _acrobatics = 0;
  private _alchemy = 0;
  private _leadership = 0;
  private _arcanelore = 0;
  private _athletics = 0;
  private _performance = 0;
  private _diplomacy = 0;
  private _clscraft = 0;
  private _empathy = 0;
  private _determination = 0;
  private _dexterity = 0;
  private _history = 0;
  private _craftmanship = 0;
  private _heal = 0;
  private _stealth = 0;
  private _hunting = 0;
  private _countrylore = 0;
  private _nature = 0;
  private _eloquence = 0;
  private _locksntraps = 0;
  private _swim = 0;
  private _seafaring = 0;
  private _streetlore = 0;
  private _animals = 0;
  private _survival = 0;
  private _perception = 0;
  private _endurance = 0;

  // Skills - magic
  private _antimagic = 0;
  private _controlmagic = 0;
  private _motionmagic = 0;
  private _insightmagic = 0;
  private _stonemagic = 0;
  private _firemagic = 0;
  private _healmagic = 0;
  private _illusionmagic = 0;
  private _combatmagic = 0;
  private _lightmagic = 0;
  private _naturemagic = 0;
  private _shadowmagic = 0;
  private _fatemagic = 0;
  private _protectionmagic = 0;
  private _enhancemagic = 0;
  private _deathmagic = 0;
  private _transformationmagic = 0;
  private _watermagic = 0;
  private _windmagic = 0;

  public get size_class(): number {
    return RACE_SIZES[this.race] || 5; // Default to human size if race not found
  }

  // BASE VALUES
  public get speed(): number {
    return this.size_class + this.agility;
  }

  public get initiative(): number {
    return 10 - this.intuition;
  }

  public get lp(): number {
    return this.size_class + this.constitution + this.additional_lp;
  }

  public get max_lp(): number {
    return this.lp * 5;
  }

  public get free_lp(): number {
    return (
      this.max_lp - this.channeled_lp - this.exhausted_lp - this.consumed_lp
    );
  }

  public get lp_regeneration(): number {
    return Math.max(
      1,
      this.constitution * (2 + this.additional_lp_regeneration),
    );
  }

  public get max_focus(): number {
    return 2 * (this.mystic + this.willpower) + this.additional_focus;
  }

  public get free_focus(): number {
    return (
      this.max_focus -
      this.channeled_focus -
      this.exhausted_focus -
      this.consumed_focus
    );
  }

  public get focus_regeneration(): number {
    return Math.max(
      1,
      this.willpower * (2 + this.additional_focus_regeneration),
    );
  }

  public get max_splinters(): number {
    return 3 + this.additional_splinters + this.level - 1;
  }

  public get free_splinters(): number {
    return (
      this.max_splinters -
      this.channeled_splinters -
      this.exhausted_splinters -
      this.consumed_splinters
    );
  }

  public get defense(): number {
    return (
      12 +
      this.agility +
      this.strength +
      2 * (5 - this.size_class) +
      2 * (this.level - 1)
    );
  }

  public get mental_resistance(): number {
    return 12 + this.mind + this.willpower + 2 * (this.level - 1);
  }

  public get physical_resistance(): number {
    return 12 + this.constitution + this.willpower + 2 * (this.level - 1);
  }

  // SKILLS - GENERAL
  public get acrobatics(): number {
    return this._acrobatics + this.agility + this.strength;
  }

  public get alchemy(): number {
    return this._alchemy + this.mystic + this.mind;
  }

  public get leadership(): number {
    return this._leadership + this.charisma + this.willpower;
  }

  public get arcanelore(): number {
    return this._arcanelore + this.mystic + this.mind;
  }

  public get athletics(): number {
    return this._athletics + this.agility + this.strength;
  }

  public get performance(): number {
    return this._performance + this.charisma + this.willpower;
  }

  public get diplomacy(): number {
    return this._diplomacy + this.charisma + this.mind;
  }

  public get clscraft(): number {
    return this._clscraft + this.intuition + this.mind;
  }

  public get empathy(): number {
    return this._empathy + this.intuition + this.mind;
  }

  public get determination(): number {
    return this._determination + this.charisma + this.willpower;
  }

  public get dexterity(): number {
    return this._dexterity + this.charisma + this.agility;
  }

  public get history(): number {
    return this._history + this.mystic + this.mind;
  }

  public get craftmanship(): number {
    return this._craftmanship + this.constitution + this.mind;
  }

  public get heal(): number {
    return this._heal + this.intuition + this.mind;
  }

  public get stealth(): number {
    return this._stealth + this.agility + this.intuition + 5 - this.size_class;
  }

  public get hunting(): number {
    return this._hunting + this.constitution + this.mind;
  }

  public get countrylore(): number {
    return this._countrylore + this.intuition + this.mind;
  }

  public get nature(): number {
    return this._nature + this.intuition + this.mind;
  }

  public get eloquence(): number {
    return this._eloquence + this.charisma + this.willpower;
  }

  public get locksntraps(): number {
    return this._locksntraps + this.intuition + this.agility;
  }

  public get swim(): number {
    return this._swim + this.constitution + this.strength;
  }

  public get seafaring(): number {
    return this._seafaring + this.agility + this.constitution;
  }

  public get streetlore(): number {
    return this._streetlore + this.charisma + this.intuition;
  }

  public get animals(): number {
    return this._animals + this.charisma + this.agility;
  }

  public get survival(): number {
    return this._survival + this.intuition + this.constitution;
  }

  public get perception(): number {
    return this._perception + this.intuition + this.willpower;
  }

  public get endurance(): number {
    return this._endurance + this.constitution + this.willpower;
  }

  // SKILLS - MAGIC
  public get antimagic(): number {
    return this._antimagic + this.mystic + this.willpower;
  }

  public get controlmagic(): number {
    return this._controlmagic + this.mystic + this.willpower;
  }

  public get motionmagic(): number {
    return this._motionmagic + this.mystic + this.agility;
  }

  public get insightmagic(): number {
    return this._insightmagic + this.mystic + this.mind;
  }

  public get stonemagic(): number {
    return this._stonemagic + this.mystic + this.constitution;
  }

  public get firemagic(): number {
    return this._firemagic + this.mystic + this.charisma;
  }

  public get healmagic(): number {
    return this._healmagic + this.mystic + this.charisma;
  }

  public get illusionmagic(): number {
    return this._illusionmagic + this.mystic + this.charisma;
  }

  public get combatmagic(): number {
    return this._combatmagic + this.mystic + this.strength;
  }

  public get lightmagic(): number {
    return this._lightmagic + this.mystic + this.charisma;
  }

  public get naturemagic(): number {
    return this._naturemagic + this.mystic + this.charisma;
  }

  public get shadowmagic(): number {
    return this._shadowmagic + this.mystic + this.intuition;
  }

  public get fatemagic(): number {
    return this._fatemagic + this.mystic + this.charisma;
  }

  public get protectionmagic(): number {
    return this._protectionmagic + this.mystic + this.charisma;
  }

  public get enhancemagic(): number {
    return this._enhancemagic + this.mystic + this.strength;
  }

  public get deathmagic(): number {
    return this._deathmagic + this.mystic + this.mind;
  }

  public get transformationmagic(): number {
    return this._transformationmagic + this.mystic + this.constitution;
  }

  public get watermagic(): number {
    return this._watermagic + this.mystic + this.intuition;
  }

  public get windmagic(): number {
    return this._windmagic + this.mystic + this.mind;
  }

  public update(update: UsageData, action: Action, info?: string): void {
    const before = this.getUsageData();
    Object.assign(this, update);
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
      data[field] = this[field];
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
        this[`consumed_${type}`] -
        Math.min(this[`consumed_${type}`], this[`${type}_regeneration`]);
    }
    this.update(update, Action.LONG_REST);
  }
}
