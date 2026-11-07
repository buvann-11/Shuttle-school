import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { RouteError } from './RouteError';

function Boom(): never {
  throw new Error('canvas exploded');
}

describe('RouteError', () => {
  it('replaces a crashed page with a friendly recovery screen', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const router = createMemoryRouter([
      { path: '/', element: <Boom />, errorElement: <RouteError /> },
    ]);
    render(<RouterProvider router={router} />);
    expect(
      await screen.findByRole('heading', { name: 'Something went wrong' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to lessons' })).toHaveAttribute('href', '/');
    expect(screen.getByText('canvas exploded')).toBeInTheDocument();
    error.mockRestore();
  });

  it('describes routing errors by status', async () => {
    const router = createMemoryRouter([
      {
        path: '/',
        loader: () => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw new Response(null, { status: 503, statusText: 'Unavailable' });
        },
        element: <p>never</p>,
        errorElement: <RouteError />,
      },
    ]);
    render(<RouterProvider router={router} />);
    expect(await screen.findByText('503 Unavailable')).toBeInTheDocument();
  });
});
