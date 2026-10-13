import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { ActionIcons, ACTION_ICONS } from '../../components/abilityBits';
import { Body, Card, Icon, PressScale, type IconName } from '../../components/ui';
import { MINION_CHART, MINION_FORMS, POWER_CATS, PRINCIPLES, QUALITY_CATS, RED_ABILITIES } from '../../data/rules';
import { ACTIONS } from '../../engine/hero';
import { radius, space, useColors } from '../../theme';

type Entry = { title: string; body: string; sub?: string; icon?: IconName };
type Sec = { id: string; title: string; icon: IconName; entries: Entry[] };

// Short reminders only; the core rulebook has the full rules.
const BASICS: Entry[] = [
  { title: 'Your dice pool', body: 'Roll one power die, one quality die, and your current status die. Line them up from lowest to highest: Min, Mid, and Max.' },
  { title: 'The effect die', body: 'A basic action uses your Mid die as its effect unless an ability says otherwise (for example “use your Max die” or “Max+Min”).' },
  { title: 'Status and zones', body: 'Your status die is whichever is closer to Out: the zone your Health is in, or the scene tracker’s zone.' },
  { title: 'Which abilities you can use', body: 'Green abilities are always available. Yellow abilities open up in the Yellow and Red zones, and Red abilities in the Red zone. Your Out ability is for when you’re taken out.' },
  { title: 'Bonuses and penalties', body: 'Boosts create bonuses and Hinders create penalties that add to or subtract from an effect. A persistent one stays after it’s used; an exclusive one can only be used by whoever made it.' },
  { title: 'Doubles and ones', body: 'Some abilities trigger on rolling doubles or on rolling a 1. The roller points both out for you.' },
];
const ACTION_TEXT: Record<string, string> = {
  Attack: 'Deal damage to a target.',
  Defend: 'Reduce damage coming at you.',
  Overcome: 'Deal with an obstacle, challenge, or problem in the scene.',
  Boost: 'Create a bonus for yourself or an ally.',
  Hinder: 'Create a penalty on an opponent.',
  Recover: 'Regain Health.',
};

function buildSections(): Sec[] {
  return [
    { id: 'basics', title: 'How rolls work', icon: 'dice-multiple', entries: BASICS },
    { id: 'actions', title: 'Basic actions', icon: 'sword', entries: ACTIONS.map((a) => ({ title: a, body: ACTION_TEXT[a], icon: ACTION_ICONS[a] })) },
    {
      id: 'powers',
      title: 'Powers',
      icon: 'flash',
      entries: Object.entries(POWER_CATS).flatMap(([cat, v]) => Object.entries(v.items).map(([k, d]) => ({ title: k, sub: cat, body: d }))),
    },
    {
      id: 'qualities',
      title: 'Qualities',
      icon: 'account-star',
      entries: Object.entries(QUALITY_CATS).flatMap(([cat, v]) => Object.entries(v.items).map(([k, d]) => ({ title: k, sub: cat, body: d }))),
    },
    {
      id: 'principles',
      title: 'Principles & twists',
      icon: 'compass-rose',
      entries: PRINCIPLES.map((p) => ({ title: p[0], sub: p[1], body: `${p[2]}\n\nMinor twist: ${p[3]}\nMajor twist: ${p[4]}\n\nGreen ability: ${p[5]}` })),
    },
    {
      id: 'red',
      title: 'Red abilities',
      icon: 'fire',
      entries: Object.entries(RED_ABILITIES).flatMap(([cat, v]) => v.list.map((a) => ({ title: a[0], sub: `${cat} ${v.kind} · ${a[1]}`, body: a[2] }))),
    },
    {
      id: 'minions',
      title: 'Minion chart & forms',
      icon: 'account-group',
      entries: [
        ...MINION_CHART.map((r) => ({ title: `${r[0]} → ${r[1]} minion`, body: r[2] })),
        ...MINION_FORMS.map((f) => ({ title: f[0], sub: `bonus ${f[2]}`, body: f[1] })),
      ],
    },
  ];
}

export default function RulesScreen() {
  const c = useColors();
  const sections = useMemo(buildSections, []);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>('basics');
  const needle = q.trim().toLowerCase();
  const shown = sections
    .map((s) => ({ ...s, entries: needle ? s.entries.filter((e) => (e.title + ' ' + (e.sub || '') + ' ' + e.body).toLowerCase().includes(needle)) : s.entries }))
    .filter((s) => s.entries.length);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 60, maxWidth: 760, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 2, borderColor: c.line, borderRadius: radius.sm, backgroundColor: c.panel, paddingHorizontal: 10 }}>
        <Icon name="magnify" size={20} color={c.muted} />
        <TextInput value={q} onChangeText={setQ} placeholder="Search powers, principles, abilities…" placeholderTextColor={c.faint} style={{ flex: 1, color: c.ink, fontSize: 16, paddingVertical: 11 }} autoCorrect={false} />
        {q ? (
          <PressScale onPress={() => setQ('')} accessibilityLabel="Clear search">
            <Icon name="close-circle" size={20} color={c.muted} />
          </PressScale>
        ) : null}
      </View>
      {shown.map((s) => {
        const isOpen = !!needle || open === s.id;
        return (
          <Card key={s.id} style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
            <PressScale onPress={() => setOpen(isOpen && !needle ? null : s.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: space.md }}>
              <Icon name={s.icon} size={22} color={c.blue} />
              <Text style={{ flex: 1, fontWeight: '900', fontSize: 17, color: c.ink }}>{s.title}</Text>
              <Text style={{ color: c.muted, fontWeight: '700' }}>{s.entries.length}</Text>
              <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={22} color={c.muted} />
            </PressScale>
            {isOpen && (
              <View style={{ paddingHorizontal: space.md, paddingBottom: space.md, gap: 10 }}>
                {s.entries.map((e) => (
                  <View key={e.title + (e.sub || '')} style={{ gap: 2, borderTopWidth: 1, borderColor: c.panel2, paddingTop: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {e.icon ? <Icon name={e.icon} size={18} color={c.ink} /> : null}
                      <Text style={{ fontWeight: '900', color: c.ink, fontSize: 15, flex: 1 }}>{e.title}</Text>
                      {s.id === 'red' || s.id === 'principles' ? <ActionIcons text={e.body} /> : null}
                    </View>
                    {e.sub ? <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700' }}>{e.sub}</Text> : null}
                    <Body style={{ fontSize: 14 }}>{e.body}</Body>
                  </View>
                ))}
              </View>
            )}
          </Card>
        );
      })}
      <Body muted style={{ fontSize: 12 }}>Short reminders for the table. Sentinel Comics: The Roleplaying Game is published by Greater Than Games; the core rulebook has the full rules.</Body>
    </ScrollView>
  );
}
