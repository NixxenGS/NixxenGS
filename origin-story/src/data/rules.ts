// Sentinel Comics RPG rules data, carried over unchanged from the Origin Story web builder
// so heroes exported from either app stay interchangeable. Transcribed from the SCRPG core
// rulebook for personal use.
import type {
  ModeDef,
  ArchetypeDef, BackgroundDef, PersonalityDef, PowerSourceDef, PrincipleRow, RawAbility, TraitCatalog,
} from './types';

// Backgrounds (Step 1). q = qualities list; "@Mental" = any from that category
export const BACKGROUNDS: BackgroundDef[] = [
 {n:1,name:"Upper Class",assign:[10,8],count:2,q:["Fitness","Persuasion","@Mental"],principle:"Responsibility",roll:[10,8,8],blurb:"Born into the upper echelons of society — and likely rich."},
 {n:2,name:"Blank Slate",assign:[10,8],count:2,q:["@Mental","@Physical"],principle:"Identity",roll:[10,8,8],blurb:"You remember nothing. Your history starts now."},
 {n:3,name:"Struggling",assign:[8,6,6],count:3,q:["Banter","Criminal Underworld Info","@Physical"],principle:"Responsibility",roll:[8,8,6],blurb:"Down and out, low on resources and luck, doing your best."},
 {n:4,name:"Adventurer",assign:[10,8],count:2,q:["History","Leadership","@Physical"],principle:"Expertise",roll:[8,8,8],blurb:"A thrill-seeker who chased excitement long before heroics."},
 {n:5,name:"Unremarkable",assign:[10,8],count:2,q:["Close Combat","@Mental","@Social"],principle:"Identity",roll:[10,8,6],blurb:"A regular person until something changed your life."},
 {n:6,name:"Law Enforcement",assign:[10,8],count:2,q:["Close Combat","Criminal Underworld Info","Ranged Combat","@Mental","@Social"],principle:"Responsibility",roll:[10,8,6],blurb:"Cop, detective, lawyer, or judge — you made a career of the law."},
 {n:7,name:"Academic",assign:[12,8],count:2,q:["Leadership","Self-Discipline","@Information"],principle:"Expertise",roll:[10,8],blurb:"Teacher, professor, researcher — the pursuit of knowledge drives you."},
 {n:8,name:"Tragic",assign:[10,8],count:2,q:["Banter","Close Combat","Imposing","@Mental"],principle:"Ideals",roll:[10,10,6],blurb:"A major tragedy both fuels and haunts you."},
 {n:9,name:"Performer",assign:[10,8],count:2,q:["Acrobatics","Creativity","Finesse","@Social"],principle:"Responsibility",roll:[10,8,6],blurb:"Born for the stage; how you present yourself matters."},
 {n:10,name:"Military",assign:[10,8],count:2,q:["Leadership","Self-Discipline","@Physical"],principle:"Ideals",roll:[10,8,8],blurb:"Combat training, possibly real combat experience."},
 {n:11,name:"Retired",assign:[10,10],count:2,q:["@Information","@Social"],principle:"Identity",roll:[12,6,6],blurb:"You hung up the cape long ago — now you're back."},
 {n:12,name:"Criminal",assign:[10,8],count:2,q:["Criminal Underworld Info","Imposing","@Physical"],principle:"Expertise",roll:[8,8,8],blurb:"Once on the wrong side of the law; now you've turned over a new leaf."},
 {n:13,name:"Medical",assign:[10,8,6],count:3,required:"Medicine",q:["Finesse","Science","Technology","@Mental"],principle:"Expertise",roll:[10,8,8],blurb:"Doctor, nurse, or vet — experienced in treating injury and disease.",note:"Assign one of the dice to Medicine, the other two to two of the listed qualities."},
 {n:14,name:"Anachronistic",assign:[10,8],count:2,q:["History","Magical Lore","Technology","@Physical"],principle:"Esoteric",roll:[10,8,6],blurb:"Not quite of this time — but you fight to protect it."},
 {n:15,name:"Exile",assign:[10,8],count:2,q:["Conviction","Insight","@Information"],principle:"Ideals",roll:[8,8,8],blurb:"Far from home, by choice or not, making your own way."},
 {n:16,name:"Former Villain",assign:[10,8],count:2,q:["Conviction","@Information","@Social"],principle:"Expertise",roll:[10,8,8],blurb:"A foe of heroes who changed stripes. Many still don't trust you."},
 {n:17,name:"Interstellar",assign:[12,6],count:2,q:["@Information","@Mental"],principle:"Esoteric",roll:[10,8,6],blurb:"You come from beyond the stars."},
 {n:18,name:"Dynasty",assign:[10,10],count:2,q:["Close Combat","Fitness","History","@Social"],principle:"Ideals",roll:[8,8,6],blurb:"You come from a line of heroes."},
 {n:19,name:"Otherworldly",assign:[10,8],count:2,q:["Magical Lore","Otherworldly Mythos","@Mental"],principle:"Esoteric",roll:[10,6,6],blurb:"There's at least a little of the uncanny in you."},
 {n:20,name:"Created",assign:[12,6],count:2,q:["Alertness","Science","Technology","@Physical"],principle:"Expertise",roll:[10,10,6],blurb:"Built by someone or something, you still feel drawn to heroism."}
];

// Power Sources (Step 2). p = powers list; "@Athletic" = any power from category
export const POWER_SOURCES: PowerSourceDef[] = [
 {n:1,name:"Accident",blurb:"An external source — or the cure for an accident — caused you to manifest powers.",
  p:["@Athletic","@Elemental/Energy","@Intellectual","@Materials","@Psychic","@Self Control"],
  yellow:{count:2,diff:true,list:[
   ["Area Alteration","A","[Boost or Hinder] any number of nearby targets using [power]. Use your Max die."],
   ["Inflict","A","Attack using [power]. Hinder that same target using your Min die."],
   ["Reflexive Burst","R","When your personal zone changes, Attack all close enemy targets by rolling your single [power] die."]]},
  green:{count:1,list:[
   ["Ambush Awareness","R","If you haven't yet acted in an action scene, you may Defend against an Attack by rolling your single [power] die."],
   ["Change in Circumstance","R","When you change personal zones, you may Boost by rolling your single [power] die."],
   ["Immunity","I","You do not take damage from [energy/element]."]]},
  roll:[12,6]},
 {n:2,name:"Training",blurb:"Your powers are the result of hard work, dedication, and long hours.",
  p:["Gadgets","Signature Vehicle","Signature Weaponry","@Athletic","@Intellectual"],
  yellow:{count:2,diff:true,list:[
   ["Always Be Prepared","A","Boost yourself using [power]. That bonus is persistent and exclusive. Then, Attack using your Min die. You may use the bonus you just created on that Attack."],
   ["Reactive Field","R","When you are attacked by a nearby enemy, the attacker also takes an equal amount of damage."],
   ["Flowing Fight","A","Attack using [power]. Use your Mid die to Attack one extra target for each bonus you have. Apply a different bonus to each Attack."]]},
  extra:{type:"archetypeQuality",die:8,text:"When you move to the next step, select an extra quality from that archetype's list at d8."},
  roll:[10,8,8]},
 {n:3,name:"Genetic",blurb:"Mutations in your DNA have caused you to develop unusual abilities.",
  p:["Agility","Flight","Signature Weaponry","Strength","Vitality","@Intellectual","@Psychic"],
  yellow:{count:2,diff:true,list:[
   ["Danger Sense","R","When damaged by an environment target or a surprise Attack, Defend by rolling your single [power] die."],
   ["Adaptive","A","Boost yourself using [power], then either remove a penalty on yourself or Recover using your Min die."],
   ["Area Assault","A","Attack multiple targets using [power], using your Min die against each."]]},
  green:{count:1,list:[
   ["Growth","A","Boost yourself using [quality]. That bonus is persistent and exclusive."],
   ["Rally","A","Attack using [quality]. Other nearby heroes in the Yellow or Red zone Recover equal to your Min die."]]},
  roll:[10,8,8]},
 {n:4,name:"Experimentation",blurb:"Your powers were created in a lab — with some unexpected side effects.",
  p:["Signature Weaponry","@Athletic","@Elemental/Energy","@Intellectual","@Mobility","@Self Control"],
  yellow:{count:2,diff:true,list:[
   ["Personal Upgrade","A","Boost yourself using [power]. Use your Max die. That bonus is persistent and exclusive."],
   ["Misdirection","R","When a nearby hero in the Yellow or Red zone would take damage, Defend against that damage by rolling your single [power] die, then redirect any remaining damage to a nearby minion of your choice."],
   ["Throw Minion","A","Attack a minion using [power]. The result of the minion's save Attacks another target of your choice."]]},
  green:{count:1,list:[
   ["Overpower","I","Whenever you are Boosted, increase that bonus by +1. Then, if that bonus is +5 or higher, take damage equal to that bonus and remove it."],
   ["Unflagging","I","At the start of your turn, remove a penalty on yourself."]]},
  roll:[8,8,8]},
 {n:5,name:"Mystical",blurb:"Magical training or alteration by magic gives you your powers.",
  p:["Awareness","Flight","Presence","Signature Weaponry","Teleportation","@Elemental/Energy","@Materials","@Psychic","@Self Control"],
  yellow:{count:2,diff:true,list:[
   ["Modification Wave","A","Boost or Hinder using [power], and apply that mod to multiple nearby targets."],
   ["Mystic Redirection","R","When another hero in the Yellow or Red zone would take damage, you may redirect it to yourself and Defend against it by rolling your single [power] die."],
   ["Sever Link","A","Overcome an environmental challenge using [power]. Use your Max die. Either remove any penalty in the scene or Boost equal to your Mid die."]]},
  extra:{type:"quality",die:10,cats:["Information"],text:"Gain an Information quality and assign a d10 to it."},
  roll:[10,8,8]},
 {n:6,name:"Nature",blurb:"The power of nature flows through you.",
  p:["Animal Control","Cold","Electricity","Fire","Flight","Leaping","Shapeshifting","Swimming","Swinging","Wall-Crawling","Weather","@Athletic","@Materials"],
  yellow:{count:2,diff:false,list:[
   ["Call to the Wild","A","Gain a d8 minion. It takes its turn before yours, but goes away at the end of the scene. You may only have one such minion at a time."],
   ["Predator's Eye","A","Attack using [power]. Use your Max+Min dice. Then gain a Boost using your Mid die. The target of the Attack gains a bonus of the same size."],
   ["Wild Strength","R","When you defeat a minion, roll that minion's die and Boost yourself using that roll to create a bonus for your next action."]]},
  green:{count:1,list:[
   ["Grasping Vines","A","Hinder using [power]. Use your Max die. You may split that penalty across multiple nearby targets."],
   ["Natural Weapon","A","Attack using [power]. Use your Max die."]]},
  roll:[10,8,8]},
 {n:7,name:"Relic",blurb:"An object of mystical significance grants you powers or altered you.",
  p:["Awareness","Intuition","Signature Vehicle","Signature Weaponry","@Elemental/Energy","@Materials","@Mobility","@Psychic","@Self Control"],
  yellow:{count:2,diff:true,list:[
   ["Harvest Life Force","A","Attack using [power]. Use your Min die. Take damage equal to your Mid die, and one nearby ally Recovers Health equal to your Max die."],
   ["Magical Shield","R","When another hero in the Yellow or Red zone would take damage, you may Defend them by rolling your single [power] die."],
   ["Momentary Power","A","Boost yourself using [power]. Use your Max die. Hinder a nearby opponent with your Min die."],
   ["Relic Drain","A","Hinder using [power]. Also Recover Health equal to your Min die."]]},
  green:{count:1,list:[
   ["Draw Power","A","Boost yourself using [power]. That bonus is persistent and exclusive."],
   ["Punishment","I","Whenever you Attack an enemy that has inflicted a penalty on you, treat that penalty as if it were a bonus for the purpose of that Attack."]]},
  roll:[10,10,6]},
 {n:8,name:"Powered Suit",blurb:"An engineered suit provides your powers, and may even keep you alive.",
  required:"Power Suit",
  p:["Awareness","Cold","Elasticity","Electricity","Fire","Lightning Calculator","Nuclear","Part Detachment","Signature Vehicle","Signature Weaponry","@Athletic","@Mobility"],
  yellow:{count:2,diff:true,list:[
   ["Energy Converter","R","When you take damage from [element/energy], treat the amount of damage you take as a Boost action for yourself."],
   ["Explosive Attack","A","Attack up to three different targets using [power]. Apply your Max die to one, your Mid die to another, and your Min die to the third. If you roll doubles, take a minor twist or take irreducible damage equal to that die."],
   ["Onboard Upgrade","A","Boost yourself using Power Suit. Use your Min+Mid dice. That bonus is persistent and exclusive."]]},
  green:{count:1,list:[
   ["Damage Reduction","I","Reduce [physical or energy] damage you take by 1 while you are in the Green zone, 2 while in the Yellow zone, and 3 while in the Red zone."],
   ["Diagnostic Subroutine","I","Whenever your status changes due to a change in your current Health, you may remove a penalty on yourself."]]},
  roll:[10,6,6]},
 {n:9,name:"Radiation",blurb:"Exposure to radiation has charged your system and given you new abilities.",
  p:["Nuclear","Signature Vehicle","Signature Weaponry","@Athletic","@Self Control","@Technological"],
  yellow:{count:2,diff:true,list:[
   ["Radioactive Recharge","A","Boost yourself using [power]. Then, either remove a penalty on yourself or Recover using your Min die."],
   ["Unstable Reaction","R","After rolling during your turn, you may take 1 irreducible damage to reroll your entire dice pool."],
   ["Wither","A","Attack using [power]. Hinder that target using your Max die."]]},
  green:{count:1,list:[
   ["Charged Up","I","Whenever you roll a 1 on one or more dice, you may reroll those dice. You must accept the result of the reroll."],
   ["Dangerous Lash","A","Attack multiple targets using [power], applying your Min die to each. If you roll doubles, also attack an ally using your Mid die."],
   ["Radioactive Aura","R","When a new target enters the scene close to you, you may Attack it by rolling your single [power] die."]]},
  roll:[10,8,6]},
 {n:10,name:"Tech Upgrades",blurb:"Technological upgrades and implants give you your powers.",
  p:["Signature Vehicle","Signature Weaponry","@Athletic","@Elemental/Energy","@Intellectual","@Mobility","@Technological"],
  yellow:{count:2,diff:true,list:[
   ["Energy Burst","A","Attack multiple targets using [power], using your Min die against each."],
   ["Recharge","A","Boost yourself using [power]. Then, either remove a penalty on yourself or Recover using your Min die."],
   ["Techno-Absorb","I","When you would take damage from [element/energy], you may Recover that amount of Health instead."],
   ["Tactical Analysis","R","When Attacked, treat the amount of damage you take as a Boost action for yourself."]]},
  green:{count:1,list:[
   ["Indiscriminate Fabrication","A","Boost using [power], assigning your Min, Mid, and Max dice to 3 different bonuses, one of which must be given to an enemy."],
   ["Organi-Hack","A","Attack a target using [power]. Hinder that target with your Min die."]]},
  roll:[10,8,8]},
 {n:11,name:"Supernatural",blurb:"You have pierced the veil of life and reality and brought back power.",
  p:["Awareness","Cold","Electricity","Fire","Infernal","Plants","Presence","Radiant","Strength","Transmutation","Vitality","Weather","@Mobility","@Psychic","@Self Control"],
  yellow:{count:2,diff:true,list:[
   ["Area Healing","A","Boost an ally using [power]. You and nearby heroes in the Yellow and Red zones Recover Health equal to your Min die."],
   ["Mass Modification","A","Boost or Hinder using [power], and apply that mod to multiple close targets."],
   ["Personal Upgrade","A","Boost yourself using [power]. Use your Max die. That bonus is persistent and exclusive."],
   ["Reach through Veil","R","When a nearby ally would take damage, Defend that ally by rolling your single status die, and move them elsewhere in the same scene."]]},
  extra:{type:"powerNotOnList",die:10,text:"Gain one power not on the above list. Assign it d10."},
  roll:[10,10,6]},
 {n:12,name:"Artificial Being",blurb:"You were created, not born; your abilities stem from your makeup.",
  p:["Inventions","Robotics","Signature Vehicle","Signature Weaponry","@Athletic","@Elemental/Energy","@Intellectual","@Mobility","@Self Control"],
  yellow:{count:2,diff:true,list:[
   ["Created Immunity","I","When you would take damage from [element/energy], you may Recover that amount of Health instead."],
   ["Multiple Assault","A","Attack using [power] against multiple targets, using your Min die against each."],
   ["Recalculating...","R","After rolling during your turn, you may take 1 irreducible damage to reroll your entire dice pool."]]},
  green:{count:1,list:[
   ["Created Form","I","Reduce physical damage to yourself by 1 while you are in the Green zone, 2 while in the Yellow zone, and 3 while in the Red zone."],
   ["Intentionality","I","Whenever you roll a 1 on one or more dice, you may reroll those dice. You must accept the result of the reroll."]]},
  roll:[10,8,8]},
 {n:13,name:"Cursed",blurb:"A supernatural curse on you or your family line grants both boons and banes.",
  p:["Signature Weaponry","@Athletic","@Elemental/Energy","@Materials","@Self Control"],
  yellow:{count:2,diff:true,list:[
   ["Attunement","I","When you would take damage from [element/energy], you may Recover that amount of Health instead."],
   ["Costly Strength","A","Boost all nearby allies using [power]. Use your Max+Mid dice. Hinder yourself with your Min die."],
   ["Cursed Resolve","A","Boost yourself using [power]. Then, either remove a penalty on yourself or Recover using your Min die."]]},
  green:{count:1,list:[
   ["Double Edged Luck","I","Whenever you roll a 1 on one or more dice, you may reroll those dice. You must accept the result of the reroll."],
   ["Extremes","I","Whenever you roll a die's max value, treat that value as 1 higher. When you roll a 1 on a die, treat that die as if it had rolled a 0."]]},
  roll:[12,6]},
 {n:14,name:"Alien",blurb:"You're not from Earth — or an extraterrestrial source granted your abilities.",
  p:["Signature Vehicle","Signature Weaponry","@Athletic","@Elemental/Energy","@Intellectual","@Mobility","@Psychic","@Technological"],
  yellow:{count:2,diff:true,list:[
   ["Alien Boost","A","Boost all nearby allies using [power]. Use your Max+Mid dice. Hinder yourself with your Min die."],
   ["Empower and Repair","A","Boost, Hinder, Defend, or Attack using [power]. You and all nearby heroes in the Yellow or Red zone Recover Health equal to your Min die."],
   ["Halt","R","When you are Attacked at close range, Defend yourself by rolling your single [power] die."]]},
  extra:{type:"upgradeD6",text:"Then, upgrade one d6 power or quality to d8. If you have no d6 powers, instead add a new power from the above list at d6."},
  roll:[8,8,8]},
 {n:15,name:"Genius",blurb:"Your brilliant mind is the source of your powers.",
  p:["Inventions","Robotics","Signature Vehicle","Signature Weaponry","@Intellectual"],
  yellow:{count:2,diff:true,list:[
   ["A Plan For Everything","R","When you are attacked, first roll your single [power] die. Defend yourself with that roll. Then, Boost yourself using that roll."],
   ["Expanded Mind","A","Boost yourself using [power]. Use your Max die. That bonus is persistent and exclusive. Then Attack using your Min die."],
   ["Overwhelming Vision","A","Attack using [power]. Then, if the target of the Attack survived, also Attack that target with your Max die. Otherwise, Recover an amount of Health equal to your Min die."]]},
  extra:{type:"quality",die:10,cats:["Information","Mental"],text:"Select an extra quality from the Information or Mental quality categories at d10."},
  roll:[10,6,6]},
 {n:16,name:"Cosmos",blurb:"Exposure to forces from beyond the stars has changed you.",
  p:["Cosmic","Intuition","Signature Vehicle","Signature Weaponry","@Mobility","@Psychic","@Self Control","@Technological"],
  yellow:{count:2,diff:true,list:[
   ["Cosmic Ray Absorption","I","If you would take damage from [element/energy you have a related power for], instead reduce that damage to 0 and Recover that amount of Health."],
   ["Encourage","A","Attack using [power]. Boost all nearby heroes taking Attack or Overcome actions using your Min die until your next turn."],
   ["Mass Effect","A","Boost or Hinder using [power] and apply that mod to multiple close targets."]]},
  extra:{type:"cosmosShift",text:"Downgrade one d8, d10, or d12 power one die size and upgrade one d6, d8, or d10 power one die size."},
  roll:[10,8,8]},
 {n:17,name:"Extradimensional",blurb:"Exposure to side dimensions like the Realm of Discord has left its mark on you.",
  p:["Cosmic","Duplication","Infernal","Intangibility","Invisibility","Radiant","Signature Vehicle","Signature Weaponry","Transmutation","Teleportation","@Intellectual","@Psychic"],
  yellow:{count:2,diff:true,list:[
   ["Absorb Essence","R","When you defeat a minion, roll that minion's die and Boost yourself using that roll."],
   ["Aura of Pain","A","Attack multiple targets using [power]. Then, take irreducible damage equal to the number of targets hit."],
   ["Bizarre Strike","A","Attack using [power]. Use your Max die. Hinder that target with your Mid die. Hinder yourself with your Min die."]]},
  green:{count:1,list:[
   ["Attune","A","Boost yourself using [power]. That bonus is persistent and exclusive. Damage dealt using that bonus is all [energy/element]."],
   ["Extrasensory Awareness","R","When you would take damage that would change your zone, Defend against that damage by rolling your single [quality] die."]]},
  roll:[12,6]},
 {n:18,name:"Unknown",blurb:"Your powers just manifested one day — or hint at a bigger mystery.",
  p:["@Elemental/Energy","@Intellectual","@Materials","@Self Control","@Technological"],
  yellow:{count:2,diff:true,list:[
   ["Brainstorm","A","Attack using [power]. Hit one target using your Min die, another target with your Mid die, and Boost using your Max die."],
   ["Strange Enhancement","A","Boost all nearby allies using [power] using your Max+Mid dice. Hinder yourself with your Min die."],
   ["Volatile Creations","R","When one of your bonuses, penalties, or other creation of your powers is destroyed, deal a target damage equal to the roll of your [power] die."]]},
  extra:{type:"quality",die:8,cats:["Social"],text:"Gain a Social quality at d8."},
  roll:[10,8,6]},
 {n:19,name:"Higher Power",blurb:"Chosen by a higher force, or a being from another realm.",
  p:["@Athletic","@Elemental/Energy","@Materials","@Psychic","@Self Control"],
  yellow:{count:2,diff:true,list:[
   ["Command Power","R","When you take damage from [elemental/energy], you may deal that much damage to another target."],
   ["Dangerous Explosion","A","Attack multiple targets using [power]. Use your Mid die. Hinder all targets damaged by this ability with your Min die. Hinder yourself with your Max die."],
   ["Embolden","A","Attack using [power], and Boost all nearby heroes taking [choose two basic actions] using your Min die until your next turn."],
   ["Resolve","A","Boost yourself using [power], then remove a penalty on yourself or Recover using your Min die."]]},
  green:{count:1,list:[
   ["Resilience","I","At the start of your turn, remove any -1 penalties on you."],
   ["Twist Reality","R","After rolling during your turn, you may take 1 irreducible damage to reroll your entire dice pool."]]},
  roll:[10,8,8]},
 {n:20,name:"The Multiverse",blurb:"You have traveled or been flung through the realms of time and space.",
  p:["Awareness","Cosmic","Intuition","Speed","Teleportation","@Psychic","@Self Control"],
  yellow:{count:2,diff:true,list:[
   ["Power From Beyond","A","Boost yourself using [power]. Use your Max die. That bonus is persistent and exclusive. Then, Attack using your Min die."],
   ["Respond In Kind","R","When you are hit with an Attack at close range, the attacker also takes damage equal to their effect die."],
   ["Dread Pallor","A","Hinder multiple targets using [power]. Use your Mid die for one and your Min die for the rest."],
   ["Reality Scorned","A","Attack using [power]. If your target survived, Hinder them using your Max die."]]},
  extra:{type:"power",die:6,cats:"any",text:"Gain one extra power from any category at d6."},
  roll:[10,8,6]}
];

// Archetypes (Step 3)
// req: {kind:'power'|'quality', opts:[...]} -> one die must go here
// pMin: minimum number of remaining dice that go to powers (1 = "one or more"), q: qualities for remaining dice
export const ARCHETYPES: ArchetypeDef[] = [
 {n:1,name:"Speedster",blurb:"Sorry, gotta go, be in twelve places at once...",
  req:{kind:"power",opts:["Speed"]},p:["Agility","Intangibility","Lightning Calculator","Vitality","@Mobility"],pMin:1,q:["@Mental","@Physical"],
  green:{count:2,diff:true,list:[
   ["Always on the Move","A","Attack using [power/quality]. Defend yourself using your Min die."],
   ["Fast Fingers","A","Boost or Hinder using [power]. Use your Max die. If you roll doubles, you may also Attack using your Mid die."],
   ["Non-stop Assault","A","Attack multiple targets using [quality]. Use your Min die. Hinder each target equal to your Mid die."]]},
  yellow:{count:1,list:[
   ["Blinding Strike","A","Attack multiple targets using [quality]. Hinder each target equal to your Min die."],
   ["Flurry of Fists","A","Attack using [quality]. Use your Max die. If you roll doubles, use Max+Min instead."],
   ["Supersonic Streak","A","Attack multiple targets using [power]. Use your Max die against one target, and your Mid die against each other target. If you roll doubles, take irreducible damage equal to your Mid die."],
   ["Speedy Analysis","A","Boost multiple targets using [power]. Use your Max die."]]},
  principle:"Expertise",roll:[10,10]},
 {n:2,name:"Shadow",blurb:"You operate in the shadows via subtlety and guile.",
  req:{kind:"quality",opts:["Stealth"]},p:["Intangibility","Invisibility","Signature Weaponry","@Athletic"],pMin:0,q:["@Physical"],
  green:{count:2,diff:true,list:[
   ["Sabotage","A","Attack using [power/quality]. Remove one physical bonus or penalty, Hinder a target using your Min die, or maneuver to a new location in your environment."],
   ["Shadowy Figure","A","Attack using [power/quality]. Defend using your Min die against all Attacks until your next turn."],
   ["Untouchable","R","When you would be dealt damage, roll a d4 while in the Green zone, d6 while in the Yellow, or d8 while in Red. Reduce the damage you take by the value rolled. Attack another target with that roll."]]},
  yellow:{count:1,list:[
   ["Overcome From the Darkness","A","Attack or Overcome using [power/quality]. Boost yourself using your Min die."],
   ["Diversion","R","When you would take damage, Defend against that damage by rolling your single [power/quality] die."]]},
  principle:"Expertise",roll:[10,10]},
 {n:3,name:"Physical Powerhouse",blurb:"You are the brute squad.",
  req:{kind:"power",opts:["Strength"]},p:["Density Control","Leaping","Signature Weaponry","Size-Changing","@Athletic"],pRule:"one",q:["@Physical","@Social"],
  green:{count:2,diff:true,note:"Each using a different power or quality from the Physical Powerhouse list (including Strength).",list:[
   ["Damage Resistant","I","Reduce any physical or energy damage you take by 1 while you are in the Green zone, 2 while in the Yellow zone, and 3 while in the Red zone."],
   ["Frontline Fighting","A","Attack using [power/quality]. The target of that Attack must take an Attack action against you as its next turn, if possible."],
   ["Galvanize","A","Boost using [power/quality]. Apply that bonus to all hero Attack and Overcome actions until the start of your next turn."],
   ["Power Strike","A","Attack using [power/quality] and use your Max die."],
   ["Strength in Victory","R","When you eliminate a minion with an Attack using [power/quality], Recover Health equal to your Min die."]]},
  yellow:{count:1,fromGreen:true,note:"Gain one of the above abilities at Yellow, using a different power or quality than your Green abilities."},
  principle:"Expertise",roll:[10,10]},
 {n:4,name:"Marksman",blurb:"Guns, a bow and arrow, or something else — your aim is true.",
  req:{kind:"power",opts:["Signature Weaponry"]},p:["Signature Vehicle","Swinging","@Athletic","@Intellectual","@Technological"],pRule:"oneOrMore",q:["@Information","@Mental","@Physical"],
  green:{count:2,note:"One using Signature Weaponry and the other using one of your qualities.",list:[
   ["Dual Wielder","A","Attack two different targets using [power/quality], one target using your Mid die and the other your Min die."],
   ["Load","A","Boost using [power/quality] to create one bonus using your Max die and another using your Mid die."],
   ["Precise Shot","A","Attack using [power/quality]. Ignore all penalties on this Attack, ignore any Defend actions, and it cannot be affected by Reactions."],
   ["Sniper Aim","A","Boost yourself using [power/quality]. Use your Max+Min dice. This bonus can only be used against one chosen target, and is persistent & exclusive against that target until it leaves the scene."],
   ["Spin & Shoot","A","Attack using [power/quality]. Defend using your Min die."]]},
  yellow:{count:2,note:"Using two different qualities.",list:[
   ["Called Shot","A","Attack using [quality]. Boost another hero using your Max die."],
   ["Exploding Ammo","A","Attack or Overcome using [quality] on an environmental target, using your Max+Min dice. If you roll doubles, take a minor twist."],
   ["Hair Trigger Reflexes","R","When a new target enters close range, Attack that target by rolling your single [quality] die."],
   ["Ricochet","A","Attack using [quality]. Use your Max die. If you roll doubles, use Max+Min instead."]]},
  principle:"Responsibility",roll:[10,10]},
 {n:5,name:"Blaster",blurb:"The best way to use energy is to throw it at the bad guy.",
  req:{kind:"powerCat",opts:["Elemental/Energy"],note:"If you already have an Elemental/Energy power, you can skip it, add a different Elemental/Energy power, or swap the die with one of your new dice."},
  p:["Signature Weaponry","@Elemental/Energy","@Mobility","@Technological"],pRule:"one",q:["@Mental","@Physical"],
  green:{count:2,diff:true,note:"Each uses a different one of your powers from the Blaster list.",list:[
   ["Exploit Vulnerability","A","Attack using [power]. If you Attacked or Hindered that target in your previous turn, use your Max die in this Attack."],
   ["Disabling Blast","A","Attack using [power]. Hinder using your Min die."],
   ["Danger Zone","A","Attack multiple targets using [power]. Use your Min die against each."],
   ["Precise Hit","A","Attack using [power]. Ignore all penalties on this Attack, ignore any Defend actions, and it cannot be affected by Reactions."]]},
  yellow:{count:2,note:"Using two different powers.",list:[
   ["Energy Immunity","I","If you would take damage from [element/energy you have a related power for], instead reduce that damage to 0 and Recover that amount of Health."],
   ["Heedless Blast","A","Attack multiple targets using [power]. Use your Mid die against each target. Take irreducible damage equal to your Mid die."],
   ["Imbue with Element","A","Attack using [power]. Use your Max die. If you choose another hero to go next, Boost that hero using your Mid die."]]},
  principle:"Esoteric",roll:[10,10]},
 {n:6,name:"Close Quarters Combatant",blurb:"You prefer to fight up close and personal.",
  req:{kind:"quality",opts:["Close Combat"]},p:["Signature Weaponry","@Athletic","@Mobility","@Technological"],pRule:"oneOrMore",q:["@Physical","@Social"],
  green:{count:3,note:"At least one using your Close Combat quality and another using one of your powers.",list:[
   ["Defensive Strike","A","Defend using [power/quality]. Attack using your Min die."],
   ["Dual Strike","A","Attack one target using [power/quality]. Attack a second target using your Min die."],
   ["Flexible Stance","A","Take any two basic actions using [power/quality], each using your Min die."],
   ["Offensive Strike","A","Attack using [power/quality]. Use your Max die."],
   ["Precise Strike","A","Attack using [power/quality]. Ignore all penalties on this Attack, ignore any Defend actions, and it cannot be affected by Reactions."],
   ["Throw Minion","A","Attack a minion using [power/quality]. Whatever that minion rolls as defense Attacks another target of your choice."]]},
  yellow:{count:1,fromGreen:true,note:"Gain one of the above abilities as a Yellow ability, using a different power or quality from any of your Green abilities."},
  principle:"Responsibility",roll:[10,10]},
 {n:7,name:"Armored",blurb:"You are an indomitable and unstoppable force.",
  p:["Signature Vehicle","Signature Weaponry","@Athletic","@Intellectual","@Materials","@Mobility","@Technological"],pRule:"oneOrMore",q:["@Physical","@Social"],
  fixedGreen:[["Armored","I","Reduce any physical or energy damage you take by 1 while you are in the Green zone, 2 while in the Yellow zone, and 3 while in the Red zone."]],
  green:{count:3,note:"Gain three of these Green abilities of your choice, using at least two different powers.",list:[
   ["Deflect","R","When you would be dealt damage, you may deal damage to a nearby target equal to the amount reduced by your Armored ability."],
   ["Dual Offense","A","Attack using [power]. Attack a second target with your Min die."],
   ["Living Bulwark","A","Attack using [power]. Defend another target with your Min die."],
   ["Repair","A","Attack using [power]. Recover Health equal to your Min die."],
   ["Unstoppable Charge","A","Attack using [power/quality]. Ignore all penalties on this Attack, ignore any Defend actions, and it cannot be affected by Reactions."]]},
  healthAlt:["Materials","Technological"],
  principle:"Expertise",roll:[10,10]},
 {n:8,name:"Flyer",blurb:"The best way to support your team is from the air.",
  req:{kind:"power",opts:["Flight","Signature Vehicle"]},p:["Signature Vehicle","Signature Weaponry","@Athletic","@Mobility","@Technological"],pRule:"oneOrMore",q:["@Information","@Physical"],
  green:{count:2,note:"At least one using your Flight or Signature Vehicle power.",list:[
   ["Aerial Bombardment","A","Attack up to three targets using [power/quality]. Apply your Min die to each of them."],
   ["Aerial Surveillance","A","Boost using [power/quality]. Apply that bonus to all hero Attack and Overcome actions until the start of your next turn."],
   ["Barrel Roll","R","When you are Attacked while Flying, you may Defend yourself by rolling your single [power/quality] die."],
   ["Dive & Drop","A","Attack a minion using [power]. Use whatever that minion rolls for its save as an Attack against another target of your choice."],
   ["Sonic Boom","A","Hinder multiple targets using [power]. Apply your Min die to each of them."],
   ["Strike & Swoop","A","Attack using [power/quality]. Defend against all Attacks against you using your Min die until your next turn."]]},
  yellow:{count:1,fromGreen:true,note:"Gain one of the above abilities at Yellow."},
  principle:"Ideals",roll:[10,10]},
 {n:9,name:"Elemental Manipulator",blurb:"Energies are yours to command and flow, sometimes through your own body.",
  req:{kind:"powerCat",opts:["Elemental/Energy"],note:"If you already have an Elemental/Energy power, you can skip it, add a different Elemental/Energy power, or swap the die with one of your new dice."},
  p:["Absorption","Flight","Leaping","Swimming","Signature Vehicle","Signature Weaponry","Transmutation","@Elemental/Energy"],pRule:"one",q:["Magical Lore","Science","@Mental","@Physical"],
  green:{count:2,note:"Both of which must use your Elemental/Energy powers.",list:[
   ["Backlash","A","Attack using [power]. Use your Max die. Take damage equal to your Min die."],
   ["Energy Conversion","A","Defend using [power]. Use your Max die. Boost using your Min die."],
   ["External Combustion","A","Attack up to two targets using [power]. Also take an amount of damage equal to your Mid die."],
   ["Focused Apparatus","A","Hinder using [power]. Attack using your Min die. If you are in the Red zone, you may apply the penalty to any number of nearby targets."]]},
  yellow:{count:1,note:"Using one of your Elemental/Energy powers.",list:[
   ["Damage Spike","A","Attack using [power]. Use your Max+Min dice. Take damage equal to your Mid die."],
   ["Energy Alignment","I","If you would take damage from [element/energy you have a related power for], reduce that damage to 0 and Recover that amount of Health instead."],
   ["Energy Redirection","I","Whenever you take damage from [element/energy you have a related power for], you may also inflict that much damage on another target."],
   ["Live Dangerously","A","Attack multiple targets using [power]. Take damage equal to your Max die."]]},
  principle:"Esoteric",roll:[10,10]},
 {n:10,name:"Robot/Cyborg",blurb:"Your machine nature gives you adaptability and firepower.",
  p:["Signature Vehicle","Signature Weaponry","@Athletic","@Intellectual","@Mobility","@Self Control","@Technological"],pRule:"oneOrMore",q:["@Information","@Mental"],
  extra:{type:"newPowerCat",die:10,cats:["Technological"],text:"Assign d10 to a Technological power you do not already possess."},
  green:{count:2,diff:true,note:"Using two different powers.",list:[
   ["Adaptive Programming","A","Boost yourself using [power], and Defend with your Min die."],
   ["Living Arsenal","A","Attack using [power] with a bonus equal to the number of bonuses you currently have."],
   ["Metal Skin","I","Reduce the amount of physical damage taken by 1 while you are in the Green zone, 2 while in the Yellow zone, and 3 while in the Red zone."],
   ["Self-Improvement","A","Boost yourself using [power]. That bonus is persistent and exclusive."],
   ["Something for Everyone","A","Attack using [power]. Use your Mid die to Attack one extra target for each bonus you have. Apply a different bonus to each Attack."]]},
  yellow:{count:1,fromGreen:true,note:"Gain one of the above abilities at Yellow."},
  healthAlt:["Technological"],
  principle:"Expertise",roll:[10,10]},
 {n:11,name:"Sorcerer",blurb:"You command an arsenal of spells and mystical forces.",
  p:["@Elemental/Energy","@Materials","@Mobility","@Psychic","@Self Control"],pRule:"oneOrMore",q:["@Information","@Mental"],
  green:{count:2,diff:true,note:"Using two different powers.",list:[
   ["Banish","A","Hinder using [power]. Use your Max die. If you roll doubles, also Attack using your Mid die."],
   ["Energy Jaunt","A","Attack multiple targets using [power], applying your Min die against each."],
   ["Powerful Blast","A","Attack using [power] and use your Max die."],
   ["Subdue","A","Attack using [power]. Hinder the same target using your Min die."]]},
  yellow:{count:1,list:[
   ["Cords of Magic","A","Destroy all bonuses and penalties on a target. Then, Hinder that target using [power], using your Max die."],
   ["Field of Energy","A","Attack multiple targets near each other using [power]."],
   ["Living Bomb","A","Destroy one d6 or d8 minion. Roll that minion's die as an Attack against another target."]]},
  principle:"Esoteric",roll:[10,10]},
 {n:12,name:"Psychic",blurb:"Mysterious mental abilities let you manifest powers with but a thought.",
  psychicRule:true,
  p:["@Intellectual","@Materials","@Psychic","@Self Control"],pRule:"any",q:["@Information","@Mental"],
  note:"Assign at least two dice to powers from the Psychic category. If you already have one or more Psychic powers, assign dice to ensure that you have at least two Psychic powers. Assign any remaining dice to the listed power and quality categories.",
  green:{count:2,list:[
   ["Psychic Assault","A","Attack using [Psychic power]. Hinder the target using your Min die."],
   ["Psychic Coordination","A","Boost using [Psychic power]. Apply that bonus to all hero Attack and Overcome actions until the start of your next turn."],
   ["Psychic Insight","R","After rolling during your turn, you may take 1 irreducible damage to reroll your entire dice pool."]]},
  yellow:{count:2,note:"Two abilities that you have the associated power or quality for.",list:[
   ["Astral Projection","A","Overcome using Remote Viewing and use your Max+Min dice. You do not have to be physically present in the area you are Overcoming.","Remote Viewing"],
   ["Illusionary Double","R","When you are Attacked, Defend by rolling your single Illusions die.","Illusions"],
   ["Minion Suggestion","A","Attack a minion using Suggestion. If that minion would be taken out, you control its next action, and then it is removed. Otherwise, Hinder it using your Min die.","Suggestion"],
   ["Postcognitive Understanding","R","After an enemy rolls dice to take an action for their turn but before using the result, Hinder that enemy's roll using your single Postcognition die.","Postcognition"],
   ["Precognitive Alteration","R","After an ally rolls dice to take an action for their turn but before using the result, Boost that ally's roll using your single Precognition die.","Precognition"],
   ["Psychic Analysis","A","Boost yourself using [Mental quality]. Either use your Max die, or use your Mid die and make it persistent.","@Mental"],
   ["Swarm","A","Attack multiple targets using Animal Control and use your Min die.","Animal Control"],
   ["Telekinetic Assault","A","Attack using Telekinesis. Either Attack one target and use your Max die, or two targets and use your Mid die against one and your Min die against another.","Telekinesis"],
   ["Telepathic Whammy","A","Attack using Telepathy and use your Max die. Hinder the target with a persistent penalty using your Min die.","Telepathy"]]},
  principle:"Esoteric",roll:[10,10]},
 {n:13,name:"Transporter",blurb:"You know how to get exactly where you need to be, when you need to be there.",
  req:{kind:"powerOrCat",opts:["Signature Vehicle","@Mobility"]},p:["Signature Vehicle","@Athletic","@Mobility","@Psychic","@Technological"],pRule:"oneOrMore",q:["@Physical","@Social"],
  green:{count:2,diff:true,note:"Using two different powers.",list:[
   ["Displacement Assault","A","Attack using [power]. Either Hinder your target with your Min die or move them somewhere else in the scene."],
   ["Hit & Run","A","Attack using [power]. Defend against all Attacks against you using your Min die until your next turn."],
   ["Mobile Assist","A","Boost another hero using [power]. Attack using your Min die."],
   ["Mobile Dodge","R","When you are hit with an Attack, you may take 1 irreducible damage to have the attacker reroll their dice pool."],
   ["Run Down","A","Attack multiple targets using [power]. Use your Min die against each."]]},
  yellow:{count:1,fromGreen:true,note:"Gain one of the above abilities as a Yellow ability."},
  principle:"Expertise",roll:[10,10]},
 {n:14,name:"Minion-Maker",blurb:"Who needs friends when you can just make them?",
  p:["Duplication","Inventions","Part Detachment","Robotics","@Elemental/Energy","@Materials"],pRule:"oneOrMore",q:["@Information","@Mental"],
  fixedGreen:[
   ["Make Minion","A","Create a minion using [power]. Reference the minion chart to see what size of minion it is. Choose whether it can Attack, Defend, Boost, Hinder, or Overcome. It acts on the start of your turn. You can only use this ability in a situation conducive to how you create minions."],
   ["Power Up","A","Boost another hero or one of your minions using [power]. Either use your Max die, or use your Mid die and make that bonus persistent."]],
  fixedGreenNote:"Gain these Green abilities, each using a different power.",
  yellow:{count:1,list:[
   ["Minion Formation","R","Reduce any damage you take by the number of minions you have. Whenever damage is reduced this way, reduce the size of one of your minions."],
   ["Rapid Deployment","A","Create a minion using [power]. Use your Min die. Choose which basic action it can perform. It acts now and at the start of your turns."],
   ["Upgrade Minion","A","Boost one of your minions using [power]. You may also upgrade that minion to your Max die size, replacing its minion form."]]},
  extraRed:[
   ["Construction Focus","A","Create two minions using [power], one with your Max die and one with your Mid die. Choose which one basic action each of them can perform. They act on the start of your turn."],
   ["Swarm Combat","A","Attack using [power]. Use your Max die plus a bonus equal to the number of minions you have."],
   ["Sacrifice","R","When you are Attacked, redirect the Attack to one of your nearby minions."]],
  minionForms:true,
  principle:"Expertise",roll:[10,10]},
 {n:15,name:"Wild Card",blurb:"No one knows what you'll do next — not the bad guys, not your allies, sometimes not even you.",
  p:["Signature Vehicle","Signature Weaponry","@Athletic","@Intellectual","@Mobility","@Self Control"],pRule:"oneOrMore",q:["@Physical","@Social"],
  green:{count:2,diff:true,note:"Using two different powers.",list:[
   ["Gimmick","A","Boost or Hinder using [power]. Use your Max die. If you roll doubles, you may also Attack using your Mid die."],
   ["Multitask","A","Take any two different basic actions using [power/quality], each using your Min die."],
   ["Surprise Results","R","After rolling your dice pool for the turn, you may take 1 irreducible damage to reroll your entire pool."],
   ["Unknown Results","A","Take any basic action using [power]. Then roll a d6. On 1, Boost with your Min die. On 2, Hinder with your Min die. On 3, Defend with your Min die. On 4, lose Health equal to your Min die. On 5, your basic action uses your Max die. On 6, your basic action uses your Min die."]]},
  yellow:{count:1,list:[
   ["Break the 4th","R","You may uncheck a checked off collection on your hero sheet."],
   ["Danger!","A","Attack multiple targets using [power]. If you roll doubles, one nearby ally is also hit with the Attack."],
   ["Expect the Unexpected","R","Apply a bonus after rolling your action, instead of before."],
   ["Imitation","A","Use a Green action ability of a nearby ally (using the same size power/quality die they would use.)"],
   ["Turn the Tables","A","Change any bonus into a penalty of equal size or vice versa."]]},
  principle:"Ideals",roll:[10,10]},
 {n:16,name:"Form-Changer",blurb:"You can shift yourself between a few different forms.",
  req:{kind:"powerCat",opts:["Self Control"],note:"If you already have a Self Control power, you can skip it, add a different Self Control power, or swap the die with one of your new dice."},
  p:["@Athletic","@Mobility","@Self Control","@Technological"],pRule:"oneOrMore",q:["@Information","@Physical"],
  fixedGreen:[["Change Forms","A","Take a basic action using [Self Control power], then switch to any available form."]],
  green:{count:1,list:[
   ["Form Recovery","A","Attack using [Self Control power] and Recover Health equal to your Min die. Return to your base form."],
   ["Surprise Shift","A","Attack using [Self Control power] and use your Max die. Then change to any available form."]]},
  forms:true,
  fixedRed:[["Emergency Change","R","When hit with an Attack, change to any form before resolving the Attack. Take a minor twist."]],
  principle:"Esoteric",roll:[10,10]},
 {n:17,name:"Gadgeteer",blurb:"Any problem can be solved through sufficient brainpower.",
  req:{kind:"powerCat",opts:["Intellectual"],note:"If you already have an Intellectual power, you can skip it, add a different Intellectual power, or swap the die with one of your new dice."},
  p:["Signature Vehicle","Signature Weaponry","@Intellectual","@Mobility","@Psychic","@Technological"],pRule:"oneOrMore",q:["@Information","@Mental"],
  green:{count:2,diff:true,note:"Using two different powers.",list:[
   ["Analyze Probabilities","R","After rolling your dice pool, you may take 1 irreducible damage to reroll your dice pool."],
   ["Analyze Weakness","A","Hinder using [power]. Use your Max die, or use your Mid die and make it persistent and exclusive."],
   ["Equip","A","Boost using [power]. Make one bonus for one ally using your Mid die and another for another ally using your Min die."],
   ["Helpful Invention","A","Boost using [power]. Use your Max die, or use your Mid die and make it persistent and exclusive."]]},
  yellow:{count:1,list:[
   ["Helpful Analysis","R","One nearby ally may reroll their dice pool. You lose Health equal to the Min die of the new roll."],
   ["Snap Decision","A","Boost yourself using [power]. Use your Max+Min dice. Then Attack using your Mid die with that bonus."],
   ["Turn the Tables","A","Change any bonus into a penalty of equal size or vice versa."]]},
  principle:"Identity",roll:[10,10]},
 {n:18,name:"Reality Shaper",blurb:"God may not play dice with the universe, but you do.",
  p:["Density Control","Intangibility","Invisibility","Speed","Teleportation","Transmutation","@Intellectual","@Psychic","@Technological"],pRule:"oneOrMore",q:["@Information","@Mental"],
  green:{count:2,diff:true,note:"Using two different powers.",list:[
   ["Negative Likelihood","A","Hinder using [power]. That penalty is persistent and exclusive."],
   ["Not Quite Right","R","After a dice pool is rolled, adjust one die up or down one value on the die."],
   ["Probability Insight","A","Boost using [power]. Use your Max die. If you roll doubles, you may also Attack using your Mid die."],
   ["Warp Space","A","Attack using [power]. You may move the target of that Attack anywhere else nearby. If the target goes next, you decide who takes the next turn after that."]]},
  yellow:{count:1,list:[
   ["Alternate Outcome","R","When a nearby enemy rolls their dice pool for the turn, you may lose 1 Health to reroll their entire pool."],
   ["Helpful Analysis","R","One nearby ally may reroll their dice pool. You lose Health equal to the Min die of the new roll."],
   ["Never Happened","R","When a nearby enemy would create a bonus or penalty, you may remove it immediately."],
   ["Retroactive Rewrite","R","You may apply a bonus to a roll after rolling instead of before."]]},
  principle:"Expertise",roll:[10,10]},
 {n:19,name:"Divided",blurb:"Two very different forms, such as an unpowered civilian and a powered hero.",divided:true,
  principle:"Responsibility",roll:[10,10]},
 {n:20,name:"Modular",blurb:"Multiple modes — configurations, fighting styles — each with their own trade-offs.",modular:true,
  principle:null,roll:[10,10]}
];

// Special archetype data
export const MINION_CHART: [string, string, string][] = [["0 or less","d4","tiny/featureless"],["1-3","d6","small/limited detail"],["4-7","d8","house pet sized/detailed"],["8-11","d10","humanoid sized/intricate"],["12+","d12","large/paragon"]];
export const MINION_FORMS: [string, string, string][] = [
 ["Autonomous","The minion can take any of the basic actions, not just one.","+1 or higher"],
 ["Burrowing","The minion can tunnel through the earth.","+1 or higher"],
 ["Floating","The minion can fly and maneuver in the air.","+1 or higher"],
 ["Pack","The minion adds +1 to its Attack for each other pack minion attacking the same target this round.","+2 or higher"],
 ["Explosive","When the minion is destroyed, also remove a bonus or penalty of your choice.","+2 or higher"],
 ["Reinforced","The minion adds +1 to its roll to save.","+2 or higher"],
 ["Harsh","When Hindering, the target also takes damage equal to that penalty.","+3 or higher"],
 ["Stealth","On a successful minion save, do not reduce this minion's die size.","+3 or higher"],
 ["Swift","The minion rolls twice for its action and chooses the higher die.","+3 or higher"],
 ["Champion","When Boosting, may apply the bonus to all actions by its creator and their minions until your next turn.","+4 or higher"],
 ["Hive-Mind","While this minion is active, all your other minions can take the same action as it does.","+4 or higher"],
 ["Turret","When Attacking, the minion may split its die into two dice, each one size smaller than its die, and either Attack one target with both, or two targets.","+4 or higher"]
];
export const MINION_FORMS_NOTE = "Select a number of minion forms equal to the maximum value of a related quality (e.g. Creativity, Magical Lore, Otherworldly Mythos, Science, or Technology — d8 = eight forms, d10 = ten, etc.). When you create a minion, you may discard one bonus you have access to (on you or a willing ally) to add one form whose requirement that bonus meets.";

export const FORM_CHANGER: { greenFormNote: string; greenForms: RawAbility[]; yellowFormNote: string; yellowForms: RawAbility[] } = {
 greenFormNote:"Make two other Green forms, recorded on your auxiliary sheet. You may swap dice between your powers for each form, including adding powers from the archetype list and dropping others. Each one gains a different ability only usable while in that form.",
 greenForms:[
  ["Clever Form","A","Boost or Overcome using [power]. Use your Max die."],
  ["Minuscule Form","A","Defend using [power]. Use your Max die. Remove all penalties on you."],
  ["Strong Form","A","Attack using [power]. Use your Max die."],
  ["Tough Form","I","Reduce any physical or energy damage you take by 1 while you are in the Green zone, 2 while in the Yellow zone, and 3 while in the Red zone."],
  ["Tricky Form","A","Boost or Hinder using [power]. Use your Max die."],
  ["Weird Form","R","When an opponent would Attack you in close combat while in this form, you may Attack or Hinder them first by rolling your single [power] die."]],
 yellowFormNote:"Then make a Yellow form, recorded on your auxiliary sheet. You may swap powers around and upgrade any two dice by one size. Pick one Yellow form ability (or one of the unused Green form abilities).",
 yellowForms:[
  ["Agile Form","A","Attack using [power]. Defend against all attacks until your next turn with your Min die."],
  ["Regenerating Form","A","Boost using [power]. Recover Health equal to your Min die."],
  ["Speedy Form","A","Hinder multiple targets using [power]."],
  ["Towering Form","A","Attack multiple targets using [power]."]]
};

export const DIVIDED: { note: string; transitions: { name: string; desc: string; abilities: RawAbility[]; pick: number }[]; dividedAbilities: RawAbility[]; personalityNote: string } = {
 note:"Reroll the dice from the power source step and choose another archetype other than Divided or Modular. Your full archetype is \"Divided [that archetype]\". Follow all its steps, but take a Responsibility principle instead of its principle.",
 transitions:[
  {name:"Controllable Transition",desc:"You change between forms through a method you always control (a magic word, a sparkly transformation sequence) — but it always takes time.",abilities:[["Transform","A","Change from your civilian form to your heroic form, or vice versa."]],pick:1},
  {name:"Device Transition",desc:"You transform via a device — cybernetics, a magical artifact — and need access to it to transform.",abilities:[["Device Transform","A","If you have access to your device, change from your civilian form to your heroic form, or vice versa. After your transformation, take a basic action using your Min die. If you have any penalties that separate you from your device or otherwise inhibit you having full access to your device, you cannot use this ability."]],pick:1},
  {name:"Merging/Possession Transition",desc:"You require other entities to change forms — merging with someone, or taking control of objects or people.",abilities:[
   ["Merge","A","If you have access to a willing compatible person to enable your transform, change from your civilian form to your heroic form, or vice versa. After your transformation, take a basic action using your Min die. If you have any penalties that separate you from that person, you cannot use this ability."],
   ["Possess Person","A","Attack using [a power gained from your archetype]. If you incapacitate the target and change forms, you may use your Min die as a bonus to your next action. Alternatively, you may possess a willing target for no bonus."],
   ["Possess Object","A","Overcome using [a quality gained from your archetype]. On a success, merge with an item and then use your Min die to take a basic action."]],pick:1},
  {name:"Uncontrollable Transition",desc:"You transform in response to stress — whether you want to or not.",abilities:[["Uncontrolled Transform","A/I","The first time you take damage or change zones in a scene, you must change from your civilian form to your heroic form. You can also transform by taking an action and taking damage equal to a roll of your current status die. After an action scene, you change back to your civilian form."]],pick:1}],
 dividedAbilities:[
  ["Divided Psyche","I","While you are in your civilian form, use two qualities instead of a power and a quality. While in your heroic form, use two powers instead of a power and a quality. (Use your status in both cases.) You cannot use abilities related to a power or quality you don't have access to."],
  ["Split Form","I","Choose two powers and two qualities that you always have access to in either form. You must divide up the remainder of your powers and qualities between your civilian and heroic forms, so they are only usable within those forms. You cannot use abilities related to a power or quality you don't have access to. In the next step, when you create a roleplaying quality, you will have access to that in either form."]],
 personalityNote:"Optionally, you may take two different personalities — one for each form — changing your status dice as appropriate. (You still only have one roleplaying quality and Out ability.)"
};

export const MODULAR: { note: string; fixed: { green: RawAbility[]; yellow: RawAbility[]; red: RawAbility[] }; defaultMode: string; powerlessMode: string; green: ModeDef[]; yellow: ModeDef[]; red: ModeDef[] } = {
 note:"Choose another archetype (from your archetype roll, or reroll) as your base archetype, which becomes \"modularized.\" Assign powers and qualities as listed in that archetype, but skip gaining any abilities from it. If you have fewer than four powers, add one or two d6 powers of your choice until you have four powers. Take a principle from the base archetype.",
 fixed:{green:[["Switch","A","Boost yourself using [power/quality]. Then change modes."]],
        yellow:[["Quick Switch","A","Destroy one bonus on you. Change modes, then take an action in the new mode."]],
        red:[["Emergency Switch","R","When you are hit with an Attack, you may change to any mode. If you do, take extra damage equal to the Min die or take a minor twist."]]},
 defaultMode:"Default Mode: assign dice according to your chosen archetype. You gain no additional abilities in this mode.",
 powerlessMode:"Powerless Mode (optional): choose one of your powers from your default mode at d6, and another at d10. Take this mode if you could be separated from your power source. While in this mode you can only use abilities from your principles.",
 green:[
  {name:"Debilitator Mode",rule:"Pick four powers from your default mode: one at the same die size, one decreased a size (min d4), and two increased a size (max d12). You cannot Boost, Defend, or Overcome in this mode.",ability:["Debilitator","A","Hinder all nearby opponents using [power]. If you roll doubles, take damage equal to your Max die, and then you may also Attack all nearby opponents with your Min die."]},
  {name:"Improvement Mode",rule:"Pick four powers from your default mode: two at the same die size, and two increased one die size (max d12). You cannot Attack or Hinder in this mode.",ability:["Improvement","A","Boost yourself using [power]. Create one bonus using your Max die and one bonus using your Mid die. These bonuses are persistent and exclusive."]},
  {name:"Scout Mode",rule:"Pick four powers from your default mode: two at the same die size, one decreased a size (min d4), and one increased a size (max d12). You cannot Attack or Boost in this mode.",ability:["Scout","A","Overcome using [power]. Defend yourself with your Max die. Then, you may end up anywhere in the current scene."]}],
 yellow:[
  {name:"Analysis Mode",rule:"Pick four powers from your default mode: keep two at the same size and increase two by one die size (max d12). You cannot Attack or Defend while in this mode.",ability:["Analysis","A","Hinder or use one of your principles to Overcome using [power]. Use your Max+Min dice."]},
  {name:"Bombardment Mode",rule:"Pick three powers from your default mode: two decreased a die size (min d4), and set one to d12. You cannot Boost, Hinder, or Overcome in this mode.",ability:["Bombardment","A","Defend yourself using [power]. You may Attack one target with your Max die."]},
  {name:"Regeneration Mode",rule:"Pick two powers from your default mode: keep one at the same size and increase another by two die sizes (max d12). You cannot Attack or Hinder in this mode.",ability:["Regeneration","A","Defend using [power]. Use your Max die. Recover Health equal to your Min die."]},
  {name:"Skirmish Mode",rule:"Pick four powers from your default mode: one at the same size, one decreased a size (min d4), and two increased a size (max d12). You cannot Boost, Defend, or Overcome in this mode.",ability:["Skirmish","A","Attack one target using [power]. Attack a different target with your Min die. At the end of your turn, you may change modes."]},
  {name:"Stalwart Mode",rule:"Pick four powers from your default mode: one at the same die size, two decreased a size (min d4), and one increased two die sizes (max d12). You cannot Hinder or Overcome in this mode.",ability:["Stalwart","A","Defend yourself and all nearby allies using [power] against each Attack until the beginning of your next turn."]}],
 red:[
  {name:"Destroyer Mode",rule:"Pick three powers from your default mode: keep two at the same size and increase another by one die size (max d12). You are immobile in this form and cannot Boost.",ability:["Destroyer","I","Whenever you take a basic Attack action, either use your Max+Min dice to Attack one target, or Attack two different targets, one using your Max die and one using your Mid die."]},
  {name:"Hunter/Killer Mode",rule:"Pick two powers from your default mode and increase each by one die size (max d12). You cannot Defend or Overcome in this mode.",ability:["Hunter/Killer","A","Move to any target in this scene and Hinder that target using [power]. Then, Attack that target using your Max+Min dice."]},
  {name:"Shield Mode",rule:"Pick four powers from your default mode: two at the same die size, and increase two by a die size (max d12). You cannot Attack in this mode.",ability:["Shield","R","When you are attacked, you may Defend against the Attack by rolling your single [power] die. If you reduce the damage to 0 or less, you may also Hinder the source of the damage with the result of the die you rolled."]}]
};

// Personalities (Step 4): status [G,Y,R]; out = Out ability text
export const PERSONALITIES: PersonalityDef[] = [
 {n:1,name:"Lone Wolf",status:[8,8,8],out:"Boost an ally by rolling your single [quality] die."},
 {n:2,name:"Natural Leader",status:[6,8,10],out:"Boost an ally by rolling your single [quality] die."},
 {n:3,name:"Impulsive",status:[6,6,8],out:"The hero who goes directly after you may take 1 damage to reroll their dice pool.",extra:{type:"upgradeAny",text:"Upgrade one of your power or quality dice by one step (to a maximum d12)."}},
 {n:4,name:"Mischievous",status:[6,8,8],out:"Hinder an opponent by rolling your single [power] die.",healthAny:true,extraText:"When determining your Health during Step 7, you may use any power or quality instead of an Athletic power or Mental quality."},
 {n:5,name:"Sarcastic",status:[8,8,8],out:"Hinder an opponent by rolling your single [quality] die."},
 {n:6,name:"Distant",status:[10,8,6],out:"Boost an ally by rolling your single Red status die."},
 {n:7,name:"Stalwart",status:[8,8,8],out:"Defend an ally by rolling your single [power] die."},
 {n:8,name:"Fast Talking",status:[6,8,10],out:"Hinder a minion or lieutenant by rolling your single [quality] die, and increase that penalty by -1."},
 {n:9,name:"Inquisitive",status:[6,8,10],out:"Choose an ally. Until your next turn, that ally may reroll one of their dice by using a Reaction."},
 {n:10,name:"Alluring",status:[6,8,10],out:"Boost an ally by rolling your single [power] die."},
 {n:11,name:"Stoic",status:[6,8,10],out:"Defend an ally by rolling your single [quality] die."},
 {n:12,name:"Nurturing",status:[6,6,12],out:"Boost an ally by rolling your single [quality] die."},
 {n:13,name:"Analytical",status:[10,8,6],out:"Remove a bonus or penalty of your choice."},
 {n:14,name:"Decisive",status:[8,8,8],out:"Boost an ally by rolling your single [power] die."},
 {n:15,name:"Jovial",status:[6,8,10],out:"Defend an ally by rolling your single [quality] die."},
 {n:16,name:"Cheerful",status:[10,8,6],out:"Boost an ally by rolling your single [power] die."},
 {n:17,name:"Naive",status:[6,6,12],out:"Hinder an opponent by rolling your single [power] die."},
 {n:18,name:"Apathetic",status:[6,8,10],out:"Remove a bonus or penalty of your choice."},
 {n:19,name:"Jaded",status:[10,8,6],out:"Remove a bonus or penalty of your choice."},
 {n:20,name:"Arrogant",status:[10,8,6],out:"Hinder an opponent by rolling your single [power] die."}
];

// Red abilities (Step 5) by category. Requires a power/quality in that category (d6+ if ability uses none).
export const RED_ABILITIES: Record<string, { kind: "power" | "quality"; list: RawAbility[] }> = {
 "Athletic":{kind:"power",list:[
  ["Major Regeneration","A","Hinder yourself using Vitality. Use your Min die. Recover health equal to your Max+Mid dice.","Vitality"],
  ["Paragon Feat","A","Overcome using [power] in a situation that requires you to be more than humanly capable, like an extreme feat of strength or speed. Use your Max+Min dice. Boost all nearby allies with your Mid die."],
  ["Push Your Limits","I","You have no limit on amount of Reactions you can take. Each time you use a Reaction after the first one each turn, take 1 irreducible damage or take a minor twist."],
  ["Reactive Strike","R","When you are Attacked and dealt damage, you may Attack the source of that damage by rolling your single [power] die, plus the amount of damage you take."]]},
 "Elemental/Energy":{kind:"power",list:[
  ["Charged Up Blast","A","Attack using [power] and at least one bonus. Use your Max+Mid+Min dice. Destroy all of your bonuses, adding each of them to this Attack first, even if they are exclusive."],
  ["Eruption","A","Attack up to three targets, one of which must be you, using [power]. Assign your Min, Mid, and Max dice as you choose among those targets."],
  ["Improved Immunity","I","If you would take damage from [element/energy], ignore that damage and Recover that amount instead. Use the value of the damage to Boost yourself."],
  ["Powerful Strike","A","Attack using [power]. Use your Max+Mid dice."],
  ["Purification","A","Remove all bonuses and penalties from the scene. You cannot use this ability again this scene."],
  ["Summoned Allies","A","Use [power] to create a number of d6 minions equal to your Mid die. Choose the one same basic action that they each perform. They all act at the start of your turn."]]},
 "Hallmark":{kind:"power",list:[
  ["Charged Up Blast","A","Attack using [Signature Weaponry] and at least one bonus. Use your Max+Mid+Min dice. Destroy all of your bonuses, adding each of them to this Attack first, even if they are exclusive.","Signature Weaponry"],
  ["Quick Exit","A","Attack using [Signature Vehicle]. Use your Max die. Hinder each nearby opponent with your Mid die. After using this ability, you and up to 2 allies may end up anywhere in the scene, even outside of the action.","Signature Vehicle"],
  ["Sacrificial Ram","A","Attack up to three nearby targets using [Signature Vehicle]. Use your Max+Mid dice against each of them. You cannot use your Signature Vehicle power for the rest of this scene and until it is recovered/repaired.","Signature Vehicle"],
  ["Ultimate Weaponry","A","Boost yourself using [power]. Use your Max die. That bonus is persistent and exclusive. Attack using your Mid die plus that bonus."]]},
 "Intellectual":{kind:"power",list:[
  ["Calculated Dodge","R","You may take 1 irreducible damage to reroll the dice pool of a target that is Attacking or Hindering you."],
  ["Give Time","A","Boost another hero using [power]. If that hero has already acted for the turn, use your Max die, and that hero loses Health equal to your Min die. That hero acts next in the turn order."],
  ["Reliable Aptitude","I","When taking any action using [power], you may reroll your Min die before determining effects."],
  ["Unerring Strike","A","Attack using [power]. Use your Max+Min dice. Ignore all penalties on this attack, ignore any Defend actions, and it cannot be affected by Reactions."]]},
 "Materials":{kind:"power",list:[
  ["Field of Hazards","A","Hinder any number of targets in the scene using [power]. Use your Max+Min dice. If you roll doubles, also Attack each target using your Mid die."],
  ["Impenetrable Defense","A","Defend using [power] against all Attacks against you until your next turn using your Max+Mid dice."],
  ["Like the Wind","R","When you are Attacked and dealt damage, you may ignore that damage completely. If you do, treat the value of the damage as a Hinder action against you instead."],
  ["Powerful Strike","A","Attack using [power]. Use your Max+Mid dice."],
  ["Summoned Allies","A","Use [power] to create a number of d6 minions equal to your Mid die. Choose the one same basic action that they each perform. They all act at the start of your turn."]]},
 "Mobility":{kind:"power",list:[
  ["Calculated Dodge","R","You may take 1 irreducible damage to reroll the dice pool of a target that is Attacking or Hindering you."],
  ["Heroic Interruption","R","When an Attack deals damage to a nearby hero in the Red zone, you may take d6 irreducible damage to redirect that Attack to a target of your choice, other than the source of the Attack."],
  ["Intercession","R","When multiple nearby heroes are Attacked, you may take all the damage instead. If you do, roll your [power] die + Red zone die and Defend against the Attack by the total."],
  ["Take Down","A","Attack using [power]. Use your Max die. Then, Hinder that target using your Mid+Min dice."],
  ["Untouchable Movement","A","Boost yourself using [power]. Use your Max+Min dice. Then, you may end up anywhere else in the scene, avoiding any dangers between your starting and ending locations."]]},
 "Psychic":{kind:"power",list:[
  ["Dangerous Hinder","A","Hinder using [power]. Use your Max+Mid dice. If you roll doubles, also Attack the target using your Mid+Min dice and take damage equal to your Min die."],
  ["Dire Control","A","Select a minion. That minion is now entirely under your control and acts at the start of your turn. If you are incapacitated, you lose control of this minion. You may also choose to release control of this minion at any time. At the end of the scene, this minion is defeated."],
  ["Final Wrath","A","Attack using [power]. Use your Max+Mid+Min dice. Take a major twist."],
  ["Give Time","A","Boost another hero using [power]. If that hero has already acted for the turn, use your Max die, and that hero loses health equal to your Min die. That hero acts next in the turn order."],
  ["Impenetrable Defense","A","Defend using [power] with your Max+Mid dice against all Attacks against you until your next turn."],
  ["Impossible Knowledge","I","At the start of your turn, change any penalty into a bonus."],
  ["Summoned Allies","A","Use [power] to create a number of d6 minions equal to your Mid die. Choose the one same basic action that they each perform. They all act at the start of your turn."]]},
 "Self Control":{kind:"power",list:[
  ["Change Self","I","At the start of your turn, swap two of your power dice. They stay swapped until changed again or the scene ends."],
  ["Empowerment","R","When you are Attacked, roll your single [power] die as a Defend against that Attack. Also Boost yourself with that same roll."],
  ["Impenetrable Defense","A","Defend using [power] with your Max+Mid dice against all Attacks against you until your next turn."],
  ["Major Regeneration","A","Hinder yourself using [power]. Use your Min die. Recover Health equal to your Max+Mid dice."],
  ["Defensive Deflection","R","When you would be dealt damage, you may roll your single [power] die as a Defend against that damage and as an Attack against a nearby target other than the source of that damage."],
  ["Mutable Form","A","Choose three basic actions. Use [power] in your pool and take one action with your Max die, a different action with your Mid die, and a third action with your Min die."],
  ["Powerful Strike","A","Attack using [power]. Use your Max+Mid dice."],
  ["Resurrection","I","Once per issue, if you would go to 0 Health, roll [power] + [any Physical or Mental quality] + Red zone die. Your Health becomes that number."],
  ["Summoned Allies","A","Use [power] to create a number of d6 minions equal to your Mid die. Choose the one same basic action that they each perform. They all act at the start of your turn."]]},
 "Technological":{kind:"power",list:[
  ["Combustion","A","Attack multiple nearby targets using [power]. Use your Max+Mid dice. Take irreducible damage equal to your Min die."],
  ["Final Wrath","A","Attack using [power]. Use your Max+Mid+Min dice. Take a major twist."],
  ["Full Defensive","A","Hinder yourself by rolling your single [power] die. You are immune to damage until the start of your next turn. You cannot use this ability again this scene."],
  ["Ultimate Weaponry","A","Boost yourself using [power]. Use your Max die. That bonus is persistent and exclusive. Then, Attack using your Mid die plus that bonus."],
  ["Unload","A","Attack multiple targets using [power], using your Max+Min dice. If you roll doubles, take a minor twist or damage equal to your Mid die."]]},
 "Information":{kind:"quality",list:[
  ["Critical Eye","A","Select a target. Boost using [quality]. Use your Max+Mid+Min dice. That bonus must be used against that target before the end of your next turn, or it is wasted."],
  ["Discern Weakness","A","Remove a bonus on a target. Hinder that target using [quality]. Use your Max die, and that penalty is persistent and exclusive."],
  ["Reliable Aptitude","I","When taking any action using [quality], you may reroll your Min die before determining effects."],
  ["Specialized Info","A","Overcome using [quality]. Use your Max+Min dice."]]},
 "Mental":{kind:"quality",list:[
  ["Aware Response","R","After an opponent Attacks or Hinders you or a nearby ally, Attack the opponent by rolling your single [quality] die."],
  ["Canny Awareness","A","Overcome using [quality]. Use your Max+Min dice. Hinder all nearby opponents with your Mid die."],
  ["Considered Planning","A","Boost using [quality] and use your Max die. Defend against all Attacks against you using your Mid die until your next turn. Note your Min die result: as a Reaction, until your next turn, you may Hinder an attacker using that result."],
  ["Final Wrath","A","Attack using [quality]. Use your Max+Mid+Min dice. Take a major twist."],
  ["Harmony","I","As long as you have at least one bonus created from [quality], treat [power] as one size higher (max d12)."],
  ["Purification","A","Remove all bonuses and penalties from the scene. You cannot use this ability again this scene."]]},
 "Physical":{kind:"quality",list:[
  ["Book It","A","Hinder any number of close targets using [quality]. Use your Max die. End your turn elsewhere in the scene."],
  ["Endurance Fighting","I","Whenever you Attack a target with an action, you may also Hinder that target with your Min die."],
  ["Finishing Blow","A","Attack using [quality]. Use your Max die. Remove any number of penalties from the target. Add your Min die to the Attack each time you remove a penalty."],
  ["Reactive Defense","R","When an opponent Attacks, you may become the target of that Attack and Defend by rolling your single [quality] die."]]},
 "Social":{kind:"quality",list:[
  ["Heroic Sacrifice","R","When an opponent Attacks, you may become the target of that Attack and Defend by rolling your single Red zone die."],
  ["Inspiring Totem","I","When you use an ability action, you may also perform any one basic action using your Mid die on the same roll."],
  ["Lead by Example","A","Make a basic action using [quality]. Use your Max die. All other heroes who take the same basic action on their turn against the same target receive a Boost from your Mid+Min dice."],
  ["Ultimatum","A","Hinder using [quality]. Use your Max+Min dice. Boost yourself or an ally with your Mid die."]]}
};

// Powers & Qualities catalog (p.47, 115-121). Descriptions condensed.
export const POWER_CATS: TraitCatalog = {
 "Athletic":{health:true,items:{"Agility":"Honed reflexes.","Speed":"Quick on your feet.","Strength":"Strong; lifting is no problem.","Vitality":"Good shape and health; at high levels, regeneration."}},
 "Elemental/Energy":{items:{"Cold":"Lower temperatures dramatically and shape ice.","Cosmic":"Command the primal energies of the universe.","Electricity":"Command the lightning.","Fire":"Make everything burn.","Infernal":"Command the demonic energies of the underworld.","Nuclear":"Channel raw atomic power and radiation.","Radiant":"The light of the Heavenly Host, ready to purge evil.","Sonic":"Focused sound waves for vibration and mimicry.","Weather":"Control the weather, storms, and winds."}},
 "Hallmark":{custom:true,items:{"Signature Vehicle":"A custom vehicle nearly always on hand — rename it on your sheet.","Signature Weaponry":"A weapon that's almost part of you — rename it on your sheet.","Invented Power":"A power not otherwise covered, with GM's permission."}},
 "Intellectual":{items:{"Awareness":"Enhanced senses, from danger sense to superior sight and hearing.","Deduction":"Leaps of logic by analyzing details.","Intuition":"Strong gut feelings that are frequently right.","Lightning Calculator":"Intense math in the blink of an eye.","Presence":"You project your personality strongly."}},
 "Materials":{items:{"Metal":"Command and shape metals.","Plants":"Plants respond to your thoughts.","Stone":"Shape stone to build and destroy.","Toxic":"Manipulate toxic substances, waste, and poison gases.","Transmutation":"Transform non-living materials from one type to another."}},
 "Mobility":{items:{"Flight":"Look, up in the sky!","Leaping":"Leap through the air with ease.","Momentum":"Build up momentum as you move and channel it.","Swimming":"At home in the water (d8+: breathe underwater).","Swinging":"Swing across town via ropes or other devices.","Teleportation":"Disappear and reappear elsewhere; bigger die, more range and control.","Wall-Crawling":"Stick to and travel across walls."}},
 "Psychic":{items:{"Animal Control":"Talk to and command non-sentient animals.","Illusions":"Weave convincing mental images.","Precognition":"See into a potential future.","Postcognition":"Visions of the past of a person, place, or object.","Remote Viewing":"Project your senses to another place.","Suggestion":"Influence minds to act on your will.","Telekinesis":"Move things with your mind.","Telepathy":"Send thoughts and read minds."}},
 "Self Control":{items:{"Absorption":"Absorb energy and channel it into other forms.","Density Control":"Become more or less dense.","Duplication":"Make copies of yourself.","Elasticity":"Stretch your entire body.","Intangibility":"Pass through solid objects.","Invisibility":"Become unseen.","Part Detachment":"Give someone a hand. Or any other limb.","Shapeshifting":"Change into something roughly the same size.","Size-Changing":"Grow to building-size or shrink to ant-size."}},
 "Technological":{items:{"Gadgets":"A variety of useful tech tools, generally built by someone else.","Inventions":"Invent your own tools and keep some on you.","Power Suit":"A technological suit with built-in functions.","Robotics":"Create your own robot servitors."}}
};
export const QUALITY_CATS: TraitCatalog = {
 "Information":{items:{"Criminal Underworld Info":"Connected in organized crime.","Deep Space Knowledge":"Experience with inhabited worlds beyond Earth.","History":"Deep knowledge of history.","Magical Lore":"Occult tomes and the mystical and arcane realms.","Medicine":"Trained in treating illness and injury.","Otherworldly Mythos":"Strange knowledge of other dimensions.","Science":"Physics, biology, and more.","Technology":"Engineering and computers."}},
 "Mental":{health:true,items:{"Alertness":"Senses trained to be alert at all times.","Conviction":"A cause or faith that drives you.","Creativity":"Practiced in a creative field.","Investigation":"Evidence collection and forensics.","Self-Discipline":"Incredible discipline over your emotions."}},
 "Physical":{items:{"Acrobatics":"Gymnastic and aerial maneuvers.","Close Combat":"Melee weapons, martial arts, or plain punching.","Finesse":"Precise hands — defuse a bomb, pick a pocket.","Fitness":"Top physical shape.","Ranged Combat":"Attacking from afar — guns, archery, lasers.","Stealth":"Sneaking in any environment."}},
 "Social":{items:{"Banter":"A gift for gab that annoys enemies (or friends).","Imposing":"Intimidating to your foes.","Insight":"Read people and what they're hiding.","Leadership":"Lead and direct allies effectively.","Persuasion":"Convince others it's in their interest."}}
};
// Health chart (p.113): max -> [green low, yellow low]; red = yellow low-1 .. 1
export const HEALTH_TABLE: Record<number, [number, number]> = {40:[30,15],39:[30,15],38:[29,14],37:[29,14],36:[28,14],35:[27,13],34:[26,13],33:[26,13],32:[25,12],31:[24,12],30:[23,12],29:[23,11],28:[22,11],27:[21,11],26:[21,10],25:[20,10],24:[19,10],23:[19,9],22:[18,9],21:[17,9],20:[16,8],19:[15,8],18:[15,8],17:[14,7]};
export const RETCONS: { id: string; text: string }[] = [
 {id:"swapPowers",text:"Swap any two dice within your powers"},
 {id:"swapQualities",text:"Swap any two dice within your qualities"},
 {id:"swapAbility",text:"Choose a different power or quality used in one of your abilities"},
 {id:"addD6",text:"Add any d6 power or quality from any category"},
 {id:"redUp",text:"Increase your Red status die by one size (maximum d12)"},
 {id:"swapPrinciple",text:"Change either of your principles to any other principle"},
 {id:"extraRed",text:"Gain an extra Red ability, as described in Step 5"}
];

// Principles (p.122-141): [name, category, during roleplaying, minor twist, major twist, green ability text]
const HP = " You and each of your allies gain a hero point.";
export const PRINCIPLES: PrincipleRow[] = [
 ["Principle of Destiny","Esoteric","Signs and portents lead you towards an inevitable place in your life. You can always gain some measure of direction when needed.","What omen of dire fortune did you just witness?","What heinous prophecy just came true?","Overcome a situation directly connected to your destiny and use your Max die."+HP],
 ["Principle of [Energy/Element]","Esoteric","You have an affinity to or a love of [energy/element]. You can interact with that [energy/element] with ease.","What other energy/element is currently causing your powers to go on the fritz?","What source of energy/element is currently dampening all your powers?","Overcome a challenge involving [energy/element] and use your Max die."+HP],
 ["Principle of Exorcism","Esoteric","You can detect the subtle hints of the influence of other realms in an event.","What is (literally or figuratively) coming back to haunt you?","What has been allowed to enter this world?","Overcome entities or elements from another dimension and use your Max die."+HP],
 ["Principle of Fauna","Esoteric","Your innate animalistic nature allows you to identify any type of non-sapient animal life and determine its origin in broad terms, such as Earth, alien, etc.","How did your primal nature get the better of you?","What is the only way the animal within can be restrained?","Overcome with the aid of local fauna and use your Max die."+HP],
 ["Principle of Flora","Esoteric","You can identify any type of plant life and determine its origin in broad terms, such as Earth, alien, etc.","What grows out of your control?","How is nature reclaiming something important?","Overcome with the aid of local flora and use your Max die."+HP],
 ["Principle of the Future","Esoteric","You have visions or knowledge of things yet to come.","What unintended ripple did your actions have?","What ripple effect now threatens the future as you know it?","Overcome using your knowledge of possible futures and use your Max die."+HP],
 ["Principle of Immortality","Esoteric","You do not age and will not be affected by mundane ailments.","You take the long view of things. How does that cause you to be too slow?","What important attachment must you shed?","Overcome a situation involving your physical condition and use your Max die."+HP],
 ["Principle of the Inner Demon","Esoteric","You have a darkness in you that you strive to keep suppressed. You can reach out to your dark side to connect with similar forces.","What sinister act comes from tapping into your dark side?","What havoc does your dark side inflict as you allow it to take control?","Tap into your dark psyche to Overcome a problem and use your Max die."+HP],
 ["Principle of Magic","Esoteric","You are attuned to an otherworldly force, and can feel the mystical energies of the area.","What weird curse is now following you around?","What mystical backlash has changed your life?","Overcome against a mystical force and use your Max die."+HP],
 ["Principle of the Sea","Esoteric","You can speak to aquatic creatures and breathe underwater.","What challenge does the surface world pose for you?","What disaster is incoming as the sea comes calling?","Overcome a situation while underwater and use your Max die."+HP],
 ["Principle of Space","Esoteric","You can survive in the vacuum of space without additional equipment.","Who can hear you scream?","What caused you to drift off into the unknown?","Overcome while in space (or conditions similar to space) and use your Max die."+HP],
 ["Principle of the Time Traveler","Esoteric","You are far from your own time and are often unsure how to act in this time. You have an innate sense for when time is not quite right in the era you're in.","What detail of this era did you not previously know about?","What effects are happening as you discorporate in time?","Overcome a problem using knowledge from your home era and use your Max die."+HP],
 ["Principle of the Undead","Esoteric","You are \"living challenged.\" You can still be hurt and damaged, but you can ignore many of the afflictions that bother the living.","How did your undead nature unnerve those around you?","How are you risking your connection to the living world with what happened?","Overcome a situation where your undead nature comes in handy and use your Max die."+HP],
 ["Principle of Clockwork","Expertise","You are good at understanding how pieces operate in tandem and can identify flaws in ordered systems.","What tool just broke?","What faraway location are your tools now occupying?","Overcome a complex problem with a simple tool and use your Max die."+HP],
 ["Principle of the Gearhead","Expertise","You always know the general state of repair or function of an item of technology, whether it's a simple toaster or an alien orbital defense system.","What mechanical device just shorted out?","What machine just went terribly off the rails?","Overcome a technological challenge and use your Max die."+HP],
 ["Principle of History","Expertise","You have many contacts and references in the archaeological, historical, and anthropological fields.","How did your old-timeyness cause an issue?","What ancient force is now making itself known in the present?","Overcome a situation involving archaeology, history, or puzzle-solving and use your Max die."+HP],
 ["Principle of the Indestructible","Expertise","You ignore damage from unpowered close-combat weapons and attacks, such as clubs and non-powered fists, or basic ranged attacks, such as slings and arrows.","What goes wrong with your defenses?","Who gets hurt other than you as a result of you not being able to take damage?","Overcome in a situation where you charge headlong into danger and use your Max die."+HP],
 ["Principle of the Lab","Expertise","You have nearly unlimited access to a dedicated research area, and are at home there.","What did you make a detour to observe and sample for later experiments?","Something's gone very wrong at the lab; what was it?","Overcome while in a familiar workspace or when you have ample research time. Use your Max die."+HP],
 ["Principle of Mastery","Expertise","You have thoroughly studied your own powers and are proud of your mastery of them. You understand a good deal about the metaphysics of your powers.","How did your powers fail you in the moment?","What side effects are you suffering from your powers?","Overcome in a situation that uses your powers in a new way and use your Max die."+HP],
 ["Principle of the Mentor","Expertise","It is important to you to share your knowledge and experience with less-weathered heroes. Everyone grants you some measure of respect for your wisdom.","Which whippersnapper just showed you up?","What has just proven that you're too behind the times?","Overcome a challenge that someone else younger already tried and failed. Use your Max die."+HP],
 ["Principle of the Powerless","Expertise","You value training and hard work over enhanced abilities. You understand how to get things done without powers and how to exploit flaws in powered individuals.","What temporary injury did you just suffer?","What more serious injury did you just suffer?","Use your knowledge of the limitations of super powers in an Overcome action and use your Max die."+HP],
 ["Principle of Science","Expertise","You are up to date on and understand most modern scientific theories and research and can quote from them during conversations.","What were the surprising effects of leveraging that scientific principle in this situation?","Oh heck! What just blew up?","Overcome while applying specific scientific principles. Use your Max die."+HP],
 ["Principle of Speed","Expertise","You're fast, and you don't like to waste time. You like to be on your way as quickly as possible.","What physical drawbacks do you suffer from going too fast?","What critical detail did you speed by earlier that is now coming back to haunt you?","When you successfully Overcome, you may end up anywhere in the current environment."+HP,"I"],
 ["Principle of Stealth","Expertise","You always know the most efficient method to enter or leave a location.","What evidence of your presence did you just leave behind?","What just happened that identified you as an obvious threat?","Overcome to infiltrate somewhere or avoid detection and use your Max die."+HP],
 ["Principle of Strength","Expertise","You are very strong, so you must be careful to not crush delicate things. You do not need to roll to perform mundane acts of great strength.","What just broke?","Who just broke?","Overcome using brute force and use your Max die."+HP],
 ["Principle of the Tactician","Expertise","You are constantly assessing the situation, making plans and backup plans, and then reassessing the situation.","What one variable did your plan not account for?","What major threat is revealed that invalidates all your plans?","Overcome when you can flashback to how you prepared for this exact situation. Use your Max die."+HP],
 ["Principle of Whispers","Expertise","You hear a voice in your head that no one else hears. That voice tells you things, which might be true or false, but the voice certainly seems to know a lot.","How did the voice in your head just distract you?","What is the voice demanding of you now?","Overcome against a challenge that involves information that you have no real way of knowing and use your Max die."+HP],
 ["Principle of Chaos","Ideals","You are an unpredictable free spirit. Even towering intellects can't predict what you will do next.","How did you fall in line in order to get something done?","What has caused you to become predictable and stale?","Overcome a situation in a way that is truly unpredictable and use your Max die."+HP],
 ["Principle of Compassion","Ideals","You are an empathetic person. You feel the suffering of others around you.","What overwhelming injustice causes you extra pain?","How will you handle disconnecting from humanity?","Overcome to connect with an individual on a personal level and use your Max die."+HP],
 ["Principle of the Defender","Ideals","You will put yourself in harm's way to defend another without a second thought.","How do your actions put you in more danger than before?","What great sacrifice did you just make to succeed?","Overcome a situation that requires you to hold the line and use your Max die OR use your Mid die and Defend with your Min die."+HP],
 ["Principle of Dependence","Ideals","You are reliant on [something] and cannot normally function without it.","How did the object of your dependence get damaged or lost?","How is your dependence preventing you from functioning as a hero?","Overcome in a situation that the object of your dependence was made for. Use your Max die."+HP],
 ["Principle of Equality","Ideals","You have a keen sense of social status and can spot any situation where people are treated unfairly.","Who is in danger that you just spotted?","What will you sacrifice to protect the downtrodden?","Overcome to protect the rights of the underprivileged and use your Max die."+HP],
 ["Principle of Great Power","Ideals","Your powers are so strong they can even scare you sometimes, but you work hard to control them. You can wield those powers to intimidate others.","How do you restrain yourself from unleashing your full power?","What major damage do you inflict in the process of saving the day?","Overcome a situation using one of your highest rated powers and use your Max die."+HP],
 ["Principle of the Hero","Ideals","Because of your abilities, you have a calling to protect others.","Your immediate need to help someone else causes you to drop the ball in your personal life. What was it?","You're given an ultimatum between your life as a hero and something else you value. What do you give up?","Overcome in a situation in which innocent people are in immediate danger and use your Max die."+HP],
 ["Principle of Honor","Ideals","You are governed by a strict code of conduct. Even under coercion, you will not compromise your ideals.","Your honor has been challenged. How will you answer?","Will you choose your honor, or your life?","Overcome a situation to maintain your code of honor and use your Max die."+HP],
 ["Principle of Justice","Ideals","You are always aware of acts of injustice in your environment and those who have committed them.","How are you taking extra time to show yourself as a shining example of justice?","How do you unnerve your allies in the single-minded pursuit of justice?","Overcome to stop an act of injustice in progress and use your Max die."+HP],
 ["Principle of Liberty","Ideals","You believe strongly in freedom and always side with the oppressed. You can never truly be mentally restrained.","How do you become temporarily trapped?","How have you become a prisoner yourself?","Overcome in a situation where you are restricted or bound and use your Max die."+HP],
 ["Principle of Order","Ideals","You believe in organization and concordance. You always keep your head in the face of chaos.","What element of disorder causes your plan to fall apart?","How is your ordered existence ruined by chaos?","Overcome a challenge where you can organize other people. Use your Max die."+HP],
 ["Principle of Self Preservation","Ideals","You value your own safety more than most others in your line of work. You will never be caught fully unaware in a situation where your life is at stake.","Who suffers because of your hesitation?","Are you willing to lay down your life to save others?","Overcome to get yourself out of immediate danger and use your Max die."+HP],
 ["Principle of the Zealot","Ideals","Your will is indomitable, and your beliefs govern your actions.","Who suffered extra because of your zealous persecution?","What has your faith called on you to do that no one else will understand?","Overcome a situation that tests your faith and use your Max die."+HP],
 ["Principle of Ambition","Identity","There is something you want, and you strive towards achieving your goals, no matter the cost. You see paths to victory that no one else will.","How is the pursuit of your goals getting in the way of being a hero in this situation?","What did you just pass up or miss that could have helped you achieve your biggest goal at last?","Overcome a situation where someone else has given you a bonus from a Boost and use your Max die."+HP],
 ["Principle of Amnesia","Identity","Your past is lost to you or otherwise obscured. Others have immense difficulty in keeping track of you.","You have a flash of your former life that momentarily distracted you — what was it?","A shocking detail of your past changes the current situation — how does it affect the scene?","Overcome a situation where a completely fresh perspective is useful and use your Max die."+HP],
 ["Principle of Detachment","Identity","You are detached from emotional situations and always keep your cool.","Which hero or supporting character have you just alienated with your distant behavior?","How have you withdrawn from the current situation to cope?","Overcome a challenge related to duress or fear and use your Max die."+HP],
 ["Principle of Discovery","Identity","You are eager to learn new things at any cost. You can rattle off data about newly discovered concepts and ideas.","What new discovery causes you to reconsider what you are doing?","What new discovery must you keep hidden at all costs?","When you're on the forefront in making a discovery or invention and take an Overcome action to further your knowledge, use your Max die."+HP],
 ["Principle of Levity","Identity","You keep your positive outlook even when all hope is lost. Your spirit is nearly impossible to break.","Who did you offend by making light at the wrong time?","What has occurred to finally break your good spirits?","Overcome a dire situation where your jokes prevent demoralization and use your Max die."+HP],
 ["Principle of the Loner","Identity","You're the best at what you do, as long as no one else sees you do it. You can always find your own path.","Now that you're separated from your team, how will you get back?","How do you alienate the rest of your team with your loner tendencies?","Overcome when doing something different from the rest of your team and use your Max die."+HP],
 ["Principle of the Nomad","Identity","You are far away from home, but you're used to living on the road. You know how to get by on the run.","What problem does your lack of attachments cause?","How have you been lost from your new home?","Overcome a situation where you can apply lessons from the road and use your Max die."+HP],
 ["Principle of Peace","Identity","You believe that the ultimate goal of your mission is peace, and that violence is usually not the answer. While not necessarily a pacifist, you can almost always come up with a non-violent solution to problems.","What causes you to lose your calm?","What major issue do you create with your team when you refuse to engage in violence?","Overcome a situation with serenity instead of violence and use your Max die."+HP],
 ["Principle of Rage","Identity","They don't like you when you're angry. Your fury is intimidating to many.","What did your anger just mess up?","Who have you thoroughly alienated with your outbursts?","Overcome a situation where you can channel your rage for good and use your Max die."+HP],
 ["Principle of Savagery","Identity","Your wild instincts stay with you and guide your actions. You can survive in the wild and resist the trappings of civilization.","Who did you harm with your rampage?","What major act of collateral damage are you responsible for?","Overcome a situation that taps into your primal nature and use your Max die."+HP],
 ["Principle of the Split","Identity","You have two (or more) entirely separate facets to your personality. As a result you can look at a situation from many different angles.","What perspective ended up being the wrong one for the situation?","What inner conflict has completely thrown you off?","Overcome a situation that benefits from having a completely new outlook and use your Max die."+HP],
 ["Principle of the Spotless Mind","Identity","You have a state of blissful ignorance. Grudges, entanglements, and commitments slide right off you.","What slid off you previously that could have been useful right now?","What major thing did you forget and why did forgetting it make your situation much worse?","Overcome a situation where being free of the past is useful and use your Max die."+HP],
 ["Principle of Business","Responsibility","You are an entrepreneur — running a business is an important part of your life and your identity. You have a base of operations that you can rely on for support.","You're always looking at the bigger picture. How does that cause friction in the moment with your team?","Your business interests are in danger. Where are your priorities, truly?","Overcome in a situation related to the field of your business or knowing locals. Use your Max die."+HP],
 ["Principle of the Debtor","Responsibility","You owe someone or something more than you can ever repay. You know plenty of folks willing to give out favors, but it'll cost you later.","What potential source of wealth looks mighty tempting right about now?","Who has come to collect?","Overcome in a situation related to repaying a debt and use your Max die."+HP],
 ["Principle of the Detective","Responsibility","You can always tell when an important piece of information is being left out or obscured, though you might not know exactly what it is.","What important clue did you miss?","What major secret was just revealed that you would rather have stayed hidden?","Overcome to learn hidden information and use your Max die."+HP],
 ["Principle of the Double Agent","Responsibility","You are loyal to more than one organization, possibly working at cross purposes. You always cover your tracks.","What were you just forced to do that seemed strange to your current allies?","Will you shatter your trust with your current allies or forfeit what your other allegiance offers?","Overcome in a situation where you can draw upon resources from your other organization and use your Max die."+HP],
 ["Principle of the Everyman","Responsibility","You are just a normal person who has had power thrust upon them or are otherwise in over your head. You don't have the same sense of lofty purpose as other heroes. When needed, you can make yourself just another face in the crowd.","Which hero did you make look good at the expense of yourself?","How are you utterly and totally out of your league?","Overcome when using a bonus made by another hero and use your Max die."+HP],
 ["Principle of Family","Responsibility","Your family is an important part of your life. You have relatives in a wide range of fields that you can call upon.","Which member of your family just compromised your mission?","What do you have to give up in your heroic life for the sake of your family?","Overcome in a situation where you have been given advice from a family member and use your Max die."+HP],
 ["Principle of the Mask","Responsibility","It is vitally important that you hide your true identity. You have a career that allows you to slip between identities when necessary.","What clue about your real identity did you leave behind?","Who from your civilian life is now in imminent danger?","Overcome using knowledge from your civilian life and use your Max die."+HP],
 ["Principle of the Sidekick","Responsibility","You always seem to be where the trouble is; you're never too far away when a crisis strikes the group you sidekick for.","Which hero has to rescue you from your current predicament?","What serious lesson that you ignored is now getting you into big trouble?","Overcome a challenge that has already flummoxed a more senior teammate and use your Max die."+HP],
 ["Principle of the Team","Responsibility","Your heroic team takes up a significant portion of your life and you have an official position in that team. Civilian authorities will recognize your status in the team.","What embarrassment did you just cause as a representative of your team?","What major sanctions will you suffer as a result of your actions?","Overcome by using your status as an official representative and use your Max die."+HP],
 ["Principle of the Underworld","Responsibility","You have a variety of contacts from the criminal underworld and organized crime.","What shady detail causes others to distrust you?","Are you guilty of what you're being arrested for?","Overcome a problem related to your knowledge of the criminal underworld or using one of your contacts and use your Max die."+HP],
 ["Principle of the Veteran","Responsibility","You remain clear-headed under intense combat situations.","What affected you emotionally about the current conflict?","How are you withdrawing from the current conflict?","Overcome a tactical challenge using knowledge of a previous conflict and use your Max die."+HP],
 ["Principle of Youth","Responsibility","You have an innocent and cheerful outlook on most things, based on your upbeat personality and general lack of experience. You can slip into many situations that adults would have trouble with.","Who has been put out by your overconfidence?","What person that you would hate to let down is now very disappointed in you?","Overcome a situation where your age or size is an asset and use your Max die."+HP]
];
