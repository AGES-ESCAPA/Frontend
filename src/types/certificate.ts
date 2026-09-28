/**
 * types/certificate.ts
 *
 * Modelo do certificado digital (US-18), com os mesmos campos devolvidos pelo
 * download em PDF do backend (US-19): curso, aluno, carga horária, data de
 * conclusão e código de verificação.
 */
export interface CertificateData {
  /** Nome do curso concluído. */
  course: string;
  /** Nome do aluno certificado. */
  student: string;
  /** Carga horária já formatada para exibição (ex.: "16 horas"). */
  workload: string;
  /** Data de conclusão já formatada para exibição (ex.: "21 de agosto de 2026"). */
  conclusionDate: string;
  /** Código público usado para validar a autenticidade do certificado. */
  verificationCode: string;
}
