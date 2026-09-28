import { useNavigate, useParams } from 'react-router-dom';
import { Download, Share2 } from 'lucide-react';
import { Button, CourseCard, EmptyState, Toast } from '@components/ui';
import { AuthenticatedLayout, Navbar, SIDEBAR_MENU_PRESETS } from '@components/layout';
import { AboutUser } from '@components/course/AboutUser/AboutUser';
import { useCertificate } from '@hooks/useCertificate';
import { useToast } from '@hooks/useToast';
import { getCertificateDownloadUrl } from '@services/certificateService';
import { CertificateCard } from './components/CertificateCard/CertificateCard';
import { MOCK_COURSE_SUMMARIES } from './mockCourseSummary';
import { mockCertificateUser } from './mockCertificateUser';
import styles from './DigitalCertificate.module.css';

export interface DigitalCertificateProps {
  /**
   * Sem sistema de login integrado ainda, quem acessa a tela decide isso
   * (US-18 pede a mesma tela nas duas variantes: logada e pública).
   */
  isAuthenticated?: boolean;
}

/** Tela de visualização do certificado digital do aluno (US-18). */
export const DigitalCertificate = ({ isAuthenticated = false }: DigitalCertificateProps) => {
  const { verificationCode } = useParams();
  const navigate = useNavigate();
  const { certificate, status, errorMessage } = useCertificate(verificationCode);
  const { toast, isOpen, showToast, dismissToast } = useToast();

  const handleDownload = () => {
    if (!certificate) return;
    window.open(getCertificateDownloadUrl(certificate.verificationCode), '_blank');
  };

  const handleShare = async () => {
    if (!certificate) return;

    // Sempre o link público de verificação: a URL atual pode ser a rota logada
    // (/aluno/certificado/...), que mostra sidebar e botões para quem recebe.
    const publicUrl = `${window.location.origin}/certificados/${certificate.verificationCode}`;

    try {
      await navigator.clipboard.writeText(publicUrl);
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

  const courseSummary = certificate ? MOCK_COURSE_SUMMARIES[certificate.course] : undefined;

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
            <CertificateCard certificate={certificate} />

            <p className={styles.disclaimer}>
              O certificado acima atesta que {certificate.student} concluiu com êxito o curso{' '}
              {certificate.course} em {certificate.conclusionDate}. O certificado indica que todo o
              curso foi concluído pelo aluno. A duração do curso representa a duração total dos
              vídeos e aulas em texto no curso no momento da conclusão.
            </p>
          </div>

          <aside className={styles.sidebar}>
            <AboutUser
              name={certificate.student}
              conclusionDate={certificate.conclusionDate}
              workload={certificate.workload}
              course={certificate.course}
            />

            {courseSummary && (
              <div className={styles.courseSummary}>
                <h2 className={styles.courseSummaryTitle}>Sobre o curso:</h2>
                <CourseCard {...courseSummary} onClick={(id) => navigate(`/cursos/${id}`)} />
              </div>
            )}

            {isAuthenticated && (
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

  if (isAuthenticated) {
    return (
      <AuthenticatedLayout
        role="student"
        user={mockCertificateUser}
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
