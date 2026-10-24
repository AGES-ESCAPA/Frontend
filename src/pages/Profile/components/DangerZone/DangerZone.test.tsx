import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DangerZone } from './DangerZone';

vi.mock('@services/profileService', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, profileService: { deactivateAccount: vi.fn() } };
});

describe('DangerZone', () => {
  it('opens the confirmation modal from the deactivate button', async () => {
    render(<DangerZone onDeactivated={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Desativar Minha Conta' }));

    expect(await screen.findByRole('dialog', { name: 'Tem certeza?' })).toBeInTheDocument();
  });
});
