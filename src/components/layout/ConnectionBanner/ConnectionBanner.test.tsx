import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useConnectivity } from '@contexts/useConnectivity';
import { ConnectionBanner } from './ConnectionBanner';

vi.mock('@contexts/useConnectivity', () => ({
  useConnectivity: vi.fn(),
}));

const useConnectivityMock = vi.mocked(useConnectivity);

describe('ConnectionBanner layout', () => {
  it('renders nothing when connectivity is stable', () => {
    useConnectivityMock.mockReturnValue({
      showOfflineBanner: false,
      justReconnected: false,
    } as ReturnType<typeof useConnectivity>);

    const { container } = render(<ConnectionBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the offline message and status attributes', () => {
    useConnectivityMock.mockReturnValue({
      showOfflineBanner: true,
      justReconnected: false,
    } as ReturnType<typeof useConnectivity>);

    render(<ConnectionBanner />);

    const banner = screen.getByTestId('connection-banner-offline');
    expect(banner).toHaveAttribute('role', 'status');
    expect(banner).toHaveTextContent(/sem conexão/i);
  });

  it('renders the reconnected message when back online', () => {
    useConnectivityMock.mockReturnValue({
      showOfflineBanner: false,
      justReconnected: true,
    } as ReturnType<typeof useConnectivity>);

    render(<ConnectionBanner />);

    const banner = screen.getByTestId('connection-banner-online');
    expect(banner).toHaveAttribute('role', 'status');
    expect(banner).toHaveTextContent(/conexão restabelecida/i);
  });
});
