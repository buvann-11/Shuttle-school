# Contributing

Thanks for helping people learn badminton. Bug reports, technique corrections and code are all welcome.

## Setup

Node.js 20.19+ is required (`.nvmrc` pins the version CI uses).

```bash
npm install
npm run dev
```

Before opening a pull request:

```bash
npm run check        # format, lint, types, unit tests with coverage gate, build
npm run test:e2e     # browser tests (first time: npx playwright install chromium)
```

CI runs the same commands, and the site only deploys when all of them pass on `main`.

## Adding or editing a lesson

Lessons are data, not code. Everything lives in [`src/content/lessons.json`](src/content/lessons.json).

Each lesson has:

| Field                         | Meaning                                                                     |
| ----------------------------- | --------------------------------------------------------------------------- |
| `id`                          | URL slug, lowercase kebab-case (`backhand-clear`)                           |
| `level`                       | `Foundations` or `Strokes`                                                  |
| `kind`                        | `figure` (animated player) or `grip` (handle diagram)                       |
| `keys`                        | Keyframes. Each has a `label`, a coaching `cue` and a `duration` in ms      |
| `keys[].pose`                 | Joint angles in degrees that differ from the ready stance (see `pose.ts`)   |
| `keys[].linear`               | Use linear timing into this keyframe (good for the hit itself)              |
| `shuttle`                     | Optional shuttle flight; `contactKey` is the keyframe where the racket hits |
| `points`, `mistakes`, `drill` | The coaching notes under the player                                         |

Rules the schema enforces (`npm test` will tell you exactly what's wrong):

- The first keyframe has `duration: 0`; every later one is longer than 0.
- Joint names must be one of those in `POSE_KEYS`.
- `shuttle.contactKey` must point at a real keyframe.
- Ids are unique.

Tip: run `npm run dev`, open the lesson, pause and use the ← → keys or the seek bar to check each keyframe.

## Code style

- TypeScript strict mode, no `any`. Prettier formats; ESLint (with jsx-a11y) must report zero warnings.
- Keep the animation engine (`src/engine`) free of React so it stays easy to test.
- Every interactive element needs an accessible name and must work from the keyboard.
- Add a test with every behaviour change. Coverage must stay above 90% of lines.

## Commit messages

Short imperative summary (`Add backhand clear lesson`), then a blank line and the why, if it isn't obvious.
