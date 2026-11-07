import { act, fireEvent, screen } from '@testing-library/react';
import { progressStore } from '@/lib/progress';
import { resetPwaState, watchInstallPrompt, type BeforeInstallPromptEvent } from '@/lib/pwa';
import { settingsStore } from '@/lib/settings';
import { renderApp } from '@/test/render-app';

beforeEach(() => {
  progressStore.reload();
  settingsStore.reload();
  resetPwaState();
});

describe('timeline scrubber', () => {
  it('seeks, pauses and describes the step at the new position', async () => {
    renderApp('/lessons/clear');
    const slider = await screen.findByRole('slider', { name: 'Animation position' });
    fireEvent.change(slider, { target: { value: '1300' } });
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    expect(slider).toHaveAttribute('aria-valuetext', expect.stringMatching(/^Step 5 of 6/));
    expect(screen.getByRole('button', { name: /follow-through/i })).toHaveAttribute(
      'aria-current',
      'step',
    );
  });

  it('follows step taps', async () => {
    const { user } = renderApp('/lessons/clear');
    await user.click(await screen.findByRole('button', { name: /racket drop/i }));
    expect(screen.getByRole('slider')).toHaveAttribute(
      'aria-valuetext',
      'Step 3 of 6: Racket drop',
    );
  });
});

describe('step buttons', () => {
  it('moves to the previous and next step', async () => {
    const { user } = renderApp('/lessons/smash');
    await user.click(await screen.findByRole('button', { name: 'Next step' }));
    expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    await user.click(screen.getByRole('button', { name: 'Previous step' }));
    expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
  });
});

describe('full screen', () => {
  afterEach(() => {
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: undefined });
  });

  it('is offered where supported and toggled with the button or F', async () => {
    let current: Element | null = null;
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true });
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => current,
    });
    HTMLElement.prototype.requestFullscreen = vi.fn(function (this: Element) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias -- records which element went full screen
      current = this;
      document.dispatchEvent(new Event('fullscreenchange'));
      return Promise.resolve();
    });
    document.exitFullscreen = vi.fn(() => {
      current = null;
      document.dispatchEvent(new Event('fullscreenchange'));
      return Promise.resolve();
    });

    const { user } = renderApp('/lessons/clear');
    await user.click(await screen.findByRole('button', { name: 'Full screen' }));
    expect(screen.getByRole('button', { name: 'Exit full screen' })).toBeInTheDocument();
    (document.activeElement as HTMLElement).blur();
    await user.keyboard('f');
    expect(screen.getByRole('button', { name: 'Full screen' })).toBeInTheDocument();
  });

  it('is hidden where unsupported', async () => {
    renderApp('/lessons/clear');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('button', { name: 'Full screen' })).not.toBeInTheDocument();
    expect(screen.queryByText('full screen')).not.toBeInTheDocument();
  });
});

describe('app chrome', () => {
  it('shows the version and a privacy note in the footer', async () => {
    renderApp('/lessons/grip');
    const footer = await screen.findByRole('contentinfo');
    expect(footer).toHaveTextContent(`v${__APP_VERSION__}`);
    expect(footer).toHaveTextContent(/stay on this device/i);
    expect(screen.getByRole('link', { name: 'Source on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/buvann-11/shuttle-school',
    );
  });

  it('offers an install button when the browser allows it', async () => {
    const stop = watchInstallPrompt();
    const { user } = renderApp('/lessons/grip');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('button', { name: 'Install app' })).not.toBeInTheDocument();
    const prompt = vi.fn(() => Promise.resolve());
    const e = new Event('beforeinstallprompt', { cancelable: true }) as BeforeInstallPromptEvent;
    Object.assign(e, { prompt, userChoice: Promise.resolve({ outcome: 'accepted' }) });
    act(() => {
      window.dispatchEvent(e);
    });
    await user.click(screen.getByRole('button', { name: 'Install app' }));
    expect(prompt).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Install app' })).not.toBeInTheDocument();
    stop();
  });
});
