/**
 * types/certificate.ts
 *
 * Espelha o contrato JSON de `GET /api/v1/certificates/{verificationCode}`
 * (US-18 backend): `certificate`, `student` e `course` separados, para o
 * campo `course` ir direto ao `CourseCard` sem remapear nomes de campo.
 */
export interface CertificateDetails {
  /** Data de conclusão em ISO (`yyyy-MM-dd`), como o `LocalDate` do backend serializa. */
  conclusionDate: string;
  /** Carga horária do curso, em minutos. */
  workload: number;
  /** Código público usado para validar a autenticidade do certificado. */
  verificationCode: string;
}

export interface CertificateStudent {
  name: string;
  /** Só existe no perfil de admin; alunos comuns recebem `null`. */
  avatarUrl: string | null;
  /** Indica conta ativa, não relacionado à autenticidade do certificado. */
  isVerified: boolean;
}

export interface CertificateCourseSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  thumbnailUrl: string | null;
  /** Duração total do curso, em minutos. */
  durationTime: number;
  lessonsCount: number;
  /** `null` enquanto o curso não tiver avaliações. */
  rating: number | null;
  reviewsCount: number;
  instructor: string;
  price: number;
}

export interface CertificateData {
  certificate: CertificateDetails;
  student: CertificateStudent;
  course: CertificateCourseSummary;
  /**
   * Se quem acessa o link é o dono do certificado. Fixo em `false` no backend
   * nesta sprint (sem autenticação real ainda), então a tela sempre renderiza
   * a versão pública em produção até a autenticação ser implementada.
   */
  isOwner: boolean;
}
