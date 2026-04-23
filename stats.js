// stats.js — fetches live GitHub data for joeyc1pro
// Uses the public GitHub API (no login needed, 60 requests/hour per IP)

const GITHUB_USER = 'joeyc1pro';

async function loadGitHubStats() {
  try {
    // ── 1. Fetch user profile (repos, followers) ──
    const userRes = await fetch(`https://api.github.com/users/${GITHUB_USER}`);
    if (!userRes.ok) throw new Error('GitHub API error: ' + userRes.status);
    const user = await userRes.json();

    const repoCount   = user.public_repos  || 0;
    const followers   = user.followers     || 0;

    // ── 2. Fetch all repos to count total stars ──
    // GitHub paginates at 100 per page — loop through all pages
    let page = 1;
    let totalStars = 0;
    let repos = [];

    while (true) {
      const repoRes = await fetch(
        `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&page=${page}`
      );
      if (!repoRes.ok) break;
      const batch = await repoRes.json();
      if (!batch.length) break;

      batch.forEach(r => { totalStars += r.stargazers_count || 0; });
      repos = repos.concat(batch);
      if (batch.length < 100) break;
      page++;
    }

    // ── 3. Update stat boxes ──
    setStatAndAnimate('stat-repos',     repoCount);
    setStatAndAnimate('stat-stars',     totalStars);
    setStatAndAnimate('stat-followers', followers);
    // stat-live stays at 4 (hardcoded — you know which sites are live)
    setStatAndAnimate('stat-live', 4);

    // ── 4. Update the contributions text ──
    // GitHub's contribution graph isn't in the public REST API,
    // so we show a smart message using repo count as a proxy
    const contribEl = document.getElementById('contrib-text');
    if (contribEl) {
      contribEl.textContent =
        `${repoCount} public repos and ${totalStars} total stars across all my projects, and still going!`;
    }

  } catch (err) {
    // If the API fails (rate limit, network issue, etc.) fall back to saved values
    console.warn('GitHub stats fetch failed, using fallback:', err.message);

    setStatFallback('stat-repos',     23);
    setStatFallback('stat-stars',      9);
    setStatFallback('stat-followers',  1);
    setStatFallback('stat-live',       4);

    const contribEl = document.getElementById('contrib-text');
    if (contribEl) {
      contribEl.textContent = '164 contributions in the last year and still going!';
    }
  }
}

// Animate a stat box counting up to a new value
function setStatAndAnimate(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.dataset.target = value;
  el.textContent = '0';

  const dur = 1300;
  const t0  = performance.now();
  (function tick(now) {
    const p    = Math.min((now - t0) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(ease * value);
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

// Set a fallback value instantly (no animation, used on error)
function setStatFallback(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.dataset.target = value;
  el.textContent    = value;
}

// Run on page load
loadGitHubStats();
