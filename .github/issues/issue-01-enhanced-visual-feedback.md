# Pattern A: Enhanced Visual Feedback for Pomodoro Timer

## Summary

Improve the Pomodoro timer's visual feedback to make focus sessions more immersive and motivating through smooth animations, meaningful color cues, and dynamic background effects.

## Background

The current timer displays a static countdown. Users have reported that a purely numerical countdown does not create a strong enough sense of urgency or engagement throughout a focus session. Richer visual feedback can help users stay aware of how much time remains without needing to consciously read the numbers.

## Feature Breakdown

### 1. Circular Progress Bar Animation

- Replace (or supplement) the numeric countdown with an **SVG or Canvas-based circular arc** that shrinks smoothly as time elapses.
- The arc should decrease continuously (60 fps animation) rather than jumping once per second.
- The stroke width, radius, and overall size should be responsive to the container size.
- Provide an accessible text alternative (`aria-label` / `role="timer"`) so screen readers still announce the remaining time.

**Acceptance criteria:**
- [ ] Circular arc visible around the timer face
- [ ] Arc decreases smoothly and continuously (no visible tick jumps)
- [ ] Works correctly at all standard timer durations (15 / 25 / 35 / 45 min)
- [ ] Accessible — screen reader announces remaining time correctly

### 2. Color Gradient Changes Over Time

| Phase | Time remaining | Color |
|-------|---------------|-------|
| Start | 100 % → 60 % | Blue `#3B82F6` |
| Mid   | 60 % → 30 %  | Yellow `#F59E0B` |
| End   | 30 % → 0 %   | Red `#EF4444` |

- The transition between each phase should be a smooth CSS or JS-driven gradient interpolation.
- Both the circular arc stroke and the numeric display should reflect the current color.
- The color scheme should remain accessible (WCAG AA contrast) against both light and dark backgrounds.

**Acceptance criteria:**
- [ ] Color shifts blue → yellow → red as the session progresses
- [ ] Transition is smooth, not a hard cut
- [ ] WCAG AA contrast maintained throughout

### 3. Background Effects During Focus Sessions

- **Particle effect**: Subtle floating particles (dots or sparkles) that animate in the background while the timer is running, pausing when the timer is paused/stopped.
- **Ripple animation**: A soft pulse/ripple radiating outward from the timer face approximately every 5 seconds as a gentle "heartbeat."
- Effects must degrade gracefully: if the user has `prefers-reduced-motion` enabled, all animations should be disabled or reduced to a simple static indicator.
- Effects are purely decorative and should not interfere with timer interaction or accessibility.

**Acceptance criteria:**
- [ ] Particle/ripple animations start when timer starts and pause when timer is paused
- [ ] `prefers-reduced-motion` media query respected — all effects disabled when set
- [ ] No impact on timer accuracy (animations run on a separate layer / `requestAnimationFrame`)
- [ ] Visually tested on mobile and desktop viewports

## Design Mockup Reference

```
  ┌─────────────────────────────┐
  │        ·  ·  ·  ·  ·       │  ← particles (subtle)
  │    ╭──────────────╮         │
  │   ╱  ╭──────────╮  ╲        │
  │  |  |  24:37    |  |        │  ← arc stroke (blue→yellow→red)
  │   ╲  ╰──────────╯  ╱        │
  │    ╰──────────────╯         │
  │       ↑   ↑   ↑            │
  │     ripple waves (subtle)   │
  └─────────────────────────────┘
```

## Technical Notes

- Use `requestAnimationFrame` for all animation loops.
- Circular arc: SVG `<circle>` with `stroke-dasharray` / `stroke-dashoffset` is the recommended approach for smooth animation.
- Color interpolation: lerp between hex color stops based on `timeRemaining / totalTime`.
- Particle system: Canvas 2D context or CSS keyframe animations for low-overhead rendering.

## Labels

`enhancement`, `ui/ux`, `animation`

## Priority

Medium — does not affect core functionality; improves user experience.
