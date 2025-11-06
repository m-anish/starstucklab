// public/scripts/mood.js
// Minimal helpers for mood persistence & level mapping

const MOOD_KEY = 'starstucklab.moodLevel';

export function saveMoodLevel(level) {
  try {
    localStorage.setItem(MOOD_KEY, String(level));
  } catch (e) {
    // fallback to cookie (7 days)
    document.cookie = `moodLevel=${level}; path=/; max-age=${60*60*24*7}`;
  }
}

export function loadMoodLevel() {
  try {
    const v = localStorage.getItem(MOOD_KEY);
    if (v !== null) return Number(v);
  } catch (e) {}
  // cookie fallback
  const m = document.cookie.match(/\bmoodLevel=(\d+)/);
  if (m) return Number(m[1]);
  return 2; // default mid-level (1..4)
}

// Convert slider 0..100 -> level 1..4
export function sliderToLevel(value) {
  value = Number(value);
  return Math.min(4, Math.max(1, Math.ceil((value+1) / 25)));
}
