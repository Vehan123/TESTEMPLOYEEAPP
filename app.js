/**
 * Pomodoro Timer – Application Logic
 *
 * Pattern A: Enhanced Visual Feedback
 *   - Circular SVG progress ring with smooth animation
 *   - Blue→Yellow→Red color gradient based on elapsed ratio
 *   - Canvas particle effects & ripple rings during focus time
 *
 * Pattern B: Improved Customizability
 *   - Selectable durations: 15 / 25 / 35 / 45 minutes
 *   - Theme switching: Dark / Light / Focus
 *   - Sound toggles: Start, End, Tick
 *
 * Pattern C: Gamification Elements
 *   - XP system: earn XP per completed Pomodoro, level up
 *   - Achievement badges with unlock logic
 *   - Weekly bar chart & monthly activity grid
 */

'use strict';

/* ============================================================
   Constants & Config
   ============================================================ */
const CIRCUMFERENCE = 2 * Math.PI * 95; // ≈ 596.9 px

const BREAK_SHORT = 5;   // minutes
const BREAK_LONG  = 15;  // minutes
const SESSIONS_BEFORE_LONG_BREAK = 4;

const XP_PER_POMODORO   = 50;
const XP_PER_LEVEL      = 100;
const MS_PER_DAY        = 86_400_000;
const MONTHLY_GRID_DAYS = 35;

const ACHIEVEMENTS = [
  { id: 'first',       icon: '🎯', name: 'First Step',    desc: 'Complete your first Pomodoro',        condition: s => s.total >= 1 },
  { id: 'five',        icon: '🔥', name: 'On Fire',       desc: 'Complete 5 Pomodoros',                condition: s => s.total >= 5 },
  { id: 'ten',         icon: '💪', name: 'Dedicated',     desc: 'Complete 10 Pomodoros',               condition: s => s.total >= 10 },
  { id: 'fifty',       icon: '🏅', name: 'Century Run',   desc: 'Complete 50 Pomodoros',               condition: s => s.total >= 50 },
  { id: 'streak3',     icon: '📅', name: '3-Day Streak',  desc: '3 consecutive active days',           condition: s => s.streak >= 3 },
  { id: 'streak7',     icon: '🗓️', name: 'Week Warrior',  desc: '7 consecutive active days',           condition: s => s.streak >= 7 },
  { id: 'week10',      icon: '⚡', name: 'Power Week',    desc: '10 Pomodoros in one week',            condition: s => s.thisWeek >= 10 },
  { id: 'level5',      icon: '⭐', name: 'Rising Star',   desc: 'Reach Level 5',                      condition: s => s.level >= 5 },
  { id: 'level10',     icon: '🌟', name: 'Master Mind',   desc: 'Reach Level 10',                     condition: s => s.level >= 10 },
];

/* ============================================================
   State
   ============================================================ */
let state = loadState();

function defaultState() {
  return {
    theme:        'dark',
    duration:     25,
    soundStart:   true,
    soundEnd:     true,
    soundTick:    false,
    xp:           0,
    level:        1,
    total:        0,
    todayDate:    todayStr(),
    todayCount:   0,
    streak:       0,
    lastActiveDate: null,
    weekData:     Array(7).fill(0),   // [Mon … Sun] count of current week
    monthData:    {},                 // { 'YYYY-MM-DD': count }
    achievements: [],                 // array of unlocked achievement ids
    sessions:     0,                  // completed sessions in current cycle
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem('pomodoroState');
    if (raw) {
      const parsed = JSON.parse(raw);
      // merge with defaults to handle new keys added in updates
      return Object.assign(defaultState(), parsed);
    }
  } catch (_) { /* ignore */ }
  return defaultState();
}

function saveState() {
  try {
    localStorage.setItem('pomodoroState', JSON.stringify(state));
  } catch (_) { /* ignore */ }
}

/* ============================================================
   Timer State
   ============================================================ */
let timerInterval = null;
let isRunning     = false;
let isBreak       = false;
let totalSeconds  = state.duration * 60;
let remaining     = totalSeconds;

/* ============================================================
   DOM References
   ============================================================ */
const timeDisplay    = document.getElementById('timeDisplay');
const sessionLabel   = document.getElementById('sessionLabel');
const sessionCount   = document.getElementById('sessionCount');
const ringProgress   = document.querySelector('.ring-progress');
const progressRing   = document.querySelector('.progress-ring');
const timerContainer = document.querySelector('.timer-container');
const startBtn       = document.getElementById('startBtn');
const resetBtn       = document.getElementById('resetBtn');
const skipBtn        = document.getElementById('skipBtn');
const xpBarFill      = document.getElementById('xpBarFill');
const xpText         = document.getElementById('xpText');
const levelNum       = document.getElementById('levelNum');
const levelBadge     = document.getElementById('levelBadge');
const toastContainer = document.getElementById('toastContainer');
const bgCanvas       = document.getElementById('bgCanvas');
const themeBtn       = document.getElementById('themeBtn');
const soundBtn       = document.getElementById('soundBtn');
const statsBtn       = document.getElementById('statsBtn');
const soundPanel     = document.getElementById('soundPanel');
const themePanel     = document.getElementById('themePanel');
const statsPanel     = document.getElementById('statsPanel');

/* ============================================================
   Pattern A – Circular Progress Ring
   ============================================================ */
function updateRing() {
  const ratio    = remaining / totalSeconds;  // 1 → 0 as time elapses
  const elapsed  = 1 - ratio;
  const offset   = CIRCUMFERENCE * ratio;
  ringProgress.style.strokeDashoffset = offset;

  // Color phase
  let phase;
  if (elapsed < 0.5) {
    phase = 'blue';
  } else if (elapsed < 0.8) {
    phase = 'yellow';
  } else {
    phase = 'red';
  }
  document.body.dataset.phase = phase;
}

/* ============================================================
   Pattern A – Ripple Rings
   ============================================================ */
let rippleRings = [];

function addRippleRings() {
  removeRippleRings();
  for (let i = 0; i < 3; i++) {
    const ring = document.createElement('div');
    ring.className = 'ripple-ring';
    timerContainer.appendChild(ring);
    rippleRings.push(ring);
  }
}

function removeRippleRings() {
  rippleRings.forEach(r => r.remove());
  rippleRings = [];
}

/* ============================================================
   Pattern A – Canvas Particle System
   ============================================================ */

/** Convert a 0–1 alpha value to a two-digit hex string for use in colour literals. */
function toHexAlpha(alpha) {
  return Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0');
}

const ctx2d = bgCanvas.getContext('2d');
let particles = [];
let animFrameId = null;

function resizeCanvas() {
  bgCanvas.width  = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}

function spawnParticle() {
  const colors = { blue: '#42a5f5', yellow: '#ffd740', red: '#ff5252' };
  const phase  = document.body.dataset.phase || 'blue';
  particles.push({
    x:   Math.random() * bgCanvas.width,
    y:   bgCanvas.height + 10,
    r:   Math.random() * 3 + 1,
    vy:  -(Math.random() * 0.8 + 0.3),
    vx:  (Math.random() - 0.5) * 0.4,
    a:   0.7,
    da: -0.003,
    color: colors[phase] || '#42a5f5',
  });
}

function animateParticles() {
  ctx2d.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  if (Math.random() < 0.3) spawnParticle();
  particles = particles.filter(p => p.a > 0);
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.a += p.da;
    ctx2d.beginPath();
    ctx2d.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx2d.fillStyle = p.color + toHexAlpha(p.a);
    ctx2d.fill();
  });
  if (isRunning && !isBreak) {
    animFrameId = requestAnimationFrame(animateParticles);
  } else {
    ctx2d.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    bgCanvas.classList.remove('active');
  }
}

function startParticles() {
  resizeCanvas();
  bgCanvas.classList.add('active');
  if (animFrameId) cancelAnimationFrame(animFrameId);
  animateParticles();
}

function stopParticles() {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  animFrameId = null;
  particles   = [];
  ctx2d.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  bgCanvas.classList.remove('active');
}

window.addEventListener('resize', resizeCanvas);

/* ============================================================
   Pattern B – Sound Engine
   ============================================================ */
function createBeep(frequency, duration, type = 'sine') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ac   = new AudioCtx();
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ac.currentTime);
    gain.gain.setValueAtTime(0.3, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  } catch (_) { /* ignore */ }
}

function playStartSound() {
  if (!state.soundStart) return;
  createBeep(523, 0.15);
  setTimeout(() => createBeep(659, 0.15), 160);
  setTimeout(() => createBeep(784, 0.25), 320);
}

function playEndSound() {
  if (!state.soundEnd) return;
  createBeep(784, 0.2);
  setTimeout(() => createBeep(659, 0.2), 220);
  setTimeout(() => createBeep(523, 0.35), 440);
}

function playTickSound() {
  if (!state.soundTick) return;
  createBeep(1000, 0.04, 'square');
}

function playLevelUpSound() {
  createBeep(523, 0.1);
  setTimeout(() => createBeep(659, 0.1), 120);
  setTimeout(() => createBeep(784, 0.1), 240);
  setTimeout(() => createBeep(1046, 0.3), 360);
}

/* ============================================================
   Timer Logic
   ============================================================ */
function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function setDisplay() {
  timeDisplay.textContent   = formatTime(remaining);
  sessionLabel.textContent  = isBreak ? 'Break Time' : 'Focus Time';
  sessionCount.textContent  = `Session ${state.sessions + 1}`;
  updateRing();
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startBtn.textContent = '⏸ Pause';
  progressRing.classList.add('running');

  if (!isBreak) {
    playStartSound();
    addRippleRings();
    startParticles();
  }

  timerInterval = setInterval(() => {
    remaining--;
    playTickSound();
    setDisplay();

    if (remaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      onTimerEnd();
    }
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
  startBtn.textContent = '▶ Resume';
  progressRing.classList.remove('running');
  removeRippleRings();
  stopParticles();
}

function resetTimer() {
  pauseTimer();
  isBreak       = false;
  totalSeconds  = state.duration * 60;
  remaining     = totalSeconds;
  startBtn.textContent = '▶ Start';
  document.body.dataset.phase = 'blue';
  setDisplay();
}

function skipToBreak() {
  if (!isBreak) {
    // Treat as if session completed but without XP reward
    pauseTimer();
    startBreak();
  } else {
    endBreak();
  }
}

function onTimerEnd() {
  isRunning = false;
  progressRing.classList.remove('running');
  removeRippleRings();
  stopParticles();
  playEndSound();

  if (!isBreak) {
    // Completed a focus session
    awardPomodoro();
    startBreak();
  } else {
    // Break ended
    endBreak();
  }
}

function startBreak() {
  isBreak = true;
  state.sessions++;
  const isLong  = state.sessions % SESSIONS_BEFORE_LONG_BREAK === 0;
  totalSeconds  = (isLong ? BREAK_LONG : BREAK_SHORT) * 60;
  remaining     = totalSeconds;
  startBtn.textContent = '▶ Start Break';
  document.body.dataset.phase = 'blue';
  setDisplay();
  showToast(isLong ? '🌟 Long break time! (15 min)' : '☕ Short break time! (5 min)');
}

function endBreak() {
  isBreak      = false;
  totalSeconds = state.duration * 60;
  remaining    = totalSeconds;
  startBtn.textContent = '▶ Start';
  document.body.dataset.phase = 'blue';
  setDisplay();
  showToast('🎯 Focus session ready!');
}

/* ============================================================
   Pattern C – XP & Level System
   ============================================================ */
function awardPomodoro() {
  // Update counts
  state.total++;
  state.todayCount++;
  recordTodayActivity();
  updateStreak();
  addWeekData();

  // XP
  const prevLevel = state.level;
  state.xp += XP_PER_POMODORO;
  while (state.xp >= xpForLevel(state.level)) {
    state.xp -= xpForLevel(state.level);
    state.level++;
  }

  saveState();
  updateXpUI();

  if (state.level > prevLevel) {
    onLevelUp(state.level);
  }

  checkAchievements();
  updateStatsUI();
}

function xpForLevel(level) {
  // XP required increases with level
  return XP_PER_LEVEL + (level - 1) * 20;
}

function updateXpUI() {
  const needed = xpForLevel(state.level);
  xpBarFill.style.width = `${Math.min(100, (state.xp / needed) * 100)}%`;
  xpText.textContent    = `${state.xp} / ${needed} XP`;
  levelNum.textContent  = state.level;
}

function onLevelUp(level) {
  playLevelUpSound();
  levelBadge.classList.remove('animate');
  void levelBadge.offsetWidth; // reflow to restart
  levelBadge.classList.add('animate');
  showToast(`🎉 Level Up! You are now Level ${level}!`, 'success');
}

/* ============================================================
   Pattern C – Day Streak & Date Tracking
   ============================================================ */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function recordTodayActivity() {
  const today = todayStr();
  if (state.todayDate !== today) {
    state.todayDate  = today;
    state.todayCount = 1;
  }
  state.monthData[today] = (state.monthData[today] || 0) + 1;
}

function updateStreak() {
  const today     = todayStr();
  const yesterday = new Date(Date.now() - MS_PER_DAY).toISOString().slice(0, 10);

  if (state.lastActiveDate === today) {
    // already counted today
  } else if (state.lastActiveDate === yesterday) {
    state.streak++;
    state.lastActiveDate = today;
  } else {
    state.streak = 1;
    state.lastActiveDate = today;
  }
}

function addWeekData() {
  const day = new Date().getDay(); // 0=Sun … 6=Sat
  // Shift from JS Sunday-based (0=Sun) to Monday-based (0=Mon): (day + 6) % 7
  const idx = (day + 6) % 7;
  state.weekData[idx] = (state.weekData[idx] || 0) + 1;
  // Count this week total
  state.thisWeek = state.weekData.reduce((a, b) => a + b, 0);
}

/* ============================================================
   Pattern C – Achievement System
   ============================================================ */
function checkAchievements() {
  let newUnlocks = [];
  ACHIEVEMENTS.forEach(a => {
    if (!state.achievements.includes(a.id) && a.condition(state)) {
      state.achievements.push(a.id);
      newUnlocks.push(a);
    }
  });

  if (newUnlocks.length) {
    saveState();
    newUnlocks.forEach(a => {
      setTimeout(() => {
        showToast(`🏆 Achievement unlocked: ${a.name}`, 'success');
      }, 600);
    });
    renderAchievements();
  }
}

function renderAchievements() {
  const grid = document.getElementById('achievementsGrid');
  grid.innerHTML = '';
  ACHIEVEMENTS.forEach(a => {
    const unlocked = state.achievements.includes(a.id);
    const card = document.createElement('div');
    card.className = `achievement-card${unlocked ? ' unlocked' : ''}`;
    card.innerHTML = `
      <div class="ach-icon">${a.icon}</div>
      <div class="ach-name">${a.name}</div>
      <div class="ach-desc">${a.desc}</div>
      <span class="ach-badge">✓</span>
    `;
    grid.appendChild(card);
  });
}

/* ============================================================
   Statistics UI
   ============================================================ */
function updateStatsUI() {
  // Overview cards
  document.getElementById('statToday').textContent  = state.todayCount || 0;
  document.getElementById('statWeek').textContent   = (state.thisWeek || 0);
  document.getElementById('statTotal').textContent  = state.total;
  document.getElementById('statStreak').textContent = state.streak;

  renderWeeklyChart();
  renderMonthlyGrid();
  renderAchievements();
}

function renderWeeklyChart() {
  const chart = document.getElementById('weeklyChart');
  chart.innerHTML = '';
  const days    = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxVal  = Math.max(1, ...state.weekData);

  days.forEach((d, i) => {
    const count  = state.weekData[i] || 0;
    const pct    = (count / maxVal) * 100;
    const col    = document.createElement('div');
    col.className = 'bar-col';
    col.innerHTML = `
      <div class="bar-fill" style="height:${pct}%">
        ${count > 0 ? `<span class="bar-value">${count}</span>` : ''}
      </div>
      <div class="bar-label">${d}</div>
    `;
    chart.appendChild(col);
  });
}

function renderMonthlyGrid() {
  const grid = document.getElementById('monthlyGrid');
  grid.innerHTML = '';
  // Show last MONTHLY_GRID_DAYS days
  for (let i = MONTHLY_GRID_DAYS - 1; i >= 0; i--) {
    const d    = new Date(Date.now() - i * MS_PER_DAY).toISOString().slice(0, 10);
    const cnt  = state.monthData[d] || 0;
    const cell = document.createElement('div');
    cell.className  = 'month-cell';
    cell.title      = `${d}: ${cnt} pomodoro${cnt !== 1 ? 's' : ''}`;
    cell.dataset.count = Math.min(cnt, 5);
    grid.appendChild(cell);
  }
}

/* ============================================================
   Toast Notifications
   ============================================================ */
function showToast(message, type = '') {
  const toast = document.createElement('div');
  toast.className = `toast${type ? ' ' + type : ''}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3300);
}

/* ============================================================
   Panel Toggle Helpers
   ============================================================ */
function togglePanel(panel, btn) {
  const isVisible = panel.classList.contains('visible');
  // Close all panels
  [soundPanel, themePanel, statsPanel].forEach(p => p.classList.remove('visible'));
  [soundBtn, themeBtn, statsBtn].forEach(b => b.classList.remove('active'));
  // Re-open if it was closed
  if (!isVisible) {
    panel.classList.add('visible');
    btn.classList.add('active');
    if (panel === statsPanel) updateStatsUI();
  }
}

/* ============================================================
   Pattern B – Theme Switcher
   ============================================================ */
function applyTheme(theme) {
  document.body.className = `theme-${theme}`;
  document.body.dataset.phase = document.body.dataset.phase || 'blue';
  state.theme = theme;
  saveState();

  // Highlight active theme button
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

/* ============================================================
   Pattern B – Duration Selector
   ============================================================ */
function setDuration(minutes) {
  state.duration = minutes;
  saveState();
  document.querySelectorAll('.duration-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.minutes) === minutes);
  });
  if (!isRunning) {
    totalSeconds = minutes * 60;
    remaining    = totalSeconds;
    setDisplay();
  }
}

/* ============================================================
   Event Listeners
   ============================================================ */
startBtn.addEventListener('click', () => {
  if (isRunning) pauseTimer();
  else           startTimer();
});

resetBtn.addEventListener('click', () => {
  resetTimer();
});

skipBtn.addEventListener('click', () => {
  skipToBreak();
});

// Duration buttons
document.querySelectorAll('.duration-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setDuration(Number(btn.dataset.minutes));
    showToast(`⏱ Duration set to ${btn.dataset.minutes} minutes`);
  });
});

// Header icon buttons
soundBtn.addEventListener('click', () => togglePanel(soundPanel, soundBtn));
themeBtn.addEventListener('click', () => togglePanel(themePanel, themeBtn));
statsBtn.addEventListener('click', () => togglePanel(statsPanel, statsBtn));

// Sound toggles
document.getElementById('soundStart').addEventListener('change', e => {
  state.soundStart = e.target.checked;
  saveState();
});
document.getElementById('soundEnd').addEventListener('change', e => {
  state.soundEnd = e.target.checked;
  saveState();
});
document.getElementById('soundTick').addEventListener('change', e => {
  state.soundTick = e.target.checked;
  saveState();
});

// Theme options
document.querySelectorAll('.theme-option').forEach(btn => {
  btn.addEventListener('click', () => {
    applyTheme(btn.dataset.theme);
    showToast(`🎨 Theme: ${btn.textContent.trim()}`);
  });
});

/* ============================================================
   Initialization
   ============================================================ */
function init() {
  // Restore saved theme
  applyTheme(state.theme);

  // Restore saved duration
  setDuration(state.duration);

  // Restore sound toggle states
  document.getElementById('soundStart').checked = state.soundStart;
  document.getElementById('soundEnd').checked   = state.soundEnd;
  document.getElementById('soundTick').checked  = state.soundTick;

  // Set initial ring properties
  ringProgress.style.strokeDasharray  = CIRCUMFERENCE;
  ringProgress.style.strokeDashoffset = 0;
  document.body.dataset.phase = 'blue';

  // Display
  totalSeconds = state.duration * 60;
  remaining    = totalSeconds;
  setDisplay();

  // XP UI
  updateXpUI();

  // Stats (compute thisWeek)
  state.thisWeek = (state.weekData || Array(7).fill(0)).reduce((a, b) => a + b, 0);
}

init();
