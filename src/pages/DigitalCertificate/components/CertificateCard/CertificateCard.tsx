import { useId } from 'react';
import { CalendarDays, Clock, IdCard } from 'lucide-react';
import logo from '@assets/escapa_logo.png';
import type { CertificateData } from '@/types/certificate';
import styles from './CertificateCard.module.css';

export interface CertificateCardProps {
  certificate: CertificateData;
}

/**
 * Fita vertical que desce do topo do certificado, com os contornos apagados da
 * fita dobrada logo abaixo. Coordenadas medidas na imagem do protótipo.
 */
const Ribbon = () => (
  <svg className={styles.ribbon} viewBox="0 0 330 920" aria-hidden="true">
    <g className={styles.ribbonTails}>
      <rect x="101" y="443" width="150" height="300" rx="14" transform="rotate(16 176 593)" />
      <rect x="24" y="767" width="160" height="130" rx="16" transform="rotate(10 104 832)" />
    </g>
    <polygon className={styles.ribbonBand} points="110,0 302,0 302,415 206,492 110,415" />
  </svg>
);

/** Selo circular "Certificado de conclusão" com o check no centro. */
const Seal = () => {
  const topArcId = useId();
  const bottomArcId = useId();

  return (
    <svg className={styles.seal} viewBox="0 0 216 216" aria-hidden="true">
      <defs>
        <path id={topArcId} d="M 34,108 A 74,74 0 0 1 182,108" />
        <path id={bottomArcId} d="M 19,108 A 89,89 0 0 0 197,108" />
      </defs>
      <circle className={styles.sealOuter} cx="108" cy="108" r="103" />
      <circle className={styles.sealInner} cx="108" cy="108" r="58" />
      <circle className={styles.sealDot} cx="29" cy="108" r="5" />
      <circle className={styles.sealDot} cx="187" cy="108" r="5" />
      <text className={styles.sealText}>
        <textPath href={`#${topArcId}`} startOffset="50%" textAnchor="middle">
          CERTIFICADO
        </textPath>
      </text>
      <text className={styles.sealText}>
        <textPath href={`#${bottomArcId}`} startOffset="50%" textAnchor="middle">
          DE CONCLUSÃO
        </textPath>
      </text>
      <polyline className={styles.sealCheck} points="79,114 100,133 137,85" />
    </svg>
  );
};

/** Traço manuscrito da assinatura da equipe. */
const SignatureStroke = () => (
  <svg className={styles.signatureStroke} viewBox="0 0 240 90" aria-hidden="true">
    <path d="M8 88 C30 60 42 20 40 8 C38 30 30 60 24 78 C40 50 55 40 62 52 C66 60 60 70 70 62 C80 54 88 48 95 52 C100 56 98 62 106 58 M118 30 C120 45 118 60 116 66 C124 52 132 42 140 46 C146 50 140 62 150 58 C160 54 170 50 178 54 C186 58 188 62 196 58 C206 52 216 54 236 58" />
  </svg>
);

/**
 * Representação visual do certificado (US-18), reproduzindo a imagem do
 * protótipo: dados do aluno e do curso, selo com fita e assinatura da equipe.
 */
export const CertificateCard = ({ certificate }: CertificateCardProps) => {
  const { course, student, workload, conclusionDate, verificationCode } = certificate;

  return (
    <article className={styles.card} aria-label="Certificado de conclusão">
      <Ribbon />
      <Seal />

      <div className={styles.content}>
        <header className={styles.header}>
          <img src={logo} alt="escapa!" className={styles.logo} />
          <span className={styles.divider} aria-hidden="true" />
          <span className={styles.context}>Cursos</span>
        </header>

        <p className={styles.eyebrow}>Certificado de conclusão</p>

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
            <CalendarDays className={styles.detailIcon} aria-hidden="true" />
            <div>
              <dt>Data de conclusão</dt>
              <dd>{conclusionDate}</dd>
            </div>
          </div>
          <div className={styles.detailItem}>
            <Clock className={styles.detailIcon} aria-hidden="true" />
            <div>
              <dt>Carga horária</dt>
              <dd>{workload}</dd>
            </div>
          </div>
          <div className={styles.detailItem}>
            <IdCard className={styles.detailIcon} aria-hidden="true" />
            <div>
              <dt>Código de verificação</dt>
              <dd>{verificationCode}</dd>
            </div>
          </div>
        </dl>

        <footer className={styles.footer}>
          <div className={styles.verify}>
            <p>Verifique a autenticidade deste certificado em:</p>
            <a href={`/certificados/${verificationCode}`} className={styles.verifyLink}>
              escapa.com.br/certificados/{verificationCode}
            </a>
          </div>

          <div className={styles.signature}>
            <SignatureStroke />
            <span className={styles.signatureLine} aria-hidden="true" />
            <span className={styles.signatureName}>Equipe Escapa! Cursos</span>
            <span className={styles.signatureCaption}>Plataforma de Ensino Online</span>
          </div>
        </footer>
      </div>
    </article>
  );
};
