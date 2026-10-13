import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { StatusDice } from '../../components/HeroSheet';
import { Body, Btn, Card, Empty, Field, Icon, PressScale, Segmented, Sheet, Title } from '../../components/ui';
import { archName, derive, healthZone, type Hero, type StepKey } from '../../engine/hero';
import { confirm, notice } from '../../lib/confirm';
import { notify } from '../../lib/haptics';
import { allHeroesJSON, heroJSON, parseHeroes, pasteText, pickHeroFile, shareJSON, slug } from '../../lib/transfer';
import { useStore, type ThemePref } from '../../store/store';
import { radius, space, useColors } from '../../theme';

export default function HeroesScreen() {
  const { state, hydrated, createHero, addHeroes, deleteHero, duplicateHero, setTheme } = useStore();
  const c = useColors();
  const [menu, setMenu] = useState<Hero | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const heroes = state.order.map((id) => state.heroes[id]).filter(Boolean);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 40, maxWidth: 760, width: '100%', alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Btn
            kind="yellow"
            icon="plus-thick"
            label="New hero"
            style={{ flex: 1 }}
            onPress={() => {
              const h = createHero();
              router.push(`/build/${h.id}`);
            }}
          />
          <Btn icon="import" label="Import" onPress={() => setImportOpen(true)} />
        </View>

        {hydrated && !heroes.length && (
          <Empty
            icon="star-four-points-outline"
            title="No heroes yet"
            body="Tap New hero to roll up a Sentinel Comics hero step by step, or import one from the Origin Story web builder."
          />
        )}

        {heroes.map((h) => (
          <HeroCard key={h.id} h={h} onMenu={() => setMenu(h)} />
        ))}

        {heroes.length > 1 && (
          <Btn kind="ghost" icon="export-variant" label="Export all heroes" onPress={() => shareJSON(`scrpg-heroes-${new Date().toISOString().slice(0, 10)}.json`, allHeroesJSON(state.heroes))} />
        )}

        <View style={{ marginTop: space.lg, gap: 6 }}>
          <Text style={{ color: c.muted, fontWeight: '800', fontSize: 11, letterSpacing: 1 }}>APPEARANCE</Text>
          <Segmented<ThemePref>
            value={state.theme}
            onChange={setTheme}
            options={[
              { value: 'system', label: 'Auto', icon: 'theme-light-dark' },
              { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
              { value: 'dark', label: 'Dark', icon: 'weather-night' },
            ]}
          />
          <Body muted style={{ fontSize: 12, marginTop: space.sm }}>
            Unofficial fan tool. Sentinel Comics: The Roleplaying Game is published by Greater Than Games; use the core rulebook for the full rules.
          </Body>
        </View>
      </ScrollView>

      <Sheet visible={!!menu} onClose={() => setMenu(null)} title={menu?.info.name || 'Unnamed hero'}>
        {menu && (
          <View style={{ gap: space.sm }}>
            <Btn icon="pencil" label="Edit in builder" onPress={() => { setMenu(null); router.push(`/build/${menu.id}`); }} />
            <Btn icon="card-account-details-outline" label="View hero sheet" onPress={() => { setMenu(null); router.push(`/build/${menu.id}?step=sheet`); }} />
            <Btn icon="content-duplicate" label="Duplicate" onPress={() => { duplicateHero(menu.id); setMenu(null); }} />
            <Btn icon="export-variant" label="Export JSON" onPress={() => shareJSON(slug(menu.info.name) + '.scrpg.json', heroJSON(menu))} />
            <Btn
              kind="danger"
              icon="delete"
              label="Delete"
              onPress={async () => {
                const h = menu;
                setMenu(null);
                if (await confirm(`Delete “${h.info.name || 'Unnamed hero'}”?`, 'This can’t be undone.')) deleteHero(h.id);
              }}
            />
          </View>
        )}
      </Sheet>

      <ImportSheet
        visible={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={(list) => {
          const fresh = list.map((h) => (state.heroes[h.id] ? { ...h, id: Math.random().toString(36).slice(2, 10) } : h));
          addHeroes(fresh);
          notify('success');
          setImportOpen(false);
          notice('Imported', fresh.length > 1 ? `${fresh.length} heroes added.` : `“${fresh[0].info.name || 'Hero'}” added.`);
        }}
      />
    </View>
  );
}

function HeroCard({ h, onMenu }: { h: Hero; onMenu: () => void }) {
  const c = useColors();
  const D = useMemo(() => derive(h), [h]);
  const done = (Object.keys(D.done) as StepKey[]).filter((k) => D.done[k]).length;
  const complete = done === 8;
  const max = D.health.max;
  const hp = h.play.health ?? max ?? null;
  const zone = max ? healthZone(D, hp) : null;
  return (
    <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
      <PressScale onPress={() => router.push(complete ? `/play/${h.id}` : `/build/${h.id}`)} style={{ padding: space.md, gap: 6 }} haptic>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <Title size={28}>{h.info.name || 'Unnamed hero'}</Title>
            <Body muted numberOfLines={1}>{[D.ps?.name, archName(D), D.pers?.name].filter(Boolean).join(' · ') || 'Just getting started'}</Body>
          </View>
          <PressScale onPress={onMenu} accessibilityLabel="Hero options" hitSlop={10}>
            <Icon name="dots-vertical" size={26} color={c.ink} />
          </PressScale>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, flexWrap: 'wrap' }}>
          {D.status ? <StatusDice status={D.status} px={26} /> : null}
          {max ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: zone ? c.zone[zone].bg : c.panel2, borderWidth: 2, borderColor: c.line, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 2 }}>
              <Icon name="heart" size={16} color={zone ? c.zone[zone].fg : c.red} />
              <Text style={{ fontWeight: '900', color: c.ink }}>{hp}/{max}</Text>
            </View>
          ) : null}
        </View>
        {!complete && (
          <View style={{ gap: 4 }}>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: c.panel2, borderWidth: 1.5, borderColor: c.line, overflow: 'hidden' }}>
              <View style={{ width: `${(done / 8) * 100}%`, height: '100%', backgroundColor: c.green }} />
            </View>
            <Body muted style={{ fontSize: 12 }}>{done}/8 steps complete. Tap to keep building.</Body>
          </View>
        )}
      </PressScale>
      <View style={{ flexDirection: 'row', borderTopWidth: 2, borderColor: c.line }}>
        <PressScale onPress={() => router.push(`/build/${h.id}`)} containerStyle={{ flex: 1 }} style={{ flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 }}>
          <Icon name="hammer-wrench" size={18} color={c.ink} />
          <Text style={{ fontWeight: '800', color: c.ink }}>Build</Text>
        </PressScale>
        <PressScale onPress={() => router.push(`/play/${h.id}`)} containerStyle={{ flex: 1 }} style={{ flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, backgroundColor: c.yellow, borderLeftWidth: 2, borderColor: c.line }}>
          <Icon name="sword-cross" size={18} color={c.onAccent} />
          <Text style={{ fontWeight: '900', color: c.onAccent }}>Play</Text>
        </PressScale>
      </View>
    </Card>
  );
}

function ImportSheet({ visible, onClose, onImport }: { visible: boolean; onClose: () => void; onImport: (h: Hero[]) => void }) {
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const c = useColors();
  const tryImport = (t: string) => {
    try {
      onImport(parseHeroes(t));
      setText('');
      setErr('');
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  return (
    <Sheet visible={visible} onClose={onClose} title="Import heroes">
      <View style={{ gap: space.sm }}>
        <Body muted>Works with files exported from this app or the Origin Story web builder (.scrpg.json).</Body>
        <Btn
          kind="primary"
          icon="file-upload-outline"
          label="Choose a file"
          onPress={async () => {
            try {
              const t = await pickHeroFile();
              if (t) tryImport(t);
            } catch (e) {
              setErr((e as Error).message);
            }
          }}
        />
        <Btn icon="clipboard-arrow-down-outline" label="Paste from clipboard" onPress={async () => tryImport(await pasteText())} />
        <Field multiline value={text} onChangeText={setText} placeholder="…or paste the JSON here" autoCapitalize="none" autoCorrect={false} />
        {text ? <Btn label="Import pasted text" icon="check" onPress={() => tryImport(text)} /> : null}
        {err ? <Text style={{ color: c.red, fontWeight: '700' }}>{err}</Text> : null}
      </View>
    </Sheet>
  );
}
