import { act, render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectivityProvider } from './ConnectivityContext';
import { useConnectivity, useNetworkRecovery } from './useConnectivity';
import { ConnectionBanner } from '@components/layout/ConnectionBanner/ConnectionBanner';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ConnectivityProvider>{children}</ConnectivityProvider>
);

describe('ConnectivityProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('hides micro-outages from the offline banner', () => {
    render(
      <ConnectivityProvider>
        <ConnectionBanner />
      </ConnectivityProvider>,
    );

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.queryByTestId('connection-banner-offline')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(500);
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.queryByTestId('connection-banner-offline')).toBeNull();
  });

  it('shows the offline banner after a sustained outage and recovers on reconnect', () => {
    render(
      <ConnectivityProvider>
        <ConnectionBanner />
      </ConnectivityProvider>,
    );

    act(() => {
      window.dispatchEvent(new Event('offline'));
      vi.advanceTimersByTime(1_300);
    });

    expect(screen.getByTestId('connection-banner-offline')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.queryByTestId('connection-banner-offline')).toBeNull();
    expect(screen.getByTestId('connection-banner-online')).toBeInTheDocument();
  });

  it('notifies hooks through useNetworkRecovery when the connection returns', () => {
    const onReconnect = vi.fn();

    renderHook(
      () => {
        useNetworkRecovery(onReconnect);
        return useConnectivity();
      },
      { wrapper },
    );

    act(() => {
      window.dispatchEvent(new Event('offline'));
      vi.advanceTimersByTime(100);
      window.dispatchEvent(new Event('online'));
    });

    expect(onReconnect).toHaveBeenCalledTimes(1);
  });
});
