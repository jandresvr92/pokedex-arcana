export type CompetitivePartner = {
  name: string;
  role: string;
  reason: string;
};

export type CompetitiveProfile = {
  name: string;
  format: 'OU';
  roles: string[];
  summary: string;
  commonChecks: string[];
  recommendedPartners: CompetitivePartner[];
  notes: string[];
};

export type MoveNote = {
  name: string;
  summary: string;
  notes: string[];
};

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const competitiveProfiles: CompetitiveProfile[] = [
  {
    name: 'dragapult',
    format: 'OU',
    roles: ['speed control', 'special attacker', 'revenge killer'],
    summary: 'Dragapult pressures offensive teams with elite Speed and flexible attacking sets.',
    commonChecks: ['fairy types', 'bulky steels', 'priority users', 'special walls'],
    recommendedPartners: [
      {
        name: 'Great Tusk',
        role: 'hazard removal / physical pivot',
        reason: 'Covers Dark and Steel pressure while keeping hazards under control.',
      },
      {
        name: 'Gholdengo',
        role: 'hazard control blocker',
        reason: 'Punishes removal attempts and keeps offensive momentum on your side.',
      },
      {
        name: 'Kingambit',
        role: 'late-game cleaner',
        reason: 'Takes advantage of weakened teams and threatens Fairies with strong priority pressure.',
      },
      {
        name: 'Corviknight',
        role: 'defensive glue',
        reason: 'Offers a sturdy switch-in to physical attackers and helps stabilize the core.',
      },
      {
        name: 'Rotom-Wash',
        role: 'pivot / check',
        reason: 'Provides a safe pivot into Ice- and Ground-leaning counterplay.',
      },
    ],
    notes: [
      'Best used with hazard support and one or two partners that break bulky Fairies.',
      'Works well on offense and bulky offense because it forces frequent switches.',
    ],
  },
  {
    name: 'great tusk',
    format: 'OU',
    roles: ['hazard removal', 'physical attacker', 'tank'],
    summary: 'Great Tusk gives offensive teams removal, immediate damage, and excellent role compression.',
    commonChecks: ['flying types', 'grass types', 'fast special attackers'],
    recommendedPartners: [
      {
        name: 'Gholdengo',
        role: 'spin blocker',
        reason: 'Stops opposing removal and forms a strong hazard-centric core.',
      },
      {
        name: 'Dragapult',
        role: 'speed pressure',
        reason: 'Covers the speed gap and punishes teams that overload Tusk with special attackers.',
      },
      {
        name: 'Heatran',
        role: 'special wall / breaker',
        reason: 'Pressures Grass and Fairy checks while benefiting from the removal support.',
      },
      {
        name: 'Kingambit',
        role: 'win condition',
        reason: 'Capitalizes on weakened teams after Tusk has chipped and removed hazards.',
      },
    ],
    notes: [
      'Pairs well with offensive cores that appreciate Rapid Spin support.',
      'Can be built as either a pivot, offensive tank, or utility remover.',
    ],
  },
  {
    name: 'gholdengo',
    format: 'OU',
    roles: ['special attacker', 'hazard pressure', 'anti-removal'],
    summary: 'Gholdengo punishes passive play and protects hazards by blocking common removal routes.',
    commonChecks: ['strong ground attackers', 'dark types', 'bulky special walls'],
    recommendedPartners: [
      {
        name: 'Great Tusk',
        role: 'physical pressure',
        reason: 'Covers Ground matchups and helps create the hazard game Gholdengo wants.',
      },
      {
        name: 'Corviknight',
        role: 'ground immunity / pivot',
        reason: 'Provides defensive stability and lets Gholdengo enter safely.',
      },
      {
        name: 'Dragapult',
        role: 'tempo attacker',
        reason: 'Stacks offensive pressure and forces the opponent into awkward defensive sequences.',
      },
    ],
    notes: [
      'Usually works best on teams that are already committed to hazard stacking.',
      'Appreciates partners that force Ground-types and Dark-types to reveal themselves early.',
    ],
  },
  {
    name: 'kingambit',
    format: 'OU',
    roles: ['late-game cleaner', 'physical breaker'],
    summary: 'Kingambit threatens endgames and rewards teams that can soften checks beforehand.',
    commonChecks: ['fighting types', 'bulky grounds', 'strong fire coverage'],
    recommendedPartners: [
      {
        name: 'Dragapult',
        role: 'speed pressure',
        reason: 'Softens opposing teams so Kingambit can close games later.',
      },
      {
        name: 'Great Tusk',
        role: 'removal / breaker',
        reason: 'Creates the chip-heavy game state Kingambit likes and keeps hazards manageable.',
      },
      {
        name: 'Rotom-Wash',
        role: 'pivot',
        reason: 'Helps scout and bring Kingambit into favorable positions.',
      },
    ],
    notes: [
      'Works best when the rest of the team handles Fighting pressure well.',
      'Late-game value increases sharply if the opponent has already been chipped by hazards.',
    ],
  },
  {
    name: 'corviknight',
    format: 'OU',
    roles: ['defensive wall', 'pivot', 'hazard setter'],
    summary: 'Corviknight provides reliable physical bulk, hazard control and pivoting for many cores.',
    commonChecks: ['strong special attackers', 'electric partners', 'entry hazards'],
    recommendedPartners: [
      {
        name: 'Gholdengo',
        role: 'hazard pressure',
        reason: 'Pairs well by preventing passive removal and creating opportunities for Corviknight to stall.',
      },
      {
        name: 'Dragapult',
        role: 'offensive pressure',
        reason: 'Uses Corviknight as a safe pivot-in to threaten switches and momentum plays.',
      },
      {
        name: 'Rotom-Wash',
        role: 'pivot/support',
        reason: 'Provides utility and deals with Ground threats that can trouble Corviknight.',
      },
    ],
    notes: ['Excellent teammate for bulky-offense and hazard-focused cores.', 'Commonly carries Defog or Roost to extend longevity.'],
  },
  {
    name: 'rotom-wash',
    format: 'OU',
    roles: ['utility pivot', 'bulky pivot', 'check to water/ground threats'],
    summary: 'Rotom-Wash excels as a reliable pivot that cripples Ground and Water pressure while scouting moves.',
    commonChecks: ['grass types', 'strong electric attackers', 'toxic spikes'],
    recommendedPartners: [
      {
        name: 'Dragapult',
        role: 'revenge killer/offense',
        reason: 'Rotom-Wash handles Ground hazards and gives Dragapult safer entry points.',
      },
      {
        name: 'Kingambit',
        role: 'win condition',
        reason: 'Rotom-Wash can pivot and soften targets for Kingambit to finish.',
      },
      {
        name: 'Corviknight',
        role: 'defensive backbone',
        reason: 'Creates a sturdy defensive core against physical attackers.',
      },
    ],
    notes: ['Often used with Voltswitch and Will-O-Wisp to cripple physical threats.', 'Synergizes with hazard support and pivot-heavy teams.'],
  },
  {
    name: 'gyarados',
    format: 'OU',
    roles: ['physical attacker', 'setup sweeper', 'coverage pivot'],
    summary: 'Gyarados gives strong coverage, Intimidate utility and can sweep with setup boosts.',
    commonChecks: ['electric types', 'faster special attackers', 'rock moves'],
    recommendedPartners: [
      {
        name: 'Pikachu',
        role: 'fast coverage',
        reason: 'Fast Electric-types and VoltTurn cores complement Gyarados by pressuring Grounds and Waters.',
      },
      {
        name: 'Corviknight',
        role: 'defensive pivot',
        reason: 'Provides switch-ins to Rock and Dragon coverage that threaten Gyarados.',
      },
    ],
    notes: ['Commonly runs Dragon Dance for sweep potential; Intimidate support is critical.'],
  },
  {
    name: 'heatran',
    format: 'OU',
    roles: ['special wall', 'steel coverage', 'hazard setter'],
    summary: 'Heatran is a versatile special wall and hazard setter that pressures Fairy and Steel matchups.',
    commonChecks: ['water types', 'ground and fighting coverage', 'status effects'],
    recommendedPartners: [
      {
        name: 'Great Tusk',
        role: 'physical removal/support',
        reason: 'Balances Heatran’s weaknesses and helps chip bulky teams.',
      },
      {
        name: 'Gholdengo',
        role: 'special pressure',
        reason: 'Combines special pressure with hazard protection to control the board.',
      },
    ],
    notes: ['Enjoys cores that can check Water and Ground threats; magma-based sets provide offensive leverage.'],
  },
];

const moveNotes: MoveNote[] = [
  {
    name: 'blizzard',
    summary: 'High-power Ice move with wide coverage but imperfect accuracy outside snow.',
    notes: ['Strong into Dragon, Flying, Grass, and Ground targets.', 'Accuracy is the main limitation.'],
  },
  {
    name: 'ice beam',
    summary: 'Reliable Ice coverage with less raw power than Blizzard.',
    notes: ['Common on special attackers that need consistency over burst damage.'],
  },
  {
    name: 'earthquake',
    summary: 'Staple physical Ground move with strong neutral coverage.',
    notes: ['Excellent into Steel, Fire, Electric, Poison, and Rock targets.'],
  },
  {
    name: 'draco meteor',
    summary: 'Very strong Dragon nuke that usually trades Special Attack for damage.',
    notes: ['Best used when you only need one major hit before pivoting out.'],
  },
  {
    name: 'shadow ball',
    summary: 'Reliable Ghost coverage for special attackers.',
    notes: ['Good into Psychic and Ghost targets, with generally stable damage.'],
  },
  {
    name: 'flamethrower',
    summary: 'Consistent Fire coverage for special sets.',
    notes: ['Useful against Steel, Grass, Bug, and Ice targets.'],
  },
  {
    name: 'hydro pump',
    summary: 'High-damage Water move with accuracy risk.',
    notes: ['Best when you need a stronger burst than Surf provides.'],
  },
  {
    name: 'surf',
    summary: 'Reliable Water move with solid consistency.',
    notes: ['Preferred when accuracy matters more than raw damage.'],
  },
  {
    name: 'thunderbolt',
    summary: 'Reliable Electric coverage with good neutral reach.',
    notes: ['Common special coverage against Water and Flying targets.'],
  },
  {
    name: 'close combat',
    summary: 'Very strong physical Fighting move that lowers defenses after use.',
    notes: ['Often used as a breaker tool rather than a long-term spammable move.'],
  },
];

const profileByKey = new Map(competitiveProfiles.map((profile) => [normalizeKey(profile.name), profile]));
const moveByKey = new Map(moveNotes.map((move) => [normalizeKey(move.name), move]));

export function getCompetitiveProfile(name: string): CompetitiveProfile | undefined {
  return profileByKey.get(normalizeKey(name));
}

export function getMoveNote(name: string): MoveNote | undefined {
  return moveByKey.get(normalizeKey(name));
}
