import { screen, within } from '@testing-library/react';
import { progressStore } from '@/lib/progress';
import { settingsStore } from '@/lib/settings';
import { renderApp } from '@/test/render-app';

beforeEach(() => {
  progressStore.reload();
  settingsStore.reload();
});

describe('lesson page', () => {
  it('sends a new learner to the first lesson', async () => {
    const { router } = renderApp('/');
    expect(await screen.findByRole('heading', { level: 1, name: 'Grips' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/lessons/grip');
  });

  it('resumes at the first lesson not yet learned', async () => {
    progressStore.set({ learned: ['grip', 'ready'] });
    renderApp('/');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Split step' }),
    ).toBeInTheDocument();
  });

  it('shows the lesson, its coaching notes and every step', async () => {
    renderApp('/lessons/clear');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Forehand clear' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Lesson 4 of 11 · Strokes')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Do this' })).toBeInTheDocument();
    expect(screen.getByText('Turn side-on early.')).toBeInTheDocument();
    const steps = screen.getByRole('list', { name: /tap a step/i });
    expect(within(steps).getAllByRole('button')).toHaveLength(6);
    expect(screen.getByRole('img', { name: /forehand clear demonstration/i })).toBeInTheDocument();
    expect(document.title).toBe('Forehand clear · Shuttle School');
  });

  it('marks the current lesson in the lesson list', async () => {
    renderApp('/lessons/smash');
    const nav = await screen.findByRole('navigation', { name: 'Lessons' });
    expect(within(nav).getByRole('link', { name: /smash/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('pauses on a step when it is tapped', async () => {
    const { user } = renderApp('/lessons/clear');
    await user.click(await screen.findByRole('button', { name: /racket drop/i }));
    expect(screen.getByRole('button', { name: /racket drop/i })).toHaveAttribute(
      'aria-current',
      'step',
    );
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    expect(screen.getByText('Step 3 of 6')).toBeInTheDocument();
  });

  it('steps with the arrow keys and toggles playback with Space', async () => {
    const { user } = renderApp('/lessons/clear');
    await screen.findByRole('heading', { level: 1 });
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: /turn side-on/i })).toHaveAttribute(
      'aria-current',
      'step',
    );
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('button', { name: /recover/i })).toHaveAttribute(
      'aria-current',
      'step',
    );
    await user.keyboard(' ');
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('marks a lesson learned, updates progress and remembers it', async () => {
    const { user } = renderApp('/lessons/grip');
    await user.click(await screen.findByRole('button', { name: 'Mark as learned' }));
    expect(screen.getByRole('button', { name: 'Learned' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('1 of 11 lessons learned')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /grips, learned/i })).toBeInTheDocument();
    expect(progressStore.get().learned).toEqual(['grip']);
  });

  it('goes to the next unlearned lesson', async () => {
    progressStore.set({ learned: ['ready'] });
    const { user, router } = renderApp('/lessons/grip');
    await user.click(await screen.findByRole('button', { name: /next: split step/i }));
    expect(router.state.location.pathname).toBe('/lessons/split');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Split step' }),
    ).toBeInTheDocument();
  });

  it('saves playback speed and view options', async () => {
    const { user } = renderApp('/lessons/clear');
    await user.click(await screen.findByRole('button', { name: '1× speed' }));
    expect(screen.getByRole('button', { name: '1× speed' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByText('View options'));
    await user.click(screen.getByRole('switch', { name: "I'm left-handed" }));
    expect(settingsStore.get()).toMatchObject({ speed: 1, leftHanded: true });
    expect(screen.getByRole('img', { name: /left-handed/i })).toBeInTheDocument();
  });

  it('hides figure-only options on the grip lesson', async () => {
    const { user } = renderApp('/lessons/grip');
    await user.click(await screen.findByText('View options'));
    expect(screen.queryByRole('switch', { name: 'Racket path' })).not.toBeInTheDocument();
    expect(screen.getByRole('switch', { name: "I'm left-handed" })).toBeInTheDocument();
  });

  it('shows a not-found page for an unknown lesson', async () => {
    renderApp('/lessons/backflip');
    expect(
      await screen.findByRole('heading', { name: /couldn.t find that page/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to lessons' })).toHaveAttribute('href', '/');
  });
});

describe('app shell', () => {
  it('cycles the theme and applies it to the document', async () => {
    const { user } = renderApp('/lessons/grip');
    const button = await screen.findByRole('button', { name: /theme: match device/i });
    await user.click(button);
    expect(document.documentElement.dataset.theme).toBe('light');
    await user.click(screen.getByRole('button', { name: /theme: light/i }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    await user.click(screen.getByRole('button', { name: /theme: dark/i }));
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('offers a skip link that moves focus to the main content', async () => {
    const { user } = renderApp('/lessons/grip');
    await user.click(await screen.findByRole('link', { name: 'Skip to content' }));
    expect(screen.getByRole('main')).toHaveFocus();
  });
});
