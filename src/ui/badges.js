// badges.js — the badges next to someone's name. Most people have one at
// most; the owner chooses which of theirs to wear.

import { verifiedBadge } from './icons.js';
import { ownerWear } from '../services/site.js';

/** One badge, or for the owner the set they chose (filled in once loaded). */
export function nameBadges(kind) {
  if (kind !== 'owner') return kind ? verifiedBadge(null, kind) : null;
  const box = document.createElement('span');
  box.className = 'badge-set';
  box.append(verifiedBadge(null, 'owner'));
  ownerWear().then((list) => box.replaceChildren(...list.map((k) => verifiedBadge(null, k)))).catch(() => {});
  return box;
}
