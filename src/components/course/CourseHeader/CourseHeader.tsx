import { Badge, Button } from '@components/ui';
import { Book, Check, Clock3, GraduationCap, Users } from 'lucide-react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CourseModule, CourseSummary } from '@/types/course';
import { mapCourseCategory } from '@utils/mapPublicCourse';
import styles from './CourseHeader.module.css';

const PURCHASE_REDIRECT_KEY = 'escapa:purchase-redirect';

export interface CourseHeaderProps {
  course: CourseSummary;
  onViewFreeLessons?: () => void;
}

const listLessons = (modules: CourseModule[]) =>
  modules.flatMap((courseModule) => courseModule.lessons);

export const CourseHeader: FC<CourseHeaderProps> = ({ course, onViewFreeLessons }) => {
  const navigate = useNavigate();
  const lessons = listLessons(course.modules);
  const freeLessonCount = lessons.filter((lesson) => lesson.isFree).length;
  const isFreeOnly = lessons.length > 0 && freeLessonCount === lessons.length;

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

  const handleCta = () => {
    if (isFreeOnly) {
      onViewFreeLessons?.();
      return;
    }

    handlePurchase();
  };

  return (
    <section className={styles.header} aria-labelledby="course-title">
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.tags}>
            <Badge
              className={styles.headerBadge}
              label={course.category}
              category={mapCourseCategory(course.category)}
            />
            <Badge className={styles.headerBadge} label={course.level} variant="level" />
            <span className={styles.certificate}>
              <span aria-hidden="true">🏅</span>
              Certificado
            </span>
          </div>
          <h2 id="course-title">{course.title}</h2>
          <p className={styles.description}>{course.description}</p>
          <div className={styles.stats} aria-label="Informações do curso">
            <div className={styles.statsMeta}>
              <span>
                <Users size={14} aria-hidden="true" />{' '}
                {course.studentsCount.toLocaleString('pt-BR')} alunos
              </span>
              <span>
                <Clock3 size={14} aria-hidden="true" /> {course.durationHours}h
              </span>
              <span>
                <Book size={14} aria-hidden="true" />{' '}
                {course.modules.reduce((acc, module) => acc + module.lessonCount, 0)} aulas ·{' '}
                {course.modules.length} módulos
              </span>
            </div>
            <span className={styles.rating}>
              ★ {course.rating} ({course.reviewsCount} avaliações)
            </span>
          </div>
          <div className={styles.instructor}>
            <span className={styles.instructorAvatar}>
              {course.instructor.avatarUrl ? (
                <img src={course.instructor.avatarUrl} alt={`Foto de ${course.instructor.name}`} />
              ) : (
                <span aria-hidden="true">
                  {course.instructor.name.trim().charAt(0).toLocaleUpperCase('pt-BR')}
                </span>
              )}
            </span>
            <span>
              <strong>{course.instructor.name}</strong>
              <small>{course.instructor.role}</small>
            </span>
          </div>
        </div>

        <aside
          className={styles.purchase}
          aria-label={isFreeOnly ? 'Aulas grátis' : 'Comprar curso'}
        >
          {course.thumbnailUrl ? (
            <div className={styles.cover}>
              <img className={styles.coverImage} src={course.thumbnailUrl} alt="Capa do curso" />
            </div>
          ) : (
            <div className={styles.cover} aria-label="Imagem ilustrativa do curso" role="img">
              <GraduationCap size={56} aria-hidden="true" />
            </div>
          )}
          <div className={styles.purchaseBody}>
            <div className={styles.priceBlock}>
              <strong>{course.price}</strong>
              <small>{course.accessPeriod} · Certificado incluso</small>
            </div>
            <Button
              label={
                isFreeOnly ? `Ver aulas grátis (${freeLessonCount})` : 'Cadastre-se para Comprar'
              }
              variant="primary"
              fullWidth
              onClick={handleCta}
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
