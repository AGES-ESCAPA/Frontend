import { Badge, Button } from '@components/ui';
import { Check, Clock3, GraduationCap, Users } from 'lucide-react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CourseSummary } from '@/types/course';
import styles from './CourseHeader.module.css';

const PURCHASE_REDIRECT_KEY = 'escapa:purchase-redirect';

export interface CourseHeaderProps {
  course: CourseSummary;
}

export const CourseHeader: FC<CourseHeaderProps> = ({ course }) => {
  const navigate = useNavigate();

  const handlePurchase = () => {
    const destination = `/cursos/${course.id}`;
    const token = localStorage.getItem('access_token') ?? localStorage.getItem('token');

    if (!token) {
      localStorage.setItem(PURCHASE_REDIRECT_KEY, destination);
      navigate('/login', { state: { returnTo: destination } });
      return;
    }

    navigate(`/checkout/${course.id}`);
  };

  return (
    <section className={styles.header} aria-labelledby="course-title">
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.tags}>
            <Badge label={course.category} category="ai" />
            <Badge label={course.level} variant="neutral" />
            <Badge label="Certificado" variant="info" />
          </div>
          <h2 id="course-title">{course.title}</h2>
          <p className={styles.description}>{course.description}</p>
          <div className={styles.stats} aria-label="Informações do curso">
            <span>
              ★ {course.rating} ({course.reviewsCount} avaliações)
            </span>
            <span>
              <Users size={14} aria-hidden="true" /> {course.studentsCount.toLocaleString('pt-BR')}{' '}
              alunos
            </span>
            <span>
              <Clock3 size={14} aria-hidden="true" /> {course.durationHours}h
            </span>
          </div>
          <div className={styles.instructor}>
            <span className={styles.instructorAvatar} aria-hidden="true">
              M
            </span>
            <span>
              <strong>{course.instructor.name}</strong>
              <small>{course.instructor.role}</small>
            </span>
          </div>
        </div>

        <aside className={styles.purchase} aria-label="Comprar curso">
          <div className={styles.cover} aria-label="Imagem ilustrativa do curso" role="img">
            <GraduationCap size={56} aria-hidden="true" />
            <span>IA aplicada ao turismo</span>
          </div>
          <div className={styles.purchaseBody}>
            <div className={styles.priceBlock}>
              <strong>{course.price}</strong>
              <small>{course.accessPeriod} · Certificado incluso</small>
            </div>
            <Button
              label="Cadastre-se para Comprar"
              variant="secondary"
              fullWidth
              onClick={handlePurchase}
            />
            <ul className={styles.benefits}>
              {course.benefits.map((benefit) => (
                <li key={benefit}>
                  <Check size={14} aria-hidden="true" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
};
