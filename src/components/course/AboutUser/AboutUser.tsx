import type { FC } from 'react';
import { Avatar } from '@components/ui';
import styles from './AboutUser.module.css';

export interface AboutUserProps {
  /** Nome do aluno certificado. */
  name: string;
  avatarUrl?: string;
  /** Data de conclusão já formatada para exibição. */
  conclusionDate: string;
  /** Carga horária já formatada para exibição (ex.: "16 horas"). */
  workload: string;
  /** Nome do curso concluído. */
  course: string;
  /** Se a conta do aluno é verificada. Assume verificada por padrão. */
  isVerified?: boolean;
}

/**
 * Painel "quem concluiu" do certificado digital (US-18): foto, nome, data de
 * conclusão e um resumo confirmando a autenticidade da conclusão.
 */
export const AboutUser: FC<AboutUserProps> = ({
  name,
  avatarUrl,
  conclusionDate,
  workload,
  course,
  isVerified = true,
}) => {
  return (
    <section className={styles.card} aria-labelledby="about-user-title">
      <div className={styles.identity}>
        <Avatar name={name} imageUrl={avatarUrl} />
        <p id="about-user-title" className={styles.headline}>
          Concluído por <span>{name}</span>
          <br />
          em {conclusionDate}
        </p>
      </div>

      <p className={styles.summary}>
        {workload} (aproximadamente)
        <br />A conta de {name} {isVerified ? 'é verificada' : 'ainda não é verificada'}.
        <br />O Escapa! certifica a conclusão com sucesso de {course} pelo aluno.
      </p>
    </section>
  );
};
