import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CertificateCard } from './CertificateCard';

const defaultProps = {
  studentName: 'Mariana Costa',
  courseTitle: 'Atendimento de Excelência em Hospedagem',
  workload: '16h',
  conclusionDate: '21 de agosto de 2026',
  verificationCode: 'ESCAPA-ABC123',
};

describe('CertificateCard', () => {
  it('renders student, course and verification details', () => {
    render(<CertificateCard {...defaultProps} />);

    expect(screen.getByRole('article', { name: 'Certificado de conclusão' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: defaultProps.studentName }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: defaultProps.courseTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(defaultProps.conclusionDate)).toBeInTheDocument();
    expect(screen.getAllByText(defaultProps.workload).length).toBeGreaterThan(0);
    expect(screen.getByText(defaultProps.verificationCode)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /escapa\.com\.br\/certificados/i })).toHaveAttribute(
      'href',
      `/certificados/${defaultProps.verificationCode}`,
    );
  });
});
