import styles from './CourseCard.module.css';

export const CourseCardSkeleton = () => {
  return (
    <div className={`${styles.card} ${styles.skeleton}`} aria-hidden="true">
      <div className={styles.imageWrapper}>
        <span className={`${styles.bone} ${styles.imageBone}`} />
      </div>
      <div className={styles.content}>
        <span className={`${styles.bone} ${styles.titleBone}`} />
        <span className={`${styles.bone} ${styles.lineBone}`} />
        <span className={`${styles.bone} ${styles.lineBoneShort}`} />
        <div className={styles.meta}>
          <span className={`${styles.bone} ${styles.metaBone}`} />
        </div>
        <div className={styles.footer}>
          <span className={`${styles.bone} ${styles.footerBone}`} />
          <span className={`${styles.bone} ${styles.footerBone}`} />
        </div>
      </div>
    </div>
  );
};
