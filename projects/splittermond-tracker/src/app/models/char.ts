// Splittermond character model

const RACE_SIZES: Record<string, number> = {
  gnome: 3,
  dwarf: 4,
  alben: 5,
  human: 5,
  varg: 6,
};

const USAGE_FIELDS = [
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

export type UsageData = Partial<Record<(typeof USAGE_FIELDS)[number], number>>;

export class Char {
  // Character basic info
  name = '';
  race = '';
  level = 1;

  // Attributes
  charisma = 0;
  agility = 0;
  intuition = 0;
  constitution = 0;
  mystic = 0;
  strength = 0;
  mind = 0;
  willpower = 0;

  // Additional values
  additional_splinters = 0;
  additional_lp = 0;
  additional_focus = 0;

  // Usage tracking
  channeled_focus = 0;
  exhausted_focus = 0;
  consumed_focus = 0;

  channeled_lp = 0;
  exhausted_lp = 0;
  consumed_lp = 0;

  channeled_splinters = 0;
  exhausted_splinters = 0;
  consumed_splinters = 0;

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

  get size_class(): number {
    return RACE_SIZES[this.race] || 5; // Default to human size if race not found
  }

  // BASE VALUES
  get speed(): number {
    return this.size_class + this.agility;
  }

  get initiative(): number {
    return 10 - this.intuition;
  }

  get lp(): number {
    return this.size_class + this.constitution + this.additional_lp;
  }

  get max_lp(): number {
    return this.lp * 5;
  }

  get free_lp(): number {
    return (
      this.max_lp - this.channeled_lp - this.exhausted_lp - this.consumed_lp
    );
  }

  get max_focus(): number {
    return 2 * (this.mystic + this.willpower) + this.additional_focus;
  }

  get free_focus(): number {
    return (
      this.max_focus -
      this.channeled_focus -
      this.exhausted_focus -
      this.consumed_focus
    );
  }

  get max_splinters(): number {
    return 3 + this.additional_splinters + this.level - 1;
  }

  get free_splinters(): number {
    return (
      this.max_splinters -
      this.channeled_splinters -
      this.exhausted_splinters -
      this.consumed_splinters
    );
  }

  get defense(): number {
    return (
      12 +
      this.agility +
      this.strength +
      2 * (5 - this.size_class) +
      2 * (this.level - 1)
    );
  }

  get mental_resistance(): number {
    return 12 + this.mind + this.willpower + 2 * (this.level - 1);
  }

  get physical_resistance(): number {
    return 12 + this.constitution + this.willpower + 2 * (this.level - 1);
  }

  // SKILLS - GENERAL
  get acrobatics(): number {
    return this._acrobatics + this.agility + this.strength;
  }

  get alchemy(): number {
    return this._alchemy + this.mystic + this.mind;
  }

  get leadership(): number {
    return this._leadership + this.charisma + this.willpower;
  }

  get arcanelore(): number {
    return this._arcanelore + this.mystic + this.mind;
  }

  get athletics(): number {
    return this._athletics + this.agility + this.strength;
  }

  get performance(): number {
    return this._performance + this.charisma + this.willpower;
  }

  get diplomacy(): number {
    return this._diplomacy + this.charisma + this.mind;
  }

  get clscraft(): number {
    return this._clscraft + this.intuition + this.mind;
  }

  get empathy(): number {
    return this._empathy + this.intuition + this.mind;
  }

  get determination(): number {
    return this._determination + this.charisma + this.willpower;
  }

  get dexterity(): number {
    return this._dexterity + this.charisma + this.agility;
  }

  get history(): number {
    return this._history + this.mystic + this.mind;
  }

  get craftmanship(): number {
    return this._craftmanship + this.constitution + this.mind;
  }

  get heal(): number {
    return this._heal + this.intuition + this.mind;
  }

  get stealth(): number {
    return this._stealth + this.agility + this.intuition + 5 - this.size_class;
  }

  get hunting(): number {
    return this._hunting + this.constitution + this.mind;
  }

  get countrylore(): number {
    return this._countrylore + this.intuition + this.mind;
  }

  get nature(): number {
    return this._nature + this.intuition + this.mind;
  }

  get eloquence(): number {
    return this._eloquence + this.charisma + this.willpower;
  }

  get locksntraps(): number {
    return this._locksntraps + this.intuition + this.agility;
  }

  get swim(): number {
    return this._swim + this.constitution + this.strength;
  }

  get seafaring(): number {
    return this._seafaring + this.agility + this.constitution;
  }

  get streetlore(): number {
    return this._streetlore + this.charisma + this.intuition;
  }

  get animals(): number {
    return this._animals + this.charisma + this.agility;
  }

  get survival(): number {
    return this._survival + this.intuition + this.constitution;
  }

  get perception(): number {
    return this._perception + this.intuition + this.willpower;
  }

  get endurance(): number {
    return this._endurance + this.constitution + this.willpower;
  }

  // SKILLS - MAGIC
  get antimagic(): number {
    return this._antimagic + this.mystic + this.willpower;
  }

  get controlmagic(): number {
    return this._controlmagic + this.mystic + this.willpower;
  }

  get motionmagic(): number {
    return this._motionmagic + this.mystic + this.agility;
  }

  get insightmagic(): number {
    return this._insightmagic + this.mystic + this.mind;
  }

  get stonemagic(): number {
    return this._stonemagic + this.mystic + this.constitution;
  }

  get firemagic(): number {
    return this._firemagic + this.mystic + this.charisma;
  }

  get healmagic(): number {
    return this._healmagic + this.mystic + this.charisma;
  }

  get illusionmagic(): number {
    return this._illusionmagic + this.mystic + this.charisma;
  }

  get combatmagic(): number {
    return this._combatmagic + this.mystic + this.strength;
  }

  get lightmagic(): number {
    return this._lightmagic + this.mystic + this.charisma;
  }

  get naturemagic(): number {
    return this._naturemagic + this.mystic + this.charisma;
  }

  get shadowmagic(): number {
    return this._shadowmagic + this.mystic + this.intuition;
  }

  get fatemagic(): number {
    return this._fatemagic + this.mystic + this.charisma;
  }

  get protectionmagic(): number {
    return this._protectionmagic + this.mystic + this.charisma;
  }

  get enhancemagic(): number {
    return this._enhancemagic + this.mystic + this.strength;
  }

  get deathmagic(): number {
    return this._deathmagic + this.mystic + this.mind;
  }

  get transformationmagic(): number {
    return this._transformationmagic + this.mystic + this.constitution;
  }

  get watermagic(): number {
    return this._watermagic + this.mystic + this.intuition;
  }

  get windmagic(): number {
    return this._windmagic + this.mystic + this.mind;
  }

  // Method to load character data
  loadCharacterData(xml: any): void {
    if (!xml) return;
    const characterData = xml.splimochar;

    // Set basic properties
    this.race = characterData.$.race ?? '';
    const ep = parseInt(characterData.$.expinv ?? '0');

    // Calculate level based on experience points
    if (ep < 100) {
      this.level = 1;
    } else if (ep < 300) {
      this.level = 2;
    } else if (ep < 600) {
      this.level = 3;
    } else {
      this.level = 4;
    }

    // Set character name
    if (characterData.name) {
      this.name = characterData.name;
    }

    // Set powerrefs (special abilities)
    if (characterData.powerrefs) {
      for (const power of characterData.powerrefs.powerref) {
        if (power.$.ref === 'addsplinter') {
          this.additional_splinters = 2 * parseInt(power.$.count);
        } else if (power.$.ref === 'focuspool') {
          this.additional_focus = 5 * parseInt(power.$.count);
        } else if (power.$.ref === 'sturdy') {
          this.additional_lp = parseInt(power.$.count);
        }
      }
    }

    // Set attributes
    if (characterData.attributes) {
      for (const attr of characterData.attributes.attr) {
        const attrId = attr.$.id.toLowerCase();
        if (this.hasOwnProperty(attrId)) {
          (this as any)[attrId] = parseInt(attr.$.value);
        }
      }
    }

    // Set skills
    if (characterData.skillvals) {
      for (const skill of characterData.skillvals.skillval) {
        const skillId = '_' + skill.$.skill;
        if (this.hasOwnProperty(skillId)) {
          (this as any)[skillId] = parseInt(skill.$.val ?? '0');
        }
      }
    }
  }

  setUsageData(data: UsageData): void {
    for (const field of USAGE_FIELDS) {
      if (data[field] !== undefined) {
        (this as any)[field] = data[field];
      }
    }
  }

  // Get usage data for saving
  getUsageData(): UsageData {
    const data: Record<string, number> = {};
    for (const field of USAGE_FIELDS) {
      data[field] = (this as any)[field];
    }
    return data as UsageData;
  }
}
