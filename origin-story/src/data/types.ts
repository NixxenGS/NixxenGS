// [name, type (A/R/I), game text, required power/quality?]
export type RawAbility = [string, string, string] | [string, string, string, string];

// [name, category, during roleplaying, minor twist, major twist, green ability text, type?]
export type PrincipleRow = [string, string, string, string, string, string] | [string, string, string, string, string, string, string];

export type Die = 4 | 6 | 8 | 10 | 12;

export type BackgroundDef = {
  n: number;
  name: string;
  assign: number[];
  count: number;
  q: string[];
  principle: string;
  roll: number[];
  blurb: string;
  required?: string;
  note?: string;
};

export type AbilityList = { count: number; diff?: boolean; note?: string; fromGreen?: boolean; list?: RawAbility[] };

export type PsExtra = {
  type: 'archetypeQuality' | 'quality' | 'power' | 'powerNotOnList' | 'upgradeD6' | 'cosmosShift';
  die?: number;
  cats?: string[] | 'any';
  text: string;
};

export type PowerSourceDef = {
  n: number;
  name: string;
  blurb: string;
  p: string[];
  required?: string;
  yellow?: AbilityList;
  green?: AbilityList;
  extra?: PsExtra;
  roll: number[];
};

export type ArchReq = { kind: 'power' | 'quality' | 'powerCat' | 'powerOrCat'; opts: string[]; note?: string };

export type ArchetypeDef = {
  n: number;
  name: string;
  blurb: string;
  req?: ArchReq;
  p?: string[];
  pMin?: number;
  pRule?: 'one' | 'oneOrMore' | 'any';
  q?: string[];
  green?: AbilityList;
  yellow?: AbilityList;
  fixedGreen?: RawAbility[];
  fixedGreenNote?: string;
  fixedRed?: RawAbility[];
  extraRed?: RawAbility[];
  extra?: { type: 'newPowerCat'; die: number; cats: string[]; text: string };
  healthAlt?: string[];
  psychicRule?: boolean;
  note?: string;
  minionForms?: boolean;
  forms?: boolean;
  divided?: boolean;
  modular?: boolean;
  principle: string | null;
  roll: number[];
};

export type ModeDef = { name: string; rule: string; ability: RawAbility };

export type PersonalityDef = {
  n: number;
  name: string;
  status: number[];
  out: string;
  extra?: { type: 'upgradeAny'; text: string };
  healthAny?: boolean;
  extraText?: string;
};

export type TraitCatalog = Record<string, { health?: boolean; custom?: boolean; items: Record<string, string> }>;
