import { CONDITION_PENALTY, CONDITIONS, STATS, type Move } from '../data/game';
import { principlesOf } from '../store/store';
import type { Character } from '../store/types';

export type Modifier = { label: string; value: number };

export const rollD6 = () => 1 + Math.floor(Math.random() * 6);

/** Principle ratings mirror the balance track: leaning toward one raises it and lowers the other. */
export function principleValue(c: Character, index: 0 | 1) {
  return index === 0 ? -c.balance : c.balance;
}

export function baseModifiers(c: Character | undefined, move: Move | undefined, principleIndex: 0 | 1): Modifier[] {
  if (!c || !move) return [];
  const mods: Modifier[] = [];
  if (move.roll.kind === 'stat') {
    const stat = move.roll.stat;
    mods.push({ label: STATS.find((s) => s.key === stat)!.label, value: c.stats[stat] });
  } else if (move.roll.kind === 'principle') {
    mods.push({ label: principlesOf(c)[principleIndex], value: principleValue(c, principleIndex) });
  }
  for (const cond of CONDITIONS) {
    if (!c.conditions[cond.key]) continue;
    if (cond.penalties.includes(move.id)) mods.push({ label: cond.label, value: -CONDITION_PENALTY });
    if (cond.bonuses?.includes(move.id)) mods.push({ label: cond.label, value: CONDITION_PENALTY });
  }
  return mods;
}

export const formatMod = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
