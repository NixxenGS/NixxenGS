import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CharacterCard } from '../../components/CharacterCard';
import { Button, EmptyState } from '../../components/ui';
import { useStore } from '../../store/store';
import { colors, space, type } from '../../theme';

export default function PartyScreen() {
  const { state, hydrated } = useStore();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg }]}
    >
      <View style={styles.header}>
        <View>
          <Text style={type.label}>Avatar Legends</Text>
          <Text style={type.title}>Your Party</Text>
        </View>
      </View>

      {!hydrated ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: space.xxl }} />
      ) : state.characters.length === 0 ? (
        <EmptyState
          icon="account-plus"
          title="No characters yet"
          body="Create a hero to track stats, balance, conditions, fatigue and techniques, then roll moves with everything applied."
          action={<Button label="Create character" icon="plus" onPress={() => router.push('/new')} />}
        />
      ) : (
        <>
          {state.characters.map((c, i) => (
            <Animated.View key={c.id} entering={FadeInDown.delay(i * 60).springify()}>
              <CharacterCard character={c} onPress={() => router.push(`/character/${c.id}`)} />
            </Animated.View>
          ))}
          <Button label="New character" icon="plus" variant="ghost" onPress={() => router.push('/new')} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: space.sm },
});
