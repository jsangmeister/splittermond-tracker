import { Char } from '../models/char';

export const CHAR_SHORT_LABELS: Partial<Record<keyof Char, string>> = {
  // Atributes
  charisma: 'AUS',
  agility: 'BEW',
  intuition: 'INT',
  constitution: 'KON',
  mystic: 'MYS',
  strength: 'STÄ',
  mind: 'VER',
  willpower: 'WIL',

  // Skills
  acrobatics: 'Akr.',
  alchemy: 'Alch.',
  leadership: 'Anf.',
  arcanelore: 'Ark. K.',
  athletics: 'Athl.',
  performance: 'Darb.',
  diplomacy: 'Dipl.',
  clscraft: 'Edelh..',
  empathy: 'Emp.',
  determination: 'Entschl.',
  dexterity: 'Fingerf.',
  history: 'G&M',
  craftmanship: 'Handw.',
  heal: 'Heilk.',
  stealth: 'Heiml.',
  hunting: 'Jagdk.',
  countrylore: 'Länderk.',
  nature: 'Naturk.',
  eloquence: 'Red.',
  locksntraps: 'S&F',
  swim: 'Schw.',
  seafaring: 'Seef.',
  streetlore: 'Straßenk.',
  animals: 'Tierf.',
  survival: 'Überl.',
  perception: 'Wahrn.',
  endurance: 'Zäh.',

  // Other
  stealthModifier: 'GK',
};
