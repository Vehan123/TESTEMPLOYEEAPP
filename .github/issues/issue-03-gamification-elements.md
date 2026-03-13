# Pattern C: Gamification Elements for Pomodoro Timer

## Summary

Add lightweight gamification mechanics — an experience point (XP) system, achievement badges, and detailed weekly/monthly statistics — to increase long-term engagement and give users a sense of measurable progress toward their productivity goals.

## Background

Habit-forming applications benefit enormously from positive reinforcement loops. By rewarding completed Pomodoros with XP, surfacing milestone badges, and visualising productivity trends over time, the timer transforms from a simple countdown into a personal productivity companion. The gamification layer must feel motivating, not intrusive — it should celebrate success without adding cognitive load during focus sessions.

## Feature Breakdown

### 1. Experience Point (XP) System

**XP earning rules:**

| Action | XP awarded |
|--------|-----------|
| Complete a work session | +10 XP |
| Complete a full 4-session cycle | +25 bonus XP |
| Maintain a daily streak (consecutive days with ≥ 1 completed session) | +5 XP / day |
| Reach a personal daily best (most sessions in a single day) | +15 XP |

**Level thresholds (example — tunable):**

| Level | XP required |
|-------|-------------|
| 1 | 0 |
| 2 | 50 |
| 3 | 130 |
| 4 | 250 |
| 5 | 420 |
| … | … (exponential curve) |

- A small **XP bar** and level indicator appear below the timer (unobtrusive; hidden in Focus Mode).
- On level-up, a brief congratulatory animation/toast notification is shown.
- In Focus Mode, all XP UI is hidden; XP is still earned silently.
- All XP and level data persisted in `localStorage` (with optional future cloud sync).

**Acceptance criteria:**
- [ ] XP awarded correctly for each action type
- [ ] Level calculated from cumulative XP using the defined curve
- [ ] Level-up notification shown (dismissible, accessible)
- [ ] XP bar hidden in Focus Mode
- [ ] Data persisted in `localStorage` and survives refresh

### 2. Achievement Badges

A collection of badges that unlock as users hit productivity milestones:

**Consistency badges:**

| Badge | Condition |
|-------|-----------|
| 🍅 First Tomato | Complete your very first Pomodoro |
| 🔥 3-Day Streak | Complete at least 1 session on 3 consecutive days |
| 📅 7-Day Streak | Complete at least 1 session on 7 consecutive days |
| 🏆 30-Day Streak | Complete at least 1 session on 30 consecutive days |

**Volume badges:**

| Badge | Condition |
|-------|-----------|
| ✨ Getting Started | Complete 10 total Pomodoros |
| 💪 Dedicated | Complete 50 total Pomodoros |
| 🚀 Power User | Complete 10 Pomodoros in a single week |
| ⚡ Productive Day | Complete 8 Pomodoros in a single day |

**Time-based badges:**

| Badge | Condition |
|-------|-----------|
| 🌅 Early Bird | Complete a session before 8:00 AM |
| 🌙 Night Owl | Complete a session after 10:00 PM |
| 🌟 Centurion | Accumulate 100 total completed sessions |

**UI:**
- A dedicated **Badges** tab or section in the stats panel.
- Locked badges are shown as greyed-out silhouettes with a hint of the condition (e.g., "Complete 10 sessions in a week").
- When a badge is unlocked, a toast/pop-up notification appears with the badge icon, name, and a short congratulatory message.
- Badges are stored with unlock timestamps in `localStorage`.

**Acceptance criteria:**
- [ ] All badges listed above implemented with correct unlock conditions
- [ ] Locked badges visible (greyed out) with condition hint
- [ ] Toast notification on badge unlock
- [ ] Badge collection view accessible from main UI
- [ ] Unlock data persisted in `localStorage`

### 3. Weekly / Monthly Statistics

Replace (or extend) any existing simple stats display with a rich visualisation dashboard:

#### Weekly View
- **Bar chart**: Daily Pomodoro count for the last 7 days
- **Streak counter**: Current consecutive day streak
- **Best day highlight**: Day with the most Pomodoros this week
- **Total focus time**: Sum of session durations (hours and minutes)

#### Monthly View
- **Heatmap calendar**: GitHub-style contribution heatmap (darker = more sessions)
- **Trend line chart**: Rolling 7-day average over the month
- **Top stats**: Total sessions, total focus hours, longest single-day streak

#### Implementation notes
- Charts built with a lightweight library (e.g., **Chart.js** or **Recharts** if React is used) or pure SVG/Canvas to keep bundle size minimal.
- All data sourced from `localStorage` session history (array of `{ date: ISO-string, duration: number, completed: boolean }`).
- Stats update in real time as sessions complete (no manual refresh required).
- The stats panel is accessible via a chart icon `📊` in the main toolbar.

**Acceptance criteria:**
- [ ] Weekly bar chart with correct daily counts for last 7 days
- [ ] Monthly heatmap calendar renders correctly
- [ ] Trend line chart visible in monthly view
- [ ] Summary stats (total sessions, total hours, streak) accurate
- [ ] Stats panel accessible from main toolbar
- [ ] Charts re-render when new session data is added without full page reload

## Data Model

```js
// localStorage key: "pomodoro_sessions"
[
  {
    id: "uuid-v4",
    startedAt: "2026-03-13T09:00:00.000Z",  // ISO 8601
    completedAt: "2026-03-13T09:25:00.000Z",
    durationMinutes: 25,
    completed: true   // false if abandoned
  },
  // …
]

// localStorage key: "pomodoro_gamification"
{
  xp: 340,
  level: 4,
  streak: { current: 5, longest: 12, lastActiveDate: "2026-03-13" },
  badges: [
    { id: "first_tomato",   unlockedAt: "2026-02-01T10:30:00.000Z" },
    { id: "three_day_streak", unlockedAt: "2026-02-03T18:00:00.000Z" }
  ]
}
```

## Phased Delivery

This issue can be split into sub-tasks if desired:

1. **Phase 1** – Data model & session persistence (`localStorage` schema, session recording)
2. **Phase 2** – XP system & level bar
3. **Phase 3** – Achievement badge evaluation & notification
4. **Phase 4** – Statistics charts (weekly bar chart first, then monthly heatmap)

## Labels

`enhancement`, `gamification`, `analytics`, `ui/ux`

## Priority

Medium — valuable for retention; can be delivered incrementally. Phase 1 is a prerequisite for all other phases.
