import type { FC } from 'react';
import { Avatar } from '@components/ui';
import styles from './AboutUser.module.css';

export interface AboutUserProps {
  /** Nome do aluno certificado. */
  name: string;
  avatarUrl?: string;
  /** Data de conclusão já formatada para exibição. */
  conclusionDate: string;
  /** Carga horária já formatada para exibição (ex.: "12h"). */
  workload: string;
  /** Nome do curso concluído. */
  course: string;
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
        A Escapa! certifica a conclusão com sucesso do curso de {course} pelo aluno, com carga
        horária aproximada de {workload}.
      </p>
    </section>
  );
};
