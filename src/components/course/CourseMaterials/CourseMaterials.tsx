import { Paperclip } from 'lucide-react';
import type { FC } from 'react';
import type { CourseMaterial } from '@/types/course';
import styles from './CourseMaterials.module.css';

export interface CourseMaterialsProps {
  materials: CourseMaterial[];
}

const materialLabel = (material: CourseMaterial): string =>
  material.format ? `${material.title} (${material.format})` : material.title;

export const CourseMaterials: FC<CourseMaterialsProps> = ({ materials }) => (
  <section className={styles.section} aria-labelledby="materials-title">
    <div className={styles.card}>
      <h2 id="materials-title">Materiais Inclusos</h2>
      <ul className={styles.list}>
        {materials.map((material) => (
          <li className={styles.item} key={`${material.title}-${material.fileUrl}`}>
            <Paperclip size={18} aria-hidden="true" />
            <span className={styles.title}>{materialLabel(material)}</span>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
