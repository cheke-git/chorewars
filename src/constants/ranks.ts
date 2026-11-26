export interface RankDefinition {
  id: string;
  title: string;
  minXp: number;
  /**
   * Visual portrait tier (`t1`, `t2`, `t3`, ...). Multiple ranks can share
   * an artTier so weekly rank-ups stay frequent without needing 50 portraits.
   */
  artTier: number;
  frameColor: string;
  stars: number;
}

export interface RankInfo {
  id: string;
  title: string;
  minXp: number;
  artTier: number;
  frameColor: string;
  stars: number;
  prestigeLevel: number;
  nextTitle: string | null;
  nextXp: number | null;
  progress: number;
}

/**
 * Insert new ranks anywhere in this array (sorted by minXp) with zero DB migrations.
 * Player ranks are always computed dynamically from `profiles.xpTotal`.
 */
export const RANK_LADDER: RankDefinition[] = [
  // Art Tier 1 — Everyday Recruit
  { id: 'recruit', title: 'Recruit', minXp: 0, artTier: 1, frameColor: '#64748B', stars: 0 },
  { id: 'sponge-squire', title: 'Sponge Squire', minXp: 25, artTier: 1, frameColor: '#38BDF8', stars: 1 },
  { id: 'bubble-scout', title: 'Bubble Scout', minXp: 60, artTier: 1, frameColor: '#22C55E', stars: 2 },
  { id: 'broom-corporal', title: 'Broom Corporal', minXp: 110, artTier: 1, frameColor: '#10B981', stars: 3 },

  // Art Tier 2 — Upgraded Captain (Promotion 1)
  { id: 'foam-sergeant', title: 'Foam Sergeant', minXp: 175, artTier: 2, frameColor: '#A855F7', stars: 1 },
  { id: 'dish-knight', title: 'Dish Knight', minXp: 260, artTier: 2, frameColor: '#EC4899', stars: 2 },
  { id: 'kitchen-captain', title: 'Kitchen Captain', minXp: 375, artTier: 2, frameColor: '#F59E0B', stars: 3 },
  { id: 'suds-paladin', title: 'Suds Paladin', minXp: 525, artTier: 2, frameColor: '#FF5A00', stars: 4 },

  // Art Tier 3 — Golden Legend (Promotion 2; ready for t4+ anytime)
  { id: 'fort-commander', title: 'Fort Commander', minXp: 750, artTier: 3, frameColor: '#FF5A00', stars: 1 },
  { id: 'sparkle-general', title: 'Sparkle General', minXp: 1100, artTier: 3, frameColor: '#FACC15', stars: 2 },
  { id: 'grand-marshal', title: 'Grand Marshal of Clean', minXp: 1600, artTier: 3, frameColor: '#FDE047', stars: 3 },
  { id: 'fort-legend', title: 'Fort Legend', minXp: 2500, artTier: 3, frameColor: '#FDE047', stars: 4 },
  { id: 'tidy-titan', title: 'Supreme Titan of Tidy', minXp: 5000, artTier: 3, frameColor: '#38BDF8', stars: 5 },
  {
    id: 'god-of-bubbles',
    title: 'Ultra Mega Hyper God of Bubbles',
    minXp: 50000,
    artTier: 3,
    frameColor: '#FF5A00',
    stars: 5,
  },
];

const SORTED_RANKS = [...RANK_LADDER].sort((a, b) => a.minXp - b.minXp);
const PRESTIGE_STEP_XP = 10000;

export function getRankInfo(xp: number): RankInfo {
  const safeXp = Math.max(0, xp);
  let currentIndex = 0;

  for (let i = 0; i < SORTED_RANKS.length; i += 1) {
    if (safeXp >= SORTED_RANKS[i].minXp) {
      currentIndex = i;
    }
  }

  const current = SORTED_RANKS[currentIndex];
  const next = SORTED_RANKS[currentIndex + 1] ?? null;

  if (!next) {
    const overflow = safeXp - current.minXp;
    const prestigeLevel = Math.floor(overflow / PRESTIGE_STEP_XP);
    const nextPrestigeXp = current.minXp + (prestigeLevel + 1) * PRESTIGE_STEP_XP;
    const progress = (overflow % PRESTIGE_STEP_XP) / PRESTIGE_STEP_XP;

    return {
      id: current.id,
      title: prestigeLevel > 0 ? `${current.title} ★${prestigeLevel}` : current.title,
      minXp: current.minXp,
      artTier: current.artTier,
      frameColor: current.frameColor,
      stars: current.stars,
      prestigeLevel,
      nextTitle: `Prestige ★${prestigeLevel + 1}`,
      nextXp: nextPrestigeXp,
      progress,
    };
  }

  const span = Math.max(1, next.minXp - current.minXp);
  const progress = Math.max(0, Math.min(1, (safeXp - current.minXp) / span));

  return {
    id: current.id,
    title: current.title,
    minXp: current.minXp,
    artTier: current.artTier,
    frameColor: current.frameColor,
    stars: current.stars,
    prestigeLevel: 0,
    nextTitle: next.title,
    nextXp: next.minXp,
    progress,
  };
}
