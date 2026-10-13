import { Text, View } from 'react-native';
import { MINION_CHART, MINION_FORMS, PERSONALITIES } from '../data/rules';
import { archName, entry, fillText, STEPS, type AbilityRec, type Derived, type Hero, type StepKey, type Trait } from '../engine/hero';
import { radius, space, useColors } from '../theme';
import { ActionIcons, TypeBadge } from './abilityBits';
import { HealthBox } from './builder/steps';
import { Body, Card, DieBadge, Label, PressScale, Title } from './ui';

export function TraitTable({ list }: { list: Trait[] }) {
  const c = useColors();
  if (!list.length) return <Body muted>None yet</Body>;
  return (
    <View>
      {list.map((t) => (
        <View key={t.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, borderBottomWidth: 1, borderColor: c.panel2 }}>
          <DieBadge size={t.die} px={30} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', color: c.ink, fontSize: 15 }}>{t.label}</Text>
            <Text style={{ color: c.muted, fontSize: 12 }}>{t.label !== t.base && t.base !== '__special' ? `${t.base} · ` : ''}{t.cat}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function AbilityRow({ a, zone, dim }: { a: AbilityRec; zone: 'green' | 'yellow' | 'red' | 'out'; dim?: boolean }) {
  const c = useColors();
  return (
    <View style={{ borderLeftWidth: 5, borderLeftColor: c.zone[zone].fg, paddingLeft: 10, paddingVertical: 6, gap: 3, opacity: dim ? 0.5 : 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ flex: 1, fontWeight: '900', color: c.ink, fontSize: 15 }}>
          {a.name}
          {a.name !== a.base ? <Text style={{ fontWeight: '500', color: c.muted, fontSize: 12 }}> ({a.base})</Text> : null}
        </Text>
        <ActionIcons text={a.raw} />
        <TypeBadge type={a.type} />
      </View>
      <Body style={{ fontSize: 14 }}>{a.text}</Body>
    </View>
  );
}

export function StatusDice({ status, px = 36 }: { status: number[] | null; px?: number }) {
  const c = useColors();
  if (!status) return <Body muted>No personality yet</Body>;
  return (
    <View style={{ flexDirection: 'row', gap: space.md }}>
      {(['green', 'yellow', 'red'] as const).map((z, i) => <DieBadge key={z} size={status[i]} px={px} fill={c.zone[z].die} label={z} />)}
    </View>
  );
}

export function HeroSheet({ h, D, onGoStep }: { h: Hero; D: Derived; onGoStep?: (k: StepKey) => void }) {
  const c = useColors();
  const open = (Object.entries(D.issues) as [StepKey, string[]][]).filter(([, v]) => v.length);
  const p2 = D.pers && h.pers.n2 ? entry(PERSONALITIES, h.pers.n2) : null;
  const zoneList = (title: string, zone: 'green' | 'yellow' | 'red', list: AbilityRec[]) => (
    <Card zone={zone} title={title}>
      {list.length ? list.map((a) => <AbilityRow key={a.gid + a.id} a={a} zone={zone} />) : <Body muted>—</Body>}
    </Card>
  );
  return (
    <View style={{ gap: space.md }}>
      {open.length > 0 && (
        <Card zone="yellow" title="Unfinished steps">
          {open.map(([k, v]) => (
            <PressScale key={k} onPress={() => onGoStep?.(k)}>
              <Body>
                <Text style={{ fontWeight: '900', color: c.blue, textDecorationLine: 'underline' }}>{STEPS.find((s) => s[0] === k)![2]}</Text>: {v[0]}
                {v.length > 1 ? ` (+${v.length - 1} more)` : ''}
              </Body>
            </PressScale>
          ))}
        </Card>
      )}
      <Card>
        <Title size={34}>{h.info.name || 'Unnamed Hero'}</Title>
        {h.info.alias ? <Body muted>{h.info.alias}</Body> : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
          {[
            ['Background', D.bg?.name],
            ['Power Source', D.ps?.name],
            ['Archetype', archName(D)],
            ['Personality', (D.pers?.name || '') + (p2 ? ' / ' + p2.name : '')],
          ].map(([k, v]) => (
            <View key={k} style={{ flexBasis: '45%', flexGrow: 1 }}>
              <Label>{k}</Label>
              <Body style={{ fontWeight: '700' }}>{v || '—'}</Body>
            </View>
          ))}
        </View>
      </Card>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        <Card title="Powers" style={{ flexBasis: 300, flexGrow: 1 }}>
          <TraitTable list={D.powers} />
        </Card>
        <Card title="Qualities" style={{ flexBasis: 300, flexGrow: 1 }}>
          <TraitTable list={D.qualities} />
        </Card>
      </View>
      <Card title="Status & Health">
        <StatusDice status={D.status} />
        {p2 ? (
          <View style={{ gap: 4 }}>
            <Label>{p2.name} (second form)</Label>
            <StatusDice status={p2.status} px={30} />
          </View>
        ) : null}
        {D.health.max && D.health.ranges ? <HealthBox max={D.health.max} ranges={D.health.ranges} /> : <Body muted>Health not worked out yet.</Body>}
      </Card>
      <Card title="Principles">
        {D.principles.length ? (
          D.principles.map(({ p, slot }) => {
            const gid = h.retcon.id === 'swapPrinciple' && h.retcon.slot === slot && h.retcon.principle ? 'pr-retcon' : 'pr-' + slot;
            const fill = h.abil[gid + '|' + p[0]]?.fills?.[0];
            const sub = (t: string) => (fill ? t.replace(/\[[^\]]+\]/g, fill) : t);
            return (
              <View key={slot} style={{ gap: 3, paddingVertical: 6, borderBottomWidth: 1, borderColor: c.panel2 }}>
                <Text style={{ fontWeight: '900', color: c.ink, fontSize: 16 }}>{sub(p[0])} <Text style={{ fontWeight: '500', color: c.muted, fontSize: 12 }}>{p[1]}</Text></Text>
                <Body style={{ fontStyle: 'italic', fontSize: 14 }}>{sub(p[2])}</Body>
                <Body style={{ fontSize: 14 }}><Text style={{ fontWeight: '800' }}>Minor twist: </Text>{p[3]}</Body>
                <Body style={{ fontSize: 14 }}><Text style={{ fontWeight: '800' }}>Major twist: </Text>{p[4]}</Body>
              </View>
            );
          })
        ) : (
          <Body muted>None yet</Body>
        )}
      </Card>
      {zoneList('Green abilities', 'green', [...D.abilities.green, ...D.abilities.principles])}
      {zoneList('Yellow abilities', 'yellow', D.abilities.yellow)}
      {zoneList('Red abilities', 'red', D.abilities.red)}
      <Card zone="out" title="Out">
        <Body>{D.abilities.out ? D.abilities.out.text : '—'}</Body>
      </Card>
      <AuxSheet h={h} D={D} />
      {(h.info.costume || h.info.notes) ? (
        <Card title="Notes">
          {h.info.costume ? <Body><Text style={{ fontWeight: '800' }}>Costume: </Text>{h.info.costume}</Body> : null}
          {h.info.notes ? <Body>{h.info.notes}</Body> : null}
        </Card>
      ) : null}
    </View>
  );
}

function RowsTable({ rows }: { rows?: { label: string; die: number }[] }) {
  if (!rows?.length) return <Body muted>No powers recorded.</Body>;
  return (
    <View style={{ gap: 4 }}>
      {rows.map((r, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <DieBadge size={+r.die || 6} px={26} />
          <Body>{r.label}</Body>
        </View>
      ))}
    </View>
  );
}

/** Forms, modes, minion forms, and Divided notes: the book's auxiliary sheet. */
export function AuxSheet({ h, D }: { h: Hero; D: Derived }) {
  const c = useColors();
  const top = D.archTop, arch = D.arch;
  if (!top) return null;
  const abOf = (gid: string) => {
    const id = (h.sel[gid] || [])[0];
    const g = D.groups.find((x) => x.id === gid);
    const it = g?.items.find((x) => x.id === id);
    if (!it) return null;
    const cc = h.abil[gid + '|' + id] || {};
    return { name: (cc.name || '').trim() || it.name, type: it.type, text: fillText(it.text, cc.fills) };
  };
  const block = (title: string, zone: 'green' | 'yellow' | 'red' | 'out', rows: { label: string; die: number }[] | undefined, ab: { name: string; type: string; text: string } | null, rule?: string) => (
    <View key={title} style={{ borderWidth: 2, borderColor: c.line, borderRadius: radius.sm, overflow: 'hidden' }}>
      <View style={{ backgroundColor: c.zone[zone].bg, padding: 8, borderBottomWidth: 2, borderColor: c.line }}>
        <Title size={18}>{title}</Title>
      </View>
      <View style={{ padding: 8, gap: 6 }}>
        {rule ? <Body muted style={{ fontSize: 13 }}>{rule}</Body> : null}
        <RowsTable rows={rows} />
        {ab ? <Body style={{ fontSize: 14 }}><Text style={{ fontWeight: '900' }}>{ab.name}</Text> ({ab.type}) {ab.text}</Body> : null}
      </View>
    </View>
  );
  const parts = [];
  if (arch?.forms) {
    parts.push(
      <Card key="forms" title="Forms">
        {block(h.forms.g1?.name || 'Green form', 'green', h.forms.g1?.rows, abOf('form-g1'))}
        {block(h.forms.g2?.name || 'Green form', 'green', h.forms.g2?.rows, abOf('form-g2'))}
        {block(h.forms.y?.name || 'Yellow form', 'yellow', h.forms.y?.rows, abOf('form-y'))}
      </Card>,
    );
  }
  if (top.modular) {
    const modes = [];
    modes.push(block('Default Mode', 'green', D.powers.map((p) => ({ label: p.label, die: p.die })), null));
    if (h.arch.powerless) modes.push(block('Powerless Mode', 'out', h.modes['Powerless Mode']?.rows, null, 'Only principle abilities usable.'));
    for (const [gid, z] of [['mod-green', 'green'], ['mod-yellow', 'yellow'], ['mod-red', 'red']] as const) {
      const g = D.groups.find((x) => x.id === gid);
      for (const m of h.sel[gid] || []) {
        const it = g?.items.find((x) => x.id === m);
        if (!it) continue;
        const cc = h.abil[gid + '|' + m] || {};
        modes.push(block(m, z, h.modes[m]?.rows, { name: (cc.name || '').trim() || it.name, type: it.type, text: fillText(it.text, cc.fills) }, it.rule));
      }
    }
    parts.push(<Card key="modes" title="Modes">{modes}</Card>);
  }
  if (arch?.minionForms) {
    const chosen = h.arch.minionForms || [];
    parts.push(
      <Card key="minions" title="Minion forms">
        {MINION_FORMS.filter((f) => chosen.includes(f[0])).map((f) => (
          <Body key={f[0]} style={{ fontSize: 14 }}><Text style={{ fontWeight: '900' }}>{f[0]}</Text> ({f[2]}): {f[1]}</Body>
        ))}
        {!chosen.length && <Body muted>None chosen.</Body>}
        <Label style={{ marginTop: 6 }}>Minion chart</Label>
        {MINION_CHART.map((r) => <Body key={r[0]} style={{ fontSize: 14 }}>{r[0]}: {r[1]} minion, {r[2]}</Body>)}
      </Card>,
    );
  }
  if (top.divided) {
    parts.push(
      <Card key="div" title="Divided">
        <Body style={{ fontWeight: '800' }}>{h.arch.transition || 'Transformation method not chosen'}</Body>
        {h.arch.dividedNotes ? <Body>{h.arch.dividedNotes}</Body> : null}
      </Card>,
    );
  }
  return parts.length ? <View style={{ gap: space.md }}>{parts}</View> : null;
}
