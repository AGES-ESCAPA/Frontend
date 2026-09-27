import { useId } from 'react';
import { BadgeCheck, Calendar, Clock3, ShieldCheck } from 'lucide-react';
import logo from '@assets/escapa_logo.png';
import type { CertificateData } from '@/types/certificate';
import styles from './CertificateCard.module.css';

export interface CertificateCardProps {
  certificate: CertificateData;
}

const BADGE_TEXT = 'CERTIFICADO DE CONCLUSÃO • CERTIFICADO DE CONCLUSÃO • ';

/**
 * Representação visual do certificado (US-18): dados do curso e do aluno e o
 * selo circular de autenticidade, seguindo o padrão do protótipo.
 */
export const CertificateCard = ({ certificate }: CertificateCardProps) => {
  const { course, student, workload, conclusionDate, verificationCode } = certificate;
  const badgePathId = useId();

  return (
    <div className={styles.card}>
      <div className={styles.ribbon} aria-hidden="true" />

      <div className={styles.badge} aria-hidden="true">
        <svg viewBox="0 0 120 120" className={styles.badgeRing}>
          <circle cx="60" cy="60" r="56" className={styles.badgeRingCircle} />
          <path
            id={badgePathId}
            d="M 60,60 m -44,0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0"
            fill="none"
          />
          <text className={styles.badgeText}>
            <textPath href={`#${badgePathId}`} startOffset="0%">
              {BADGE_TEXT}
            </textPath>
          </text>
        </svg>
        <BadgeCheck className={styles.badgeIcon} size={30} />
      </div>

      <header className={styles.header}>
        <img src={logo} alt="escapa!" className={styles.logo} />
        <span className={styles.divider} aria-hidden="true" />
        <span className={styles.context}>cursos</span>
      </header>

      <span className={styles.eyebrow}>Certificado de Conclusão</span>

      <div className={styles.intro}>
        <p className={styles.introLine}>Certificamos que</p>
        <h1 className={styles.studentName}>{student}</h1>
        <p className={styles.introLine}>concluiu com sucesso o curso</p>
        <h2 className={styles.courseName}>{course}</h2>
        <p className={styles.offeredBy}>
          oferecido pela Escapa! Cursos, com carga horária total de {workload}.
        </p>
      </div>

      <dl className={styles.details}>
        <div className={styles.detailItem}>
          <Calendar size={20} aria-hidden="true" />
          <div>
            <dt>Data de conclusão</dt>
            <dd>{conclusionDate}</dd>
          </div>
        </div>
        <div className={styles.detailItem}>
          <Clock3 size={20} aria-hidden="true" />
          <div>
            <dt>Carga horária</dt>
            <dd>{workload}</dd>
          </div>
        </div>
        <div className={styles.detailItem}>
          <ShieldCheck size={20} aria-hidden="true" />
          <div>
            <dt>Código de verificação</dt>
            <dd>{verificationCode}</dd>
          </div>
        </div>
      </dl>

      <div className={styles.verify}>
        <p>Verifique a autenticidade deste certificado em:</p>
        <a href={`/certificados/${verificationCode}`} className={styles.verifyLink}>
          escapa.com.br/certificados/{verificationCode}
        </a>
      </div>

      <div className={styles.signature}>
        <span className={styles.signatureScript}>Equipe Escapa!</span>
        <span className={styles.signatureLine} aria-hidden="true" />
        <span className={styles.signatureName}>Equipe Escapa! Cursos</span>
        <span className={styles.signatureCaption}>Plataforma de Ensino Online</span>
      </div>
    </div>
  );
};
