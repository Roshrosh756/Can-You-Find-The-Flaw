// ======================== MAIN.JS – CTF CLIENT (Part 1-4, no auth/leaderboard/prize) ========================
let solvedStages = [];      // e.g. [1, 3]
let capturedFlags = {};     // e.g. { "1": "flag{...}", "3": "flag{...}" }
let celebrationInProgress = false;

const TOTAL_PARTS = 3;

// ----- Toast -----
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.style.background = 'rgba(0,0,0,0.85)';
  toast.style.backdropFilter = 'blur(12px)';
  toast.style.borderLeft = `4px solid ${type === 'success' ? '#28c840' : '#e55a1c'}`;
  toast.style.padding = '10px 18px';
  toast.style.borderRadius = '12px';
  toast.style.fontFamily = "'JetBrains Mono', monospace";
  toast.style.fontSize = '0.75rem';
  toast.style.color = '#eee';
  toast.style.marginBottom = '8px';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '10px';
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = '0.2s';
    setTimeout(() => toast.remove(), 300);
  }, 3800);
}

// ================================================================
// SOUND (kept lightweight, no speech synthesis / callsign narration)
// ================================================================

function playFlagSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [200, 180, 160, 140];
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = freq;
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.08 + 0.2);
      osc.start(audioCtx.currentTime + i * 0.08);
      osc.stop(audioCtx.currentTime + i * 0.08 + 0.2);
    });
  } catch (e) {}
}

function playVictorySound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [110, 130, 155, 185, 220, 260];
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = freq;
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.12 + 0.3);
      osc.start(audioCtx.currentTime + i * 0.12);
      osc.stop(audioCtx.currentTime + i * 0.12 + 0.3);
    });
  } catch (e) {}
}

// ================================================================
// PART-COMPLETE CELEBRATION (small toast + confetti, flag persists in header — not just this)
// ================================================================

function showPartCelebration(partNum) {
  const emojis = ['🔓', '🛡️', '💎'];
  const titles = ['PART 1 COMPLETE!', 'PART 2 COMPLETE!', 'PART 3 COMPLETE!'];
  playFlagSound();
  showToast(`${emojis[partNum - 1]} ${titles[partNum - 1]} Flag saved to your header.`, 'success');
}

function showFullCompletionBanner() {
  if (celebrationInProgress) return;
  celebrationInProgress = true;
  playVictorySound();
  const overlay = document.getElementById('achievementOverlay');

  const container = document.getElementById('confettiContainer');
  if (container) {
    container.innerHTML = '';
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#1dd1a1'];
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.top = '-20px';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.width = (Math.random() * 10 + 4) + 'px';
      confetti.style.height = (Math.random() * 10 + 4) + 'px';
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
      confetti.style.animationDelay = (Math.random() * 2) + 's';
      container.appendChild(confetti);
    }
  }
  if (overlay) overlay.classList.add('show');
  celebrationInProgress = false;
}

document.getElementById('achievementBtn')?.addEventListener('click', function () {
  document.getElementById('achievementOverlay').classList.remove('show');
});

// ================================================================
// SESSION / PROGRESS
// ================================================================

async function checkSolved() {
  try {
    const res = await fetch('/api/check_solved', { credentials: 'include' });
    const data = await res.json();
    const prevSolved = [...solvedStages];
    solvedStages = data.solved || [];
    renderStages();
    updateProgress();

    const newParts = solvedStages.filter(s => !prevSolved.includes(s));
    newParts.forEach(part => showPartCelebration(part));

    if (solvedStages.length === TOTAL_PARTS && prevSolved.length < TOTAL_PARTS) {
      showFullCompletionBanner();
    }
  } catch (err) {
    console.error('Check solved failed', err);
  }
}

// ================================================================
// CAPTURED FLAGS HEADER WIDGET
// ================================================================

async function refreshFlagsWidget() {
  try {
    const res = await fetch('/api/flags', { credentials: 'include' });
    const data = await res.json();
    const prevCount = solvedStages.length;
    solvedStages = data.solved || [];
    capturedFlags = data.flags || {};
    renderFlagsWidget();
    if (solvedStages.length > prevCount) {
      const btn = document.getElementById('flagsBtn');
      if (btn) {
        btn.classList.remove('flash');
        void btn.offsetWidth; // restart animation
        btn.classList.add('flash');
      }
    }
  } catch (err) {
    console.error('Flags fetch failed', err);
  }
}

function renderFlagsWidget() {
  const countEl = document.getElementById('flagsCount');
  const listEl = document.getElementById('flagsList');
  if (countEl) countEl.textContent = `${solvedStages.length}/${TOTAL_PARTS}`;
  if (!listEl) return;

  const parts = Object.keys(capturedFlags).sort((a, b) => a - b);
  if (parts.length === 0) {
    listEl.innerHTML = '<div class="flags-empty">No flags captured yet</div>';
    return;
  }
  listEl.innerHTML = parts.map(p => `
    <div class="flag-item">
      <div class="flag-item-top">
        <span class="flag-item-part">PART ${p}</span>
        <button class="flag-item-copy" type="button" data-part="${p}">COPY</button>
      </div>
      <code class="flag-item-value">${escapeHtml(capturedFlags[p])}</code>
    </div>
  `).join('');

  listEl.querySelectorAll('.flag-item-copy').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      copyFlag(this.dataset.part, this);
    });
  });
}

function copyFlag(part, btnEl) {
  const flag = capturedFlags[part];
  if (!flag) return;

  const onCopied = () => {
    showToast(`Part ${part} flag copied`, 'success');
    if (btnEl) {
      const original = btnEl.textContent;
      btnEl.textContent = 'COPIED';
      setTimeout(() => { btnEl.textContent = original; }, 1500);
    }
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(flag).then(onCopied).catch(() => fallbackCopy(flag, onCopied));
  } else {
    fallbackCopy(flag, onCopied);
  }
}

function fallbackCopy(text, onDone) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    if (onDone) onDone();
  } catch (e) {
    showToast('Copy failed — select the flag manually', 'error');
  }
  document.body.removeChild(ta);
}

document.addEventListener('click', function (e) {
  const widget = document.getElementById('flagsWidget');
  const dropdown = document.getElementById('flagsDropdown');
  const btn = document.getElementById('flagsBtn');
  if (!widget || !dropdown || !btn) return;
  if (btn.contains(e.target)) {
    dropdown.classList.toggle('show');
    btn.classList.toggle('open', dropdown.classList.contains('show'));
  } else if (!dropdown.contains(e.target)) {
    dropdown.classList.remove('show');
    btn.classList.remove('open');
  }
});

// ================================================================
// PARTS
// ================================================================

function renderStages() {
  const container = document.getElementById('stages');
  if (!container) return;
  container.innerHTML = '';
  const currentSolved = solvedStages || [];
  for (let i = 1; i <= TOTAL_PARTS; i++) {
    let unlocked = false;
    if (i === 1) unlocked = true;
    else if (currentSolved.includes(i - 1)) unlocked = true;
    container.appendChild(createStageCard(i, unlocked, currentSolved.includes(i)));
  }
}

function createStageCard(stage, unlocked, solved) {
  const div = document.createElement('div');
  div.className = `stage-card ${unlocked ? '' : 'locked'}`;
  if (!unlocked) div.style.opacity = '0.5';
  div.id = `stage${stage}`;

  const titles = {
    1: 'PART 1 · Forgot Password (Rate Limit Bypass)',
    2: 'PART 2 · Profile Viewer (Cache Poisoning)',
    3: 'PART 3 · Product ID (Union SQLi)'
  };
  const descriptions = {
    1: '<code>POST /api/stage1/forgot</code> – answer the security question.<br>You have 3 attempts per IP. Can you bypass the limit?<br><code>GET /api/internal/notes</code> – hidden endpoint with <code>X-Admin: true</code>',
    2: '<code>GET /api/stage2/profile</code> – poison the cache with <code>X-Original-URL: /admin/flag</code>, then visit normally to retrieve the flag.',
    3: '<code>GET /api/stage3/product?id=1</code> – SQL injection in the id parameter.<br>This is a PostgreSQL database. Use UNION SELECT to explore <code>information_schema.tables</code>, then extract the flag from the <code>flag_table</code>.'
  };
  const defaultMethods = { 1: 'POST', 2: 'GET', 3: 'GET' };
  const defaultUrls = {
    1: '/api/stage1/forgot',
    2: '/api/stage2/profile',
    3: '/api/stage3/product?id=1'
  };
  const defaultHeaders = {
    1: '{"Content-Type": "application/json"}',
    2: '{"Content-Type": "application/json", "X-Original-URL": "/admin/flag"}',
    3: '{"Content-Type": "application/json"}'
  };
  const defaultBodies = {
    1: '{"answer": ""}',
    2: '{}',
    3: '{}'
  };

  div.innerHTML = `
    <div class="stage-header">
      <span>${titles[stage]}</span>
      ${solved ? '<span class="status-solved">✔ SOLVED</span>' : (unlocked ? '<span class="status-active">ACTIVE</span>' : '<span class="status-locked">LOCKED</span>')}
    </div>
    <div class="stage-body">
      <p>${descriptions[stage]}</p>
      <div class="request-builder">
        <div class="rb-row">
          <select id="method${stage}">
            <option>${defaultMethods[stage]}</option>
            ${defaultMethods[stage] !== 'GET' ? '<option>GET</option>' : ''}${defaultMethods[stage] !== 'POST' ? '<option>POST</option>' : ''}
          </select>
          <input type="text" id="url${stage}" value="${defaultUrls[stage]}" size="50">
        </div>
        <label class="rb-label">Headers (JSON)</label>
        <textarea id="headers${stage}" rows="2">${defaultHeaders[stage]}</textarea>
        <label class="rb-label">Body (JSON or file data)</label>
        <textarea id="body${stage}" rows="3">${defaultBodies[stage]}</textarea>
        <div class="rb-actions">
          <button class="btn btn-primary" onclick="sendRequest(${stage})">SEND REQUEST</button>
          <button class="btn btn-secondary" onclick="getHint(${stage})">HINT</button>
        </div>
      </div>
      <div class="response-terminal">
        <div class="rt-header"><div class="rt-dot"></div><div class="rt-dot"></div><div class="rt-dot"></div><span class="rt-title">RESPONSE</span></div>
        <div class="rt-body" id="response${stage}"><span class="placeholder">// awaiting request...</span></div>
      </div>
      <div class="hint-box" id="hint${stage}" style="display:none;"></div>
      <div class="flag-submit-row">
        <input type="text" id="flagInput${stage}" placeholder="Paste the flag you found, e.g. flag{...}" ${solved ? 'disabled' : ''}>
        <button class="btn btn-primary" onclick="submitFlag(${stage})" ${solved ? 'disabled' : ''}>${solved ? 'SUBMITTED' : 'SUBMIT FLAG'}</button>
      </div>
      <div class="submit-response" id="submitResponse${stage}"></div>
    </div>
  `;
  return div;
}

window.sendRequest = async function (stage) {
  const method = document.getElementById(`method${stage}`).value;
  let url = document.getElementById(`url${stage}`).value;
  if (!url.startsWith('/')) url = '/' + url;
  const headersText = document.getElementById(`headers${stage}`).value;
  let bodyText = document.getElementById(`body${stage}`).value;
  let headers = {};
  try {
    headers = JSON.parse(headersText);
  } catch (e) {
    document.getElementById(`response${stage}`).innerHTML = `<span class="err">Invalid headers JSON</span>`;
    return;
  }

  let fetchOptions = { method, headers, credentials: 'include' };
  if (method !== 'GET' && bodyText.trim()) fetchOptions.body = bodyText;

  try {
    const res = await fetch(url, fetchOptions);
    const data = await res.json();
    const respEl = document.getElementById(`response${stage}`);
    respEl.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;

    if (data.flag) {
      showToast(`🚩 Flag revealed for Part ${stage}. Paste it below to submit.`, 'success');
      const flagInput = document.getElementById(`flagInput${stage}`);
      if (flagInput && !flagInput.disabled) flagInput.value = data.flag;
    }
  } catch (err) {
    document.getElementById(`response${stage}`).innerHTML = `<span class="err">Error: ${err.message}</span>`;
  }
};

window.submitFlag = async function (stage) {
  const input = document.getElementById(`flagInput${stage}`);
  const responseEl = document.getElementById(`submitResponse${stage}`);
  const flag = input ? input.value.trim() : '';
  if (!flag) {
    if (responseEl) {
      responseEl.textContent = 'Enter a flag first.';
      responseEl.className = 'submit-response err';
    }
    return;
  }
  try {
    const res = await fetch(`/api/submit/${stage}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ flag })
    });
    const data = await res.json();
    if (data.solved) {
      if (responseEl) {
        responseEl.textContent = `✅ Part ${stage} solved!`;
        responseEl.className = 'submit-response ok';
      }
      await checkSolved();
      await refreshFlagsWidget();
    } else {
      if (responseEl) {
        responseEl.textContent = `❌ ${data.error || 'Incorrect flag'}`;
        responseEl.className = 'submit-response err';
      }
    }
  } catch (err) {
    if (responseEl) {
      responseEl.textContent = `❌ Error: ${err.message}`;
      responseEl.className = 'submit-response err';
    }
  }
};

window.getHint = async function (stage) {
  try {
    const res = await fetch(`/api/hint/${stage}`, { credentials: 'include' });
    const data = await res.json();
    const hintDiv = document.getElementById(`hint${stage}`);
    hintDiv.innerHTML = `<strong>Hint:</strong> ${data.hint}`;
    hintDiv.style.display = 'block';
  } catch (err) {
    showToast('Hint not available', 'error');
  }
};

// ======================== MISC HELPERS ========================

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function updateProgress() {
  const solved = solvedStages || [];
  const pct = Math.round((solved.length / TOTAL_PARTS) * 100);
  const pctEl = document.getElementById('ps-pct');
  if (pctEl) pctEl.textContent = pct + '%';

  for (let i = 0; i < TOTAL_PARTS; i++) {
    const node = document.getElementById('ps-node-' + i);
    const line = document.getElementById('ps-line-' + i);
    if (!node) continue;
    node.classList.remove('active', 'done');
    const stageNum = i + 1;
    if (solved.includes(stageNum)) {
      node.classList.add('done');
      const numEl = node.querySelector('.ps-num');
      if (numEl) {
        numEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      }
      if (line && i < TOTAL_PARTS - 1) line.classList.add('done');
    } else if (solved.length === i || (i === 0 && solved.length === 0)) {
      node.classList.add('active');
      if (line) line.classList.remove('done');
    } else {
      if (line) line.classList.remove('done');
    }
  }

  if (solved.length === TOTAL_PARTS) {
    for (let i = 0; i < TOTAL_PARTS - 1; i++) {
      const line = document.getElementById('ps-line-' + i);
      if (line) line.classList.add('done');
    }
  }
}

function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('ctf_theme', t);
  const sun = document.getElementById('icon-sun');
  const moon = document.getElementById('icon-moon');
  if (sun && moon) {
    sun.style.display = t === 'dark' ? 'block' : 'none';
    moon.style.display = t === 'light' ? 'block' : 'none';
  }
}
function getTheme() { return localStorage.getItem('ctf_theme') || 'dark'; }

// ================================================================
// DOM READY — no auth gate, game is visible immediately
// ================================================================

async function initApp() {
  await checkSolved();
  await refreshFlagsWidget();
}

document.addEventListener('DOMContentLoaded', function () {
  const themeBtn = document.getElementById('theme-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });
  }
  setTheme(getTheme());

  const logoLink = document.querySelector('.logo');
  if (logoLink) {
    logoLink.addEventListener('click', function (e) {
      e.preventDefault();
      const hero = document.getElementById('hero');
      if (hero) hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    logoLink.style.cursor = 'pointer';
  }

  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', function (e) {
      e.preventDefault();
      const section = document.getElementById('parts-section');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  for (let i = 0; i < TOTAL_PARTS; i++) {
    const node = document.getElementById('ps-node-' + i);
    if (node) {
      node.addEventListener('click', function () {
        const section = document.getElementById('parts-section');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  document.querySelectorAll('.header-nav-inner .nav-link').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const target = this.getAttribute('href');
      if (target && target.startsWith('#')) {
        const section = document.querySelector(target);
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  initApp();
});

window.addEventListener('scroll', function () {
  const header = document.querySelector('.game-header-inner');
  if (header) {
    if (window.scrollY > 10) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
});
