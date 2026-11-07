# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-11-07

First public release.

### Lessons

- 11 animated lessons: grips, ready stance, split step, forehand clear, smash, drop shot, high serve, low backhand serve, forehand net shot, underarm lift and forehand drive.
- Each step has a name and a coaching cue, plus "Do this", "Avoid this" and a drill for every lesson.

### Player

- Seek bar with a mark at every step; drag it to study the motion frame by frame.
- Previous and next step buttons, tappable step list, and keyboard control (Space, ← →, F).
- ¼, ½ and 1× speed, racket path, all-steps-at-once view, left-handed mode, steps read aloud.
- Full-screen mode where the browser supports it.

### App

- Progress saved on the device; returning learners resume at their next unlearned lesson.
- Light and dark themes, following the device or chosen manually.
- Installable app that works offline, with an "Install app" button where the browser offers one and a notice when an update is ready.
- Friendly error and not-found pages.

### Quality and deployment

- Strict TypeScript, zero-warning ESLint with accessibility rules, 120+ unit and component tests (90% coverage gate).
- Playwright tests on laptop, Android and iPhone sizes, including WCAG 2.2 AA checks in both themes, offline use, and a no-console-errors check.
- Content Security Policy, link-preview image and tags, GitHub Pages 404 redirect.
- CI on every push and pull request; the site deploys only when every check passes on `main`.

[1.0.0]: https://github.com/buvann-11/shuttle-school/releases/tag/v1.0.0
