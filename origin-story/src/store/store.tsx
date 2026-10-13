import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { clone, derive, migrate, newHero, trimSlots, uid, type Derived, type Hero, type Zone } from '../engine/hero';

const STORAGE_KEY = 'origin-story/state/v1';
const MAX_ROLLS = 60;

export type ActorKind = 'hero' | 'villain' | 'lieutenant' | 'minion' | 'environment';
export type Actor = {
  id: string;
  kind: ActorKind;
  name: string;
  heroId?: string;
  die?: number;
  count?: number;
  health?: number;
  maxHealth?: number;
  acted: boolean;
  notes?: string;
};
export type Scene = {
  name: string;
  notes: string;
  tracker: Record<Zone, number>;
  filled: number;
  round: number;
  actors: Actor[];
};
export type RollDie = { size: number; value: number; label?: string };
export type RollRecord = {
  id: string;
  at: number;
  who: string;
  dice: RollDie[];
  note?: string;
};
export type ThemePref = 'system' | 'light' | 'dark';
export type AppState = {
  heroes: Record<string, Hero>;
  order: string[];
  scene: Scene;
  rolls: RollRecord[];
  theme: ThemePref;
};

export function newScene(): Scene {
  return { name: '', notes: '', tracker: { green: 2, yellow: 3, red: 2 }, filled: 0, round: 1, actors: [] };
}

const initialState: AppState = { heroes: {}, order: [], scene: newScene(), rolls: [], theme: 'system' };

type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'addHeroes'; heroes: Hero[] }
  | { type: 'updateHero'; id: string; fn: (h: Hero) => void }
  | { type: 'deleteHero'; id: string }
  | { type: 'scene'; fn: (s: Scene) => void }
  | { type: 'addRoll'; roll: RollRecord }
  | { type: 'clearRolls' }
  | { type: 'theme'; theme: ThemePref };

function reducer(state: AppState, a: Action): AppState {
  switch (a.type) {
    case 'hydrate':
      return a.state;
    case 'addHeroes': {
      const heroes = { ...state.heroes };
      for (const h of a.heroes) heroes[h.id] = h;
      return { ...state, heroes, order: [...a.heroes.map((h) => h.id), ...state.order.filter((id) => !a.heroes.some((h) => h.id === id))] };
    }
    case 'updateHero': {
      const cur = state.heroes[a.id];
      if (!cur) return state;
      // Heroes are small, so a deep copy keeps updates simple and immutable.
      const next = clone(cur);
      a.fn(next);
      // Drop slots for dice that no longer exist (e.g. a returned die went away).
      trimSlots(next, derive(next));
      next.updated = Date.now();
      return { ...state, heroes: { ...state.heroes, [a.id]: next } };
    }
    case 'deleteHero': {
      const heroes = { ...state.heroes };
      delete heroes[a.id];
      const scene = { ...state.scene, actors: state.scene.actors.filter((x) => x.heroId !== a.id) };
      return { ...state, heroes, order: state.order.filter((id) => id !== a.id), scene };
    }
    case 'scene': {
      const next = clone(state.scene);
      a.fn(next);
      return { ...state, scene: next };
    }
    case 'addRoll':
      return { ...state, rolls: [a.roll, ...state.rolls].slice(0, MAX_ROLLS) };
    case 'clearRolls':
      return { ...state, rolls: [] };
    case 'theme':
      return { ...state, theme: a.theme };
  }
}

type Store = {
  state: AppState;
  hydrated: boolean;
  createHero: () => Hero;
  addHeroes: (heroes: Hero[]) => void;
  updateHero: (id: string, fn: (h: Hero) => void) => void;
  deleteHero: (id: string) => void;
  duplicateHero: (id: string) => Hero | null;
  updateScene: (fn: (s: Scene) => void) => void;
  addRoll: (r: Omit<RollRecord, 'id' | 'at'>) => void;
  clearRolls: () => void;
  setTheme: (t: ThemePref) => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<AppState>;
        const heroes: Record<string, Hero> = {};
        for (const [id, h] of Object.entries(saved.heroes || {})) heroes[id] = migrate(h);
        const order = (saved.order || []).filter((id) => heroes[id]);
        for (const id of Object.keys(heroes)) if (!order.includes(id)) order.push(id);
        dispatch({
          type: 'hydrate',
          state: { ...initialState, ...saved, heroes, order, scene: { ...newScene(), ...(saved.scene || {}) } },
        });
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
      createHero: () => {
        const h = newHero();
        dispatch({ type: 'addHeroes', heroes: [h] });
        return h;
      },
      addHeroes: (heroes) => dispatch({ type: 'addHeroes', heroes }),
      updateHero: (id, fn) => dispatch({ type: 'updateHero', id, fn }),
      deleteHero: (id) => dispatch({ type: 'deleteHero', id }),
      duplicateHero: (id) => {
        const src = stateRef.current.heroes[id];
        if (!src) return null;
        const h = clone(src);
        h.id = uid();
        h.info.name = (h.info.name || 'Unnamed hero') + ' (copy)';
        h.created = h.updated = Date.now();
        dispatch({ type: 'addHeroes', heroes: [h] });
        return h;
      },
      updateScene: (fn) => dispatch({ type: 'scene', fn }),
      addRoll: (r) => dispatch({ type: 'addRoll', roll: { ...r, id: uid(), at: Date.now() } }),
      clearRolls: () => dispatch({ type: 'clearRolls' }),
      setTheme: (theme) => dispatch({ type: 'theme', theme }),
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

/** A hero plus its derived rules state, and an updater bound to it. */
export function useHero(id?: string): { hero?: Hero; D?: Derived; update: (fn: (h: Hero) => void) => void } {
  const { state, updateHero } = useStore();
  const hero = id ? state.heroes[id] : undefined;
  const D = useMemo(() => (hero ? derive(hero) : undefined), [hero]);
  return { hero, D, update: (fn) => id && updateHero(id, fn) };
}

export const trackerTotal = (s: Scene) => s.tracker.green + s.tracker.yellow + s.tracker.red;
/** The scene's zone is the zone of the current box on the tracker. */
export function sceneZoneOf(s: Scene): Zone {
  const i = Math.min(s.filled, trackerTotal(s) - 1);
  if (i < s.tracker.green) return 'green';
  if (i < s.tracker.green + s.tracker.yellow) return 'yellow';
  return 'red';
}
export const sceneOver = (s: Scene) => s.filled >= trackerTotal(s);
