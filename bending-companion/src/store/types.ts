import type { Approach, ConditionKey, MoveId, Outcome, StatKey, TechniqueLevel, TrainingKey } from '../data/game';

export type Technique = {
  id: string;
  name: string;
  approach: Approach;
  level: TechniqueLevel;
  notes: string;
};

export type CustomMove = {
  id: string;
  name: string;
  notes: string;
};

export type Character = {
  id: string;
  name: string;
  playbookId: string;
  customPrinciples: [string, string];
  trainings: TrainingKey[];
  era: string;
  background: string;
  demeanor: string;
  look: string;
  history: string;
  connections: string;
  notes: string;
  stats: Record<StatKey, number>;
  /** Negative leans toward principle[0], positive toward principle[1]. */
  balance: number;
  center: number;
  conditions: Record<ConditionKey, boolean>;
  fatigue: number;
  statuses: string[];
  growth: number;
  advancements: number;
  moves: CustomMove[];
  techniques: Technique[];
  createdAt: number;
  updatedAt: number;
};

export type RollRecord = {
  id: string;
  at: number;
  characterId?: string;
  characterName?: string;
  label: string;
  moveId?: MoveId;
  dice: [number, number];
  modifiers: { label: string; value: number }[];
  total: number;
  outcome: Outcome;
};

export type AppState = {
  characters: Character[];
  rolls: RollRecord[];
  activeCharacterId?: string;
};
