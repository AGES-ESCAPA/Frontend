import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CourseVersionLogEntry } from '@/types/course';
import { VersionControlCard } from './VersionControlCard';

const entries: CourseVersionLogEntry[] = [
  {
    id: 'v2',
    timestampLabel: '12/03/2026 14:00',
    description: 'Ajuste de módulo',
    author: 'Admin',
  },
];

describe('VersionControlCard', () => {
  it('shows empty state and toggles publish notification', async () => {
    const user = userEvent.setup();
    const onNotify = vi.fn();

    const { rerender } = render(
      <VersionControlCard
        versionLabel="v1.0"
        entries={[]}
        notifyStudentsOnPublish={false}
        onNotifyStudentsOnPublishChange={onNotify}
      />,
    );

    expect(screen.getByText('Nenhuma alteração registrada.')).toBeInTheDocument();

    await user.click(
      screen.getByRole('checkbox', {
        name: /notificar todos os alunos matriculados/i,
      }),
    );
    expect(onNotify).toHaveBeenCalledWith(true);

    rerender(
      <VersionControlCard
        versionLabel="v2.0"
        entries={entries}
        notifyStudentsOnPublish={true}
        onNotifyStudentsOnPublishChange={onNotify}
      />,
    );

    expect(screen.getByText('Ajuste de módulo')).toBeInTheDocument();
    expect(screen.getByText('Por: Admin')).toBeInTheDocument();
  });
});
