import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { registerServiceWorker, resetPwaState } from '@/lib/pwa';
import { UpdateToast } from './UpdateToast';

function signalUpdate() {
  const c = Object.assign(new EventTarget(), {
    controller: {},
    register: () => Promise.resolve(),
  });
  registerServiceWorker(c as unknown as ServiceWorkerContainer, '/sw.js');
  act(() => {
    c.dispatchEvent(new Event('controllerchange'));
  });
}

beforeEach(() => {
  resetPwaState();
});

describe('UpdateToast', () => {
  it('stays hidden until an update arrives, then reloads on request', async () => {
    const reload = vi.fn();
    render(<UpdateToast reload={reload} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    signalUpdate();
    expect(screen.getByRole('status')).toHaveTextContent('new version');
    await userEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(reload).toHaveBeenCalled();
  });

  it('can be dismissed', async () => {
    render(<UpdateToast reload={vi.fn()} />);
    signalUpdate();
    await userEvent.click(screen.getByRole('button', { name: 'Later' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
