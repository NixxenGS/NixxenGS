import { createContext, useContext } from 'react';
import type { Derived, Hero } from '../../engine/hero';

export type BuilderCtx = { h: Hero; D: Derived; update: (fn: (h: Hero) => void) => void; goTo: (step: string) => void };
export const BuilderContext = createContext<BuilderCtx | null>(null);
export function useBuilder() {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error('useBuilder must be used inside the builder');
  return ctx;
}
