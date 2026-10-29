# Shuttle School

[![CI](https://github.com/buvann-11/shuttle-school/actions/workflows/ci.yml/badge.svg)](https://github.com/buvann-11/shuttle-school/actions/workflows/ci.yml)
[![Deploy](https://github.com/buvann-11/shuttle-school/actions/workflows/deploy.yml/badge.svg)](https://github.com/buvann-11/shuttle-school/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Learn badminton strokes visually, step by step, without a coach.

**Live:** https://buvann-11.github.io/shuttle-school/

<p>
  <img src="docs/screenshots/laptop.png" alt="Smash lesson on a laptop, paused at the contact step" width="68%">
  <img src="docs/screenshots/phone.png" alt="Forehand net shot lesson on a phone in dark mode" width="28%">
</p>

## What it does

Each lesson is an animated side-on figure that performs the stroke, broken into named steps with a coaching cue for each one.

- **11 lessons** across Foundations (grips, ready stance, split step) and Strokes (clear, smash, drop, high and low serves, net shot, lift, drive).
- **Step through it**: pause on any step, scrub with the arrow keys, slow it to ¼ speed, show the racket path or every step at once.
- **Left-handed mode** mirrors every lesson.
- **Read steps aloud** for practising without looking at the screen.
- **Progress** is saved on the device, and returning learners resume at their next unlearned lesson.
- **Installable and offline**: a service worker precaches the app, so it works on court with no signal.
- **Light and dark themes**, following the device or set manually.

## Quality bar

| Area          | How it is enforced                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| Types         | TypeScript `strict` plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`                            |
| Lint          | ESLint with `strictTypeChecked`, React Hooks and `jsx-a11y`; zero warnings allowed                              |
| Unit tests    | 90+ Vitest tests; coverage gate of 90% lines                                                                    |
| Content       | Every lesson is validated against a Zod schema in CI (timing, joint names, shuttle contact frame, unique ids)   |
| End-to-end    | Playwright on laptop, Android and iPhone viewports: learning flow, persistence, live animation, offline mode    |
| Accessibility | axe-core (WCAG 2.2 AA) in light and dark themes, no horizontal scroll, minimum tap sizes, full keyboard control |
| Lighthouse    | Accessibility 100, Best Practices 100                                                                           |

## Tech stack

React 19 · TypeScript · Vite · React Router · Canvas 2D · Vitest + Testing Library · Playwright + axe-core · GitHub Actions

## Getting started

Requires Node.js 20.19 or newer (see `.nvmrc`).

```bash
npm install
npm run dev          # http://localhost:5173
```

| Script                  | Purpose                                           |
| ----------------------- | ------------------------------------------------- |
| `npm run dev`           | Development server with hot reload                |
| `npm run build`         | Type-check and build to `dist/`                   |
| `npm run preview`       | Serve the production build                        |
| `npm test`              | Unit and component tests                          |
| `npm run test:coverage` | Tests with the coverage gate                      |
| `npm run test:e2e`      | Playwright end-to-end and accessibility tests     |
| `npm run lint`          | ESLint                                            |
| `npm run check`         | Everything CI runs before a build, in one command |

First time running end-to-end tests: `npx playwright install chromium`.

## Project structure

```
src/
  app/            App shell: layout, header, routes, not-found page
  components/     Reusable UI: Button, Segmented, Switch, ProgressBar, icons
  content/        lessons.json, its Zod schema, and the typed lesson library
  engine/         Framework-free animation core
    pose.ts         Forward kinematics for the stick figure
    timeline.ts     Keyframe timing, easing and step sampling
    shuttle.ts      Shuttle flight in and out of the contact point
    render.ts       Canvas drawing for figure and grip scenes
  features/lessons/  Lesson page: player, stage, controls, steps, notes
  lib/            Persistent stores (progress, settings), media queries, speech
e2e/              Playwright tests
scripts/          Build plugin that generates the offline service worker
```

### How a lesson becomes an animation

1. A lesson in `src/content/lessons.json` is a list of keyframes. Each keyframe names a step, a coaching cue, how long the move into it takes, and the joint angles that differ from the ready stance.
2. `timeline.ts` turns durations into a looping timeline and finds the current step at any moment.
3. `pose.ts` blends neighbouring keyframes and runs forward kinematics to get joint positions.
4. `render.ts` draws the court, figure, racket, trail and shuttle on a canvas that is sized to the element and the screen's pixel density.

Adding a lesson is a content change only: add an entry to `lessons.json`, and the schema test tells you if anything is wrong.

## Deployment

Every push to `main` runs CI, then deploys to GitHub Pages. To enable it on a fork, set **Settings → Pages → Source** to **GitHub Actions**.

The app uses hash routing and relative asset paths, so the same build works on any static host.

## Roadmap

- Course map with units and unlock rules
- Shadow-rep counter and timed footwork drills
- Court guide: footwork patterns, shot paths with shuttle drag, serving rules
- Rules and technique quiz
- Backhand strokes, jump smash, defensive block, doubles formations

## License

[MIT](LICENSE) © B. Sai Buvann
