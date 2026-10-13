import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { CONDITIONS, PLAYBOOKS, type ConditionKey } from '../data/game';
import { makeId } from '../lib/id';
import type { AppState, Character, RollRecord } from './types';

const STORAGE_KEY = 'bending-companion/state/v1';
const MAX_ROLLS = 100;

type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'addCharacter'; character: Character }
  | { type: 'updateCharacter'; id: string; update: (c: Character) => Character }
  | { type: 'deleteCharacter'; id: string }
  | { type: 'setActive'; id?: string }
  | { type: 'addRoll'; roll: RollRecord }
  | { type: 'clearRolls' };

const initialState: AppState = { characters: [], rolls: [] };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'addCharacter':
      return {
        ...state,
        characters: [...state.characters, action.character],
        activeCharacterId: state.activeCharacterId ?? action.character.id,
      };
    case 'updateCharacter':
      return {
        ...state,
        characters: state.characters.map((c) =>
          c.id === action.id ? { ...action.update(c), updatedAt: Date.now() } : c,
        ),
      };
    case 'deleteCharacter': {
      const characters = state.characters.filter((c) => c.id !== action.id);
      return {
        ...state,
        characters,
        activeCharacterId:
          state.activeCharacterId === action.id ? characters[0]?.id : state.activeCharacterId,
      };
    }
    case 'setActive':
      return { ...state, activeCharacterId: action.id };
    case 'addRoll':
      return { ...state, rolls: [action.roll, ...state.rolls].slice(0, MAX_ROLLS) };
    case 'clearRolls':
      return { ...state, rolls: [] };
  }
}

export function newCharacter(partial: Partial<Character> = {}): Character {
  const now = Date.now();
  return {
    id: makeId(),
    name: '',
    playbookId: PLAYBOOKS[0].id,
    customPrinciples: ['', ''],
    trainings: [],
    era: '',
    background: '',
    demeanor: '',
    look: '',
    history: '',
    connections: '',
    notes: '',
    stats: { creativity: 0, focus: 0, harmony: 0, passion: 0 },
    balance: 0,
    center: 0,
    conditions: Object.fromEntries(CONDITIONS.map((c) => [c.key, false])) as Record<ConditionKey, boolean>,
    fatigue: 0,
    statuses: [],
    growth: 0,
    advancements: 0,
    moves: [],
    techniques: [],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

type Store = {
  state: AppState;
  hydrated: boolean;
  addCharacter: (c: Character) => void;
  updateCharacter: (id: string, update: (c: Character) => Character) => void;
  deleteCharacter: (id: string) => void;
  setActive: (id?: string) => void;
  addRoll: (r: RollRecord) => void;
  clearRolls: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as AppState;
        // Fill in fields added after a character was first saved.
        saved.characters = saved.characters.map((c) => newCharacter(c));
        dispatch({ type: 'hydrate', state: { ...initialState, ...saved } });
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
    }, 300);
  }, [state, hydrated]);

  const store = useMemo<Store>(
    () => ({
      state,
      hydrated,
      addCharacter: (character) => dispatch({ type: 'addCharacter', character }),
      updateCharacter: (id, update) => dispatch({ type: 'updateCharacter', id, update }),
      deleteCharacter: (id) => dispatch({ type: 'deleteCharacter', id }),
      setActive: (id) => dispatch({ type: 'setActive', id }),
      addRoll: (roll) => dispatch({ type: 'addRoll', roll }),
      clearRolls: () => dispatch({ type: 'clearRolls' }),
    }),
    [state, hydrated],
  );

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}

export function useCharacter(id?: string) {
  const { state, updateCharacter } = useStore();
  const character = state.characters.find((c) => c.id === id);
  const update = (fn: (c: Character) => Character) => id && updateCharacter(id, fn);
  return { character, update };
}

export function principlesOf(c: Character): [string, string] {
  if (c.playbookId === 'custom') {
    return [c.customPrinciples[0] || 'Principle A', c.customPrinciples[1] || 'Principle B'];
  }
  return PLAYBOOKS.find((p) => p.id === c.playbookId)?.principles ?? ['Principle A', 'Principle B'];
}

export function playbookName(c: Character) {
  return PLAYBOOKS.find((p) => p.id === c.playbookId)?.name ?? 'Custom Playbook';
}
