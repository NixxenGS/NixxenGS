import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BuilderContext } from '../../components/builder/context';
import {
  ArchetypeStep, BackgroundStep, FinishStep, HealthStep, PersonalityStep, PowerSourceStep, RedStep, RetconStep,
} from '../../components/builder/steps';
import { HeroSheet, StatusDice, TraitTable } from '../../components/HeroSheet';
import { Body, Btn, Chip, Empty, Icon, Label, PressScale, Segmented, Sheet, Title } from '../../components/ui';
import { archName, sheetText, STEPS, stepTouched, type Derived, type Hero, type StepKey } from '../../engine/hero';
import { notify } from '../../lib/haptics';
import { copyText, heroJSON, shareJSON, slug } from '../../lib/transfer';
import { useHero } from '../../store/store';
import { comicShadow, fonts, radius, space, useColors } from '../../theme';

type Tab = StepKey | 'sheet';
const STEP_VIEWS: Record<StepKey, () => React.JSX.Element> = {
  bg: BackgroundStep, ps: PowerSourceStep, arch: ArchetypeStep, pers: PersonalityStep,
  red: RedStep, retcon: RetconStep, health: HealthStep, finish: FinishStep,
};

export default function BuildScreen() {
  const { id, step } = useLocalSearchParams<{ id: string; step?: string }>();
  const { hero: h, D, update } = useHero(id);
  const c = useColors();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  const chips = useRef<ScrollView>(null);
  const [summary, setSummary] = useState(false);
  const [toast, setToast] = useState('');
  const firstOpen = useMemo(() => {
    if (step && STEPS.some((s) => s[0] === step)) return step as Tab;
    if (!D) return 'bg';
    return (STEPS.find(([k]) => k !== 'sheet' && !D.done[k as StepKey])?.[0] as Tab) ?? 'sheet';
    // Only decide the opening step once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [tab, setTab] = useState<Tab>(firstOpen);

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
    const i = STEPS.findIndex((s) => s[0] === tab);
    chips.current?.scrollTo({ x: Math.max(0, i * 92 - 80), animated: true });
  }, [tab]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!h || !D) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <Stack.Screen options={{ title: 'Hero' }} />
        <Empty icon="account-question" title="Hero not found" body="It may have been deleted." />
      </View>
    );
  }

  const i = STEPS.findIndex((s) => s[0] === tab);
  const prev = STEPS[i - 1], next = STEPS[i + 1];
  const View_ = tab === 'sheet' ? null : STEP_VIEWS[tab];
  const allDone = (Object.keys(D.done) as StepKey[]).every((k) => D.done[k]);

  return (
    <BuilderContext.Provider value={{ h, D, update, goTo: (k) => setTab(k as Tab) }}>
      <Stack.Screen options={{ title: h.info.name || 'New Hero' }} />
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        {/* step chips */}
        <View style={{ borderBottomWidth: 2, borderColor: c.line, backgroundColor: c.blue }}>
          <ScrollView ref={chips} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: space.sm, gap: 6 }}>
            {STEPS.map(([k, n, label]) => {
              const on = k === tab;
              const done = k !== 'sheet' && D.done[k as StepKey];
              const touched = k !== 'sheet' && stepTouched(h, D, k as StepKey);
              return (
                <PressScale
                  key={k}
                  onPress={() => setTab(k as Tab)}
                  accessibilityLabel={`${label}${done ? ', complete' : ''}`}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.sm,
                    borderWidth: 2, borderColor: c.line, backgroundColor: on ? c.yellow : c.panel, ...(on ? comicShadow(c, 2) : {}),
                  }}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? c.green : touched ? c.orange : c.ink }}>
                    {done ? <Icon name="check-bold" size={14} color="#fff" /> : <Text style={{ fontFamily: fonts.display, color: done || touched ? '#fff' : c.bg, fontSize: 13 }}>{n}</Text>}
                  </View>
                  <Text style={{ fontWeight: '800', color: on ? c.onAccent : c.ink, fontSize: 13 }}>{label}</Text>
                </PressScale>
              );
            })}
          </ScrollView>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
          <ScrollView ref={scroll} contentContainerStyle={{ padding: space.lg, paddingBottom: 120, maxWidth: 760, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
            {tab !== 'sheet' && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm, marginBottom: space.md }}>
                <View style={{ flexGrow: 1, minWidth: 220 }}>
                  <Segmented
                    value={h.method}
                    onChange={(v) => update((x) => { x.method = v; })}
                    options={[{ value: 'guided', label: 'Guided (roll)', icon: 'dice-multiple' }, { value: 'constructed', label: 'Constructed', icon: 'pencil' }]}
                  />
                </View>
                <Chip
                  icon={h.bend ? 'alert' : 'gavel'}
                  label={h.bend ? 'Rules bent' : 'Bend rules'}
                  active={h.bend}
                  color={c.red}
                  onPress={() => {
                    update((x) => { x.bend = !x.bend; });
                    setToast(h.bend ? 'Back to the book’s restrictions' : 'Rules bent: any option allowed (with GM permission!)');
                  }}
                />
              </View>
            )}
            {View_ ? <View_ /> : <SheetTab h={h} D={D} onGoStep={(k) => setTab(k)} onToast={setToast} />}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* bottom nav */}
        <View style={{ flexDirection: 'row', gap: space.sm, padding: space.sm, paddingBottom: insets.bottom + space.sm, borderTopWidth: 2, borderColor: c.line, backgroundColor: c.panel }}>
          <Btn icon="chevron-left" disabled={!prev} onPress={() => prev && setTab(prev[0] as Tab)} accessibilityLabel={prev ? `Back to ${prev[2]}` : 'Back'} />
          <PressScale onPress={() => setSummary(true)} containerStyle={{ flex: 1 }} style={{ flex: 1, minHeight: 44, borderWidth: 2, borderColor: c.line, borderRadius: radius.sm, backgroundColor: c.panel2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
            <Text style={{ fontWeight: '900', color: c.ink, fontSize: 13 }} numberOfLines={1}>Hero so far</Text>
            <Text style={{ color: c.muted, fontSize: 11 }} numberOfLines={1}>{D.powers.length} powers · {D.qualities.length} qualities{D.health.max ? ` · ❤ ${D.health.max}` : ''}</Text>
          </PressScale>
          {next ? (
            <Btn kind="primary" icon="chevron-right" label={next[2]} onPress={() => setTab(next[0] as Tab)} />
          ) : (
            <Btn kind="yellow" icon="sword-cross" label="Play" onPress={() => router.replace(`/play/${h.id}`)} />
          )}
        </View>

        {toast ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: space.lg, right: space.lg, bottom: insets.bottom + 90, alignItems: 'center' }}>
            <View style={{ backgroundColor: c.ink, borderRadius: radius.sm, paddingVertical: 10, paddingHorizontal: 16 }}>
              <Text style={{ color: c.bg, fontWeight: '800' }}>{toast}</Text>
            </View>
          </View>
        ) : null}

        <Sheet visible={summary} onClose={() => setSummary(false)} title={h.info.name || 'Your hero'}>
          <ScrollView style={{ maxHeight: 560 }}>
            <Body muted>{[D.bg?.name, D.ps?.name, archName(D), D.pers?.name].filter(Boolean).join(' · ') || 'Start with a background.'}</Body>
            <Label style={{ marginTop: space.md }}>Powers</Label>
            <TraitTable list={D.powers} />
            <Label style={{ marginTop: space.md }}>Qualities</Label>
            <TraitTable list={D.qualities} />
            <Label style={{ marginTop: space.md, marginBottom: 4 }}>Status & Health</Label>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
              <StatusDice status={D.status} px={30} />
              {D.health.max ? <Title size={26}>❤ {D.health.max}</Title> : null}
            </View>
            <Label style={{ marginTop: space.md }}>Principles</Label>
            {D.principles.length ? D.principles.map((p) => <Body key={p.slot}>{p.p[0]}</Body>) : <Body muted>None yet</Body>}
            <Label style={{ marginTop: space.md }}>Abilities</Label>
            <Body>
              Green {D.abilities.green.length + D.abilities.principles.length} · Yellow {D.abilities.yellow.length} · Red {D.abilities.red.length}
            </Body>
            {allDone ? <Btn style={{ marginTop: space.md }} kind="yellow" icon="sword-cross" label="Hero complete. Play!" onPress={() => { setSummary(false); router.replace(`/play/${h.id}`); }} /> : null}
          </ScrollView>
        </Sheet>
      </View>
    </BuilderContext.Provider>
  );
}

function SheetTab({ h, D, onGoStep, onToast }: { h: Hero; D: Derived; onGoStep: (k: StepKey) => void; onToast: (s: string) => void }) {
  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        <Btn kind="yellow" icon="sword-cross" label="Play this hero" onPress={() => router.replace(`/play/${h.id}`)} />
        <Btn icon="content-copy" label="Copy as text" onPress={() => copyText(sheetText(h, D)).then(() => { notify('success'); onToast('Copied to clipboard'); })} />
        <Btn icon="export-variant" label="Export JSON" onPress={() => shareJSON(slug(h.info.name) + '.scrpg.json', heroJSON(h))} />
      </View>
      <HeroSheet h={h} D={D} onGoStep={onGoStep} />
    </View>
  );
}
