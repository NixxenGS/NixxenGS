import { useState } from 'react';
import { Text, View } from 'react-native';
import { effectDiceIn, rollDie, type AbilityRec, type Mod, type Zone } from '../../engine/hero';
import { thud } from '../../lib/haptics';
import { comicShadow, radius, space, useColors } from '../../theme';
import { Body, Btn, Card, Chip, DieBadge, Icon, Label, PressScale, Title } from '../ui';
import { RolledDie } from './RolledDie';

export type PoolTrait = { key: string; label: string; die: number };
type Result = { dice: { size: number; value: number; label: string }[]; key: number };
const SLOT_NAMES = ['Min', 'Mid', 'Max'] as const;

export function RollPanel({
  powers, qualities, zone, statusDie, ability, onClearAbility, mods, onRolled, onSpendMods, power, quality, setPower, setQuality,
}: {
  powers: PoolTrait[]; qualities: PoolTrait[]; zone: Zone; statusDie: number | null;
  ability: AbilityRec | null; onClearAbility: () => void; mods: Mod[];
  onRolled: (dice: { size: number; value: number; label: string }[], note: string) => void;
  onSpendMods: (ids: string[]) => void;
  power: string | null; quality: string | null; setPower: (k: string | null) => void; setQuality: (k: string | null) => void;
}) {
  const c = useColors();
  const [res, setRes] = useState<Result | null>(null);
  const [applied, setApplied] = useState<string[]>([]);
  const p = powers.find((x) => x.key === power);
  const q = qualities.find((x) => x.key === quality);
  const pool = [
    p && { size: p.die, label: p.label },
    q && { size: q.die, label: q.label },
    statusDie && { size: statusDie, label: `${zone[0].toUpperCase() + zone.slice(1)} status` },
  ].filter(Boolean) as { size: number; label: string }[];

  const roll = () => {
    thud();
    const dice = pool.map((d) => ({ ...d, value: rollDie(d.size) }));
    setRes({ dice, key: Date.now() });
    onRolled(dice, ability ? ability.name : `${p?.label ?? '—'} + ${q?.label ?? '—'}`);
  };

  // Min/Mid/Max: sort low to high (ties keep pool order).
  const sorted = res ? [...res.dice].map((d, i) => ({ ...d, i })).sort((a, b) => a.value - b.value || a.i - b.i) : [];
  const want = ability ? effectDiceIn(ability.text) : ['Mid'];
  const used = new Set<number>();
  if (sorted.length === 3) for (const w of want) used.add(SLOT_NAMES.indexOf(w as (typeof SLOT_NAMES)[number]));
  else if (sorted.length) used.add(sorted.length - 1);
  const base = sorted.reduce((n, d, i) => n + (used.has(i) ? d.value : 0), 0);
  const modTotal = mods.filter((m) => applied.includes(m.id)).reduce((n, m) => n + m.value, 0);
  const vals = sorted.map((d) => d.value);
  const doubles = vals.length > 1 && new Set(vals).size < vals.length;
  const ones = vals.filter((v) => v === 1).length;

  return (
    <Card title="Dice pool" right={<Body muted style={{ fontSize: 12 }}>power + quality + status</Body>}>
      <Label>Power</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {powers.map((t) => (
          <Chip key={t.key} small label={`${t.label} d${t.die}`} active={t.key === power} color={c.blue} onPress={() => setPower(t.key === power ? null : t.key)} />
        ))}
        {!powers.length && <Body muted>No powers yet.</Body>}
      </View>
      <Label>Quality</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {qualities.map((t) => (
          <Chip key={t.key} small label={`${t.label} d${t.die}`} active={t.key === quality} color={c.teal} onPress={() => setQuality(t.key === quality ? null : t.key)} />
        ))}
        {!qualities.length && <Body muted>No qualities yet.</Body>}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Label>Status</Label>
        {statusDie ? <DieBadge size={statusDie} px={28} fill={c.zone[zone].die} /> : null}
        <Body muted style={{ fontSize: 13, flex: 1 }}>{statusDie ? `${zone} zone, picked for you` : 'Needs a personality'}</Body>
      </View>

      {ability ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.hi, borderWidth: 2, borderColor: c.line, borderRadius: radius.sm, padding: 8 }}>
          <Icon name="lightning-bolt" size={18} color={c.ink} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '900', color: c.ink }}>{ability.name}</Text>
            <Body style={{ fontSize: 13 }}>Effect uses your {want.join(' + ')} die{want.length > 1 ? 's' : ''}.</Body>
          </View>
          <PressScale onPress={onClearAbility} accessibilityLabel="Clear ability" hitSlop={8}>
            <Icon name="close-circle" size={22} color={c.muted} />
          </PressScale>
        </View>
      ) : null}

      {mods.length > 0 && (
        <>
          <Label>Apply bonuses / penalties</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {mods.map((m) => (
              <Chip
                key={m.id}
                small
                label={`${m.value > 0 ? '+' : ''}${m.value} ${m.label}`}
                active={applied.includes(m.id)}
                color={m.value >= 0 ? c.green : c.red}
                onPress={() => setApplied((a) => (a.includes(m.id) ? a.filter((x) => x !== m.id) : [...a, m.id]))}
              />
            ))}
          </View>
        </>
      )}

      <Btn kind="yellow" icon="dice-multiple" label={p || q ? `Roll ${pool.map((d) => 'd' + d.size).join(' + ')}` : 'Pick a power and a quality'} disabled={!p && !q} onPress={roll} />

      {res && (
        <View style={{ gap: space.sm, alignItems: 'center', paddingTop: space.sm }}>
          <View style={{ flexDirection: 'row', gap: space.lg, justifyContent: 'center' }}>
            {sorted.map((d, i) => {
              const on = used.has(i);
              return (
                <View key={d.i} style={{ alignItems: 'center', gap: 4 }}>
                  <RolledDie size={d.size} value={d.value} rollKey={res.key} delay={i * 70} px={58} fill={on ? c.yellow : undefined} />
                  <Text style={{ fontWeight: '900', color: on ? c.ink : c.muted, fontSize: 13 }}>{sorted.length === 3 ? SLOT_NAMES[i] : ''}</Text>
                  <Text style={{ color: c.muted, fontSize: 11, maxWidth: 90, textAlign: 'center' }} numberOfLines={1}>{d.label}</Text>
                </View>
              );
            })}
          </View>
          <View style={{ alignItems: 'center', backgroundColor: c.panel2, borderWidth: 2, borderColor: c.line, borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 20, ...comicShadow(c, 3) }}>
            <Label>Effect{ability ? '' : ' (Mid die)'}</Label>
            <Title size={44}>{base + modTotal}</Title>
            {modTotal ? <Body muted style={{ fontSize: 12 }}>{base} {modTotal > 0 ? '+' : '−'} {Math.abs(modTotal)} from mods</Body> : null}
          </View>
          {(doubles || ones > 0) && (
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {doubles ? <Chip small icon="alert-decagram" label="Doubles" active color={c.orange} /> : null}
              {ones ? <Chip small icon="numeric-1-circle" label={ones > 1 ? `${ones} ones` : 'Rolled a 1'} active color={c.muted} /> : null}
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Btn small icon="restore" label="Reroll pool" onPress={roll} />
            {applied.length > 0 && (
              <Btn
                small
                icon="check"
                label="Done: use up bonuses"
                onPress={() => {
                  onSpendMods(applied);
                  setApplied([]);
                }}
              />
            )}
          </View>
        </View>
      )}
    </Card>
  );
}
