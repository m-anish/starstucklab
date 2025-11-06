// public/scripts/render-generated.js

async function fetchJson(path) {
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// selector is e.g. '#about-intro' (an empty element in the page)
export async function attachGenerated(selector, dataPath) {
  const container = document.querySelector(selector);
  if (!container) return;

  // initial fetch
  let data;
  try {
    data = await fetchJson(dataPath);
  } catch (e) {
    container.textContent = 'We attempted poetry but got static instead.';
    console.error('Failed to fetch generated content:', e);
    return;
  }

  function showForLevel(level) {
    const list = data[`level${level}`] || [];
    if (!list.length) {
      container.textContent = '';
      return;
    }
    const pick = list[Math.floor(Math.random() * list.length)];
    container.textContent = pick;
  }

  // Listen to mood changes
  window.addEventListener('mood:change', (ev) => {
    showForLevel(ev.detail.level);
  });

  // initial
  // find current mood via the same method or rely on event fired at load
  // fallback: 2
  showForLevel(2);
}
