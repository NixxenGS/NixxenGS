// Avatar Legends reference data. Move and rule summaries are short
// paraphrases meant as table reminders; the core book is the authority.
import type { IconName } from '../components/ui';
import { elementColors } from '../theme';

export type StatKey = 'creativity' | 'focus' | 'harmony' | 'passion';

export const STATS: { key: StatKey; label: string; short: string }[] = [
  { key: 'creativity', label: 'Creativity', short: 'CRE' },
  { key: 'focus', label: 'Focus', short: 'FOC' },
  { key: 'harmony', label: 'Harmony', short: 'HAR' },
  { key: 'passion', label: 'Passion', short: 'PAS' },
];

export const STAT_MIN = -1;
export const STAT_MAX = 3;

export type TrainingKey = keyof typeof elementColors;

export const TRAININGS: { key: TrainingKey; label: string; icon: IconName }[] = [
  { key: 'water', label: 'Waterbending', icon: 'water' },
  { key: 'earth', label: 'Earthbending', icon: 'terrain' },
  { key: 'fire', label: 'Firebending', icon: 'fire' },
  { key: 'air', label: 'Airbending', icon: 'weather-windy' },
  { key: 'weapons', label: 'Weapons', icon: 'sword' },
  { key: 'technology', label: 'Technology', icon: 'cog' },
];

export type Playbook = {
  id: string;
  name: string;
  principles: [string, string];
  pitch: string;
};

export const PLAYBOOKS: Playbook[] = [
  { id: 'adamant', name: 'The Adamant', principles: ['Restraint', 'Results'], pitch: 'Stubborn and driven, willing to bend rules to do what is right.' },
  { id: 'bold', name: 'The Bold', principles: ['Loyalty', 'Confidence'], pitch: 'Eager to prove themselves and earn their place among friends.' },
  { id: 'guardian', name: 'The Guardian', principles: ['Self-Reliance', 'Trust'], pitch: 'Watchful protector of someone they hold dear.' },
  { id: 'hammer', name: 'The Hammer', principles: ['Force', 'Care'], pitch: 'A powerhouse set on bringing down an adversary.' },
  { id: 'icon', name: 'The Icon', principles: ['Role', 'Freedom'], pitch: 'Heir to a weighty legacy, torn between duty and self.' },
  { id: 'idealist', name: 'The Idealist', principles: ['Forgiveness', 'Action'], pitch: 'Hopeful heart that refuses to let the world stay broken.' },
  { id: 'pillar', name: 'The Pillar', principles: ['Support', 'Leadership'], pitch: 'The steady center the rest of the group leans on.' },
  { id: 'prodigy', name: 'The Prodigy', principles: ['Excellence', 'Community'], pitch: 'Exceptionally gifted, still learning where they fit.' },
  { id: 'rogue', name: 'The Rogue', principles: ['Friendship', 'Survival'], pitch: 'Scrappy outsider learning to trust people again.' },
  { id: 'successor', name: 'The Successor', principles: ['Tradition', 'Progress'], pitch: 'Child of a powerful family, questioning its path.' },
];

export const CUSTOM_PLAYBOOK_ID = 'custom';

export const ERAS = ['Kyoshi Era', 'Roku Era', 'Hundred Year War Era', 'Aang Era', 'Korra Era'];

export type ConditionKey = 'afraid' | 'angry' | 'guilty' | 'insecure' | 'troubled';

export type Condition = {
  key: ConditionKey;
  label: string;
  penalties: MoveId[];
  bonuses?: MoveId[];
  effect: string;
  clear: string;
};

export type MoveId =
  | 'assess'
  | 'guide'
  | 'intimidate'
  | 'plead'
  | 'push'
  | 'rely'
  | 'trick'
  | 'callout'
  | 'deny'
  | 'resist'
  | 'liveup'
  | 'defend'
  | 'advance'
  | 'evade';

export const CONDITIONS: Condition[] = [
  { key: 'afraid', label: 'Afraid', penalties: ['intimidate', 'callout'], effect: '-2 to intimidate and to call someone out.', clear: 'Run from something difficult.' },
  { key: 'angry', label: 'Angry', penalties: ['guide', 'assess'], effect: '-2 to guide and comfort and to assess a situation.', clear: 'Break something important.' },
  { key: 'guilty', label: 'Guilty', penalties: ['push'], bonuses: ['deny'], effect: '-2 to push your luck, +2 to deny a callout.', clear: 'Make a personal sacrifice to absolve your guilt.' },
  { key: 'insecure', label: 'Insecure', penalties: ['trick', 'resist'], effect: '-2 to trick and to resist shifting your balance.', clear: 'Take foolhardy action without talking to your companions.' },
  { key: 'troubled', label: 'Troubled', penalties: ['plead', 'rely'], effect: '-2 to plead and to rely on your skills and training.', clear: 'Seek guidance from a mentor or respected figure.' },
];

export const CONDITION_PENALTY = 2;

export type MoveRoll = { kind: 'stat'; stat: StatKey } | { kind: 'principle' } | { kind: 'none' };

export type Move = {
  id: MoveId;
  name: string;
  group: 'basic' | 'balance' | 'exchange';
  roll: MoveRoll;
  summary: string;
  hit: string;
  mixed: string;
  miss: string;
};

export const MOVES: Move[] = [
  { id: 'assess', name: 'Assess a Situation', group: 'basic', roll: { kind: 'stat', stat: 'creativity' }, summary: 'Take a careful look at a tense or uncertain situation.', hit: 'Ask the GM two questions; take +1 when acting on the answers.', mixed: 'Ask one question.', miss: 'You misread something. The GM makes a move.' },
  { id: 'guide', name: 'Guide and Comfort', group: 'basic', roll: { kind: 'stat', stat: 'harmony' }, summary: 'Offer honest support or guidance to someone.', hit: 'They open up, and may shift balance or clear a condition as they accept it.', mixed: 'They listen, but it costs you or them something.', miss: 'Your words land badly. The GM makes a move.' },
  { id: 'intimidate', name: 'Intimidate an NPC', group: 'basic', roll: { kind: 'stat', stat: 'passion' }, summary: 'Use force of personality or a threat to make an NPC back down.', hit: 'They choose how they give way: flee, back down, give in, or attack at a disadvantage.', mixed: 'They give way, but in their own manner.', miss: 'They call your bluff. The GM makes a move.' },
  { id: 'plead', name: 'Plead with an NPC', group: 'basic', roll: { kind: 'stat', stat: 'harmony' }, summary: 'Ask an NPC who cares what you think for help.', hit: 'They agree and act in good faith.', mixed: 'They agree, but want something in return.', miss: 'They refuse or misunderstand. The GM makes a move.' },
  { id: 'push', name: 'Push Your Luck', group: 'basic', roll: { kind: 'stat', stat: 'passion' }, summary: 'Take a risky action where everything could go either way.', hit: 'You pull it off.', mixed: 'You do it, but there is a cost or complication.', miss: 'It falls apart. The GM makes a move.' },
  { id: 'rely', name: 'Rely on Your Skills and Training', group: 'basic', roll: { kind: 'stat', stat: 'focus' }, summary: 'Use your expertise when the pressure is on.', hit: 'You succeed, and well.', mixed: 'You succeed, but with a hitch or a cost.', miss: 'Your training fails you. The GM makes a move.' },
  { id: 'trick', name: 'Trick an NPC', group: 'basic', roll: { kind: 'stat', stat: 'creativity' }, summary: 'Mislead or distract an NPC.', hit: 'They fall for it completely.', mixed: 'They fall for it, but only partly or briefly.', miss: 'They see through you. The GM makes a move.' },
  { id: 'callout', name: 'Call Someone Out', group: 'balance', roll: { kind: 'principle' }, summary: 'Appeal to someone’s principle to push them to act.', hit: 'They must act as you ask or mark a condition.', mixed: 'They choose: act, or shift their balance away from that principle.', miss: 'They see you differently. Shift your own balance.' },
  { id: 'deny', name: 'Deny a Callout', group: 'balance', roll: { kind: 'principle' }, summary: 'Refuse to be swayed when called out.', hit: 'You stand firm.', mixed: 'You hold, but the doubt lingers.', miss: 'You must do as they say or mark a condition.' },
  { id: 'resist', name: 'Resist Shifting Your Balance', group: 'balance', roll: { kind: 'principle' }, summary: 'Hold your center when someone tries to shift your balance.', hit: 'You resist completely.', mixed: 'You resist, but at a cost.', miss: 'Your balance shifts.' },
  { id: 'liveup', name: 'Live Up to Your Principle', group: 'balance', roll: { kind: 'none' }, summary: 'Act strongly in line with a principle. Mark fatigue to bring its strength to bear.', hit: '', mixed: '', miss: '' },
  { id: 'defend', name: 'Defend & Maneuver', group: 'exchange', roll: { kind: 'stat', stat: 'focus' }, summary: 'Hold your ground, protect others, reposition.', hit: 'Use two techniques.', mixed: 'Use one technique.', miss: 'Your opponent seizes the moment. The GM decides how.' },
  { id: 'advance', name: 'Advance & Attack', group: 'exchange', roll: { kind: 'stat', stat: 'passion' }, summary: 'Press forward and strike.', hit: 'Use two techniques.', mixed: 'Use one technique.', miss: 'Your opponent seizes the moment. The GM decides how.' },
  { id: 'evade', name: 'Evade & Observe', group: 'exchange', roll: { kind: 'stat', stat: 'creativity' }, summary: 'Stay out of reach and read the fight.', hit: 'Use two techniques.', mixed: 'Use one technique.', miss: 'Your opponent seizes the moment. The GM decides how.' },
];

export const moveById = (id: MoveId) => MOVES.find((m) => m.id === id)!;

export const STATUSES = {
  positive: ['Empowered', 'Favored', 'Inspired', 'Prepared'],
  negative: ['Doomed', 'Impaired', 'Trapped', 'Stunned'],
};

export const FATIGUE_MAX = 5;
export const BALANCE_LIMIT = 3;
export const GROWTH_MAX = 4;

export type TechniqueLevel = 'learned' | 'practiced' | 'mastered';
export const TECHNIQUE_LEVELS: TechniqueLevel[] = ['learned', 'practiced', 'mastered'];
export type Approach = 'defend' | 'advance' | 'evade';

export type Outcome = 'hit' | 'mixed' | 'miss';
export const outcomeFor = (total: number): Outcome => (total >= 10 ? 'hit' : total >= 7 ? 'mixed' : 'miss');
export const OUTCOME_LABEL: Record<Outcome, string> = {
  hit: 'Strong hit',
  mixed: 'Weak hit',
  miss: 'Miss',
};
