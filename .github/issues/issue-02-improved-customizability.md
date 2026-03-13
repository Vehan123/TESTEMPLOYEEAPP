# Pattern B: Improved Customizability for Pomodoro Timer

## Summary

Give users meaningful control over their Pomodoro session by providing flexible duration options, theme switching, and configurable sound settings — without overwhelming them with choices.

## Background

The standard 25-minute Pomodoro technique works well for many people, but research shows that optimal focus intervals vary significantly between individuals and task types. Providing preset options (and eventually custom input) removes friction for users who want to tune the timer to their personal workflow. Theme and sound preferences further reduce distraction by allowing the UI to adapt to the user's environment (e.g., dark room, open office).

## Feature Breakdown

### 1. Flexible Session Duration Settings

Replace the fixed 25-minute session with a **preset selector**:

| Option | Duration |
|--------|----------|
| Short  | 15 min   |
| Classic| 25 min (default) |
| Long   | 35 min   |
| Deep   | 45 min   |

- The selector should be visible on the main timer screen before a session starts.
- Once a session is running, changing the duration is disabled (or requires confirmation) to prevent accidental resets.
- The selected duration persists in `localStorage` so it survives page refreshes.
- Short break (5 min) and long break (15 min) durations should also be independently adjustable via the settings panel.

**Acceptance criteria:**
- [ ] Four preset work durations selectable (15 / 25 / 35 / 45 min)
- [ ] Selection disabled while timer is actively running
- [ ] Chosen duration saved to `localStorage` and restored on next visit
- [ ] Break durations independently configurable

### 2. Theme Switching

Provide three distinct visual themes accessible from a settings panel or a top-bar toggle:

#### Light Mode (default)
- White/off-white background `#FAFAFA`
- Dark text `#1A1A2E`
- Accent color: Tomato red `#E63946`

#### Dark Mode
- Deep dark background `#0D1117`
- Light text `#E6EDF3`
- Accent color: Soft blue `#58A6FF`

#### Focus Mode (minimal)
- Solid single-color background (user-configurable or a calm green `#1A4A2E`)
- Timer digits only — all UI chrome (buttons, settings, stats) hidden
- Press `Esc` or click anywhere to exit Focus Mode

Implementation notes:
- Use CSS custom properties (`--color-bg`, `--color-text`, etc.) so themes can be swapped by toggling a `data-theme` attribute on `<body>`.
- Persist the user's last theme choice in `localStorage`.
- Respect the OS `prefers-color-scheme` as the default if the user has not made an explicit choice.

**Acceptance criteria:**
- [ ] Three themes: Light, Dark, Focus
- [ ] Theme toggle accessible from main UI (keyboard-navigable)
- [ ] Theme persisted in `localStorage`
- [ ] OS `prefers-color-scheme` respected as initial default
- [ ] Focus Mode hides non-essential UI; `Esc` exits

### 3. Sound Settings

Provide a settings panel section for sound control:

| Sound Event | Default |
|-------------|---------|
| Session start chime | On |
| Session end alarm | On |
| Tick sound (every second) | Off |

- Each sound event has an **individual toggle** (on/off).
- A **master mute** toggle at the top of the sound settings section mutes all sounds at once.
- Sound files should be short, royalty-free audio clips (`.mp3` and `.ogg` fallback for browser compatibility).
- Sounds should use the Web Audio API or `<audio>` elements with preloading to minimize latency.
- Preferences stored in `localStorage`.

**Acceptance criteria:**
- [ ] Individual toggles for start chime, end alarm, and tick sound
- [ ] Master mute toggle
- [ ] Sound preferences persisted in `localStorage`
- [ ] Audio loads without network errors; graceful fallback if audio is unavailable
- [ ] No sound played if user's browser blocks autoplay before interaction

## Settings Panel UX

```
╔════════════════════════════════╗
║  ⚙  Settings                  ✕ ║
╠════════════════════════════════╣
║  Session Duration               ║
║  [ 15 ] [ 25 ✓] [ 35 ] [ 45 ]  ║
║                                 ║
║  Theme                          ║
║  ○ Light  ● Dark  ○ Focus       ║
║                                 ║
║  Sound                          ║
║  Master Mute: [══●══] OFF       ║
║  Start chime  [●═══] ON         ║
║  End alarm    [●═══] ON         ║
║  Tick sound   [══●═] OFF        ║
╚════════════════════════════════╝
```

## Technical Notes

- Settings panel: a slide-in drawer or a modal dialog accessible via a gear icon (`⚙`).
- Duration selector: styled `<button>` group or `<select>` (keyboard accessible).
- Theme: `document.body.setAttribute('data-theme', theme)` + CSS variables.
- Sound: preload audio with `<link rel="preload" as="audio">` or Web Audio API `AudioContext`.

## Labels

`enhancement`, `settings`, `ux`, `accessibility`

## Priority

High — directly impacts the timer's utility for a broad range of users.
