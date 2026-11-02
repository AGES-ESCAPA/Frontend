import { Badge, Button } from '@components/ui';
import { Book, Check, Clock3, GraduationCap, Users } from 'lucide-react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOptionalAuth } from '@contexts/useAuth';
import { useCourseOwnership } from '@hooks/useCourseOwnership';
import type { CourseModule, CourseSummary } from '@/types/course';
import { authPath } from '@utils/authReturnTo';
import { getCourseAccessPath } from '@utils/courseAccess';
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
  const auth = useOptionalAuth();
  const lessons = listLessons(course.modules);
  const freeLessonCount = lessons.filter((lesson) => lesson.isFree).length;
  const isFreeOnly = lessons.length > 0 && freeLessonCount === lessons.length;

  const isAuthenticated = auth?.isAuthenticated ?? Boolean(localStorage.getItem('access_token'));
  const isLearner = auth?.user?.role === 'STUDENT' || auth?.user?.role === 'EMPLOYEE';
  // Aluno que já tem o curso entra nele, em vez de ver a oferta de compra de novo.
  const ownership = useCourseOwnership(course.id, isLearner && !isFreeOnly);
  const isOwned = ownership.owned;
  const isCheckingOwnership = ownership.status === 'loading';

  const handleAccess = async () => {
    navigate(await getCourseAccessPath(course.id));
  };

  // Quem ainda não tem conta vai para o cadastro e volta direto ao checkout.
  const handlePurchase = () => {
    const checkoutPath = `/checkout/${course.id}`;

    if (!isAuthenticated) {
      localStorage.setItem(PURCHASE_REDIRECT_KEY, checkoutPath);
      navigate(authPath('/cadastro', checkoutPath), { state: { returnTo: checkoutPath } });
      return;
    }

    navigate(checkoutPath);
  };

  const handleCta = () => {
    if (isFreeOnly) {
      onViewFreeLessons?.();
      return;
    }

    if (isOwned) {
      void handleAccess();
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
          aria-label={isFreeOnly ? 'Aulas grátis' : isOwned ? 'Acessar curso' : 'Comprar curso'}
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
                isFreeOnly
                  ? `Ver aulas grátis (${freeLessonCount})`
                  : isOwned
                    ? 'Acessar curso'
                    : isAuthenticated
                      ? 'Comprar curso'
                      : 'Cadastre-se para Comprar'
              }
              variant="primary"
              fullWidth
              disabled={isCheckingOwnership}
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
