import { useNavigate, useParams } from 'react-router-dom';
import { Download, Share2 } from 'lucide-react';
import { Button, CourseCard, EmptyState, Toast } from '@components/ui';
import {
  AuthenticatedLayout,
  Navbar,
  SIDEBAR_MENU_PRESETS,
  SIDEBAR_ROLE_LABELS,
} from '@components/layout';
import { AboutUser } from '@components/course/AboutUser/AboutUser';
import { useCertificate } from '@hooks/useCertificate';
import { useToast } from '@hooks/useToast';
import { getCertificateDownloadUrl } from '@services/certificateService';
import { formatCurrency, formatLongDate, formatWorkload } from '@utils/formatters';
import { mapCourseCategory, mapCourseLevel } from '@utils/mapPublicCourse';
import { CertificateCard } from './components/CertificateCard/CertificateCard';
import styles from './DigitalCertificate.module.css';

/**
 * Tela de visualização do certificado digital do aluno (US-18 + integração
 * #100). Quem vê Sidebar/Navbar autenticada e os botões de Baixar/Compartilhar
 * é decidido pelo `isOwner` devolvido pela API, não por uma prop externa: sem
 * autenticação real ainda, o backend fixa `isOwner: false`, então em produção
 * a tela sempre renderiza a versão pública até o login ser implementado.
 */
export const DigitalCertificate = () => {
  const { verificationCode } = useParams();
  const navigate = useNavigate();
  const { certificate, status, errorMessage } = useCertificate(verificationCode);
  const { toast, isOpen, showToast, dismissToast } = useToast();

  const handleDownload = () => {
    if (!certificate) return;
    window.open(getCertificateDownloadUrl(certificate.certificate.verificationCode), '_blank');
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast(
        'success',
        'Link copiado',
        'O link de verificação foi copiado para a área de transferência.',
      );
    } catch {
      showToast(
        'error',
        'Não foi possível copiar o link',
        'Copie o endereço da página manualmente.',
      );
    }
  };

  const content = (
    <div className={styles.page}>
      {status === 'loading' && (
        <p className={styles.loading} role="status">
          Carregando certificado...
        </p>
      )}

      {status === 'error' && (
        <EmptyState
          title="Não foi possível carregar o certificado"
          description={
            errorMessage ?? 'Verifique o código informado e tente novamente em alguns instantes.'
          }
        />
      )}

      {status === 'success' && certificate && (
        <div className={styles.layout}>
          <div className={styles.mainColumn}>
            <CertificateCard
              studentName={certificate.student.name}
              courseTitle={certificate.course.title}
              workload={formatWorkload(certificate.certificate.workload)}
              conclusionDate={formatLongDate(certificate.certificate.conclusionDate)}
              verificationCode={certificate.certificate.verificationCode}
            />

            <p className={styles.disclaimer}>
              O certificado acima atesta que {certificate.student.name} concluiu com êxito o curso{' '}
              {certificate.course.title} em {formatLongDate(certificate.certificate.conclusionDate)}
              . O certificado indica que todo o curso foi concluído pelo aluno. A duração do curso
              representa a duração total dos vídeos e aulas em texto no curso no momento da
              conclusão.
            </p>
          </div>

          <aside className={styles.sidebar}>
            <AboutUser
              name={certificate.student.name}
              avatarUrl={certificate.student.avatarUrl ?? undefined}
              conclusionDate={formatLongDate(certificate.certificate.conclusionDate)}
              workload={formatWorkload(certificate.certificate.workload)}
              course={certificate.course.title}
              isVerified={certificate.student.isVerified}
            />

            <div className={styles.courseSummary}>
              <h2 className={styles.courseSummaryTitle}>Sobre o curso</h2>
              <CourseCard
                id={certificate.course.id}
                imageUrl={certificate.course.thumbnailUrl ?? ''}
                category={mapCourseCategory(certificate.course.category)}
                level={mapCourseLevel(certificate.course.level)}
                title={certificate.course.title}
                description={certificate.course.description}
                rating={certificate.course.rating ?? undefined}
                reviewsCount={certificate.course.reviewsCount}
                duration={formatWorkload(certificate.course.durationTime)}
                lessonsCount={certificate.course.lessonsCount}
                instructor={certificate.course.instructor}
                price={formatCurrency(certificate.course.price)}
                onClick={(id) => navigate(`/cursos/${id}`)}
              />
            </div>

            {certificate.isOwner && (
              <div className={styles.actions}>
                <Button
                  label="Baixar"
                  variant="primary"
                  icon={<Download size={18} />}
                  onClick={handleDownload}
                />
                <Button
                  label="Compartilhar"
                  variant="primary"
                  icon={<Share2 size={18} />}
                  onClick={handleShare}
                />
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );

  if (certificate && certificate.isOwner) {
    return (
      <AuthenticatedLayout
        role="student"
        user={{
          name: certificate.student.name,
          role: SIDEBAR_ROLE_LABELS.student,
          avatarUrl: certificate.student.avatarUrl ?? undefined,
        }}
        items={SIDEBAR_MENU_PRESETS.student.map((item) => ({ ...item, active: false }))}
        notificationsCount={0}
      >
        {content}
        {toast && (
          <Toast
            key={toast.key}
            open={isOpen}
            onOpenChange={(open) => {
              if (!open) dismissToast();
            }}
            title={toast.title}
            description={toast.description}
            variant={toast.variant}
          />
        )}
      </AuthenticatedLayout>
    );
  }

  return (
    <div className={styles.publicShell}>
      <Navbar state="noAuth" />
      <main>{content}</main>
    </div>
  );
};
