import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Download, Share2 } from 'lucide-react';
import { Button, CourseCard, EmptyState, Toast } from '@components/ui';
import {
  AuthenticatedLayout,
  Navbar,
  SIDEBAR_MENU_PRESETS,
  SIDEBAR_ROLE_LABELS,
} from '@components/layout';
import type { SidebarRole } from '@components/layout';
import { AboutUser } from '@components/course/AboutUser/AboutUser';
import { useOptionalAuth } from '@contexts/useAuth';
import { useCertificate } from '@hooks/useCertificate';
import { useToast } from '@hooks/useToast';
import {
  CertificateDownloadError,
  buildFallbackFilename,
  downloadCertificatePdf,
} from '@services/certificateService';
import { formatCurrency, formatLongDate, formatWorkload } from '@utils/formatters';
import { mapCourseCategory, mapCourseLevel } from '@utils/mapPublicCourse';
import { getActiveTheme } from '@utils/theme';
import type { UserRole } from '@/types/auth';
import { CertificateCard } from './components/CertificateCard/CertificateCard';
import styles from './DigitalCertificate.module.css';

const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Faça login novamente.';

/** Com o corpo lido como PDF, o erro é decidido só pelo status HTTP. */
const getDownloadErrorMessage = (error: unknown): string => {
  const status = error instanceof CertificateDownloadError ? error.status : null;
  switch (status) {
    case 401:
      return SESSION_EXPIRED_MESSAGE;
    case 403:
      return 'Este certificado não pertence à sua conta.';
    case 404:
      return 'Certificado não encontrado ou curso ainda não concluído.';
    case 503:
      return 'Estamos gerando muitos certificados agora. Tente novamente em instantes.';
    default:
      return 'Não foi possível baixar o certificado. Tente novamente.';
  }
};

const getLayoutRole = (role: UserRole | undefined): SidebarRole => {
  if (role === 'ADMIN') return 'admin';
  if (role === 'COMPANY') return 'company';
  return 'student';
};

/**
 * Tela de visualização do certificado digital do aluno (US-18 + integração
 * #100). A consulta vai com o token da sessão. Qualquer usuário logado vê a
 * Sidebar/Navbar autenticada; só o dono (`isOwner` da API) vê os botões de
 * Baixar e Compartilhar. Visitantes veem apenas o certificado.
 */
export const DigitalCertificate = () => {
  const { verificationCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useOptionalAuth();
  const { certificate, status, errorMessage } = useCertificate(verificationCode);
  // `isOwner` vem da consulta feita com o token; se a sessão terminar com a tela
  // aberta (logout, expiração ou 401), a resposta antiga não vale mais.
  const isSessionActive = auth === null || auth.isRestoring || auth.isAuthenticated;
  const isOwner = Boolean(certificate?.isOwner) && isSessionActive;
  const showAuthenticatedLayout = isOwner || Boolean(auth?.isAuthenticated);
  const layoutRole = getLayoutRole(auth?.user?.role);
  const { toast, isOpen, showToast, dismissToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  // O `disabled` só vale após o re-render; o ref barra o segundo clique na hora.
  const downloadingRef = useRef(false);
  const downloadButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(false);

  // Desabilitar o botão tira o foco dele; devolve quando o download termina.
  useEffect(() => {
    if (isDownloading || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    downloadButtonRef.current?.focus();
  }, [isDownloading]);

  const handleDownload = async () => {
    if (!certificate || downloadingRef.current) return;
    downloadingRef.current = true;
    restoreFocusRef.current = document.activeElement === downloadButtonRef.current;
    setIsDownloading(true);

    try {
      await downloadCertificatePdf(
        certificate.certificate.verificationCode,
        getActiveTheme(),
        buildFallbackFilename(certificate.course.title),
      );
    } catch (error: unknown) {
      const message = getDownloadErrorMessage(error);
      if (error instanceof CertificateDownloadError && error.status === 401) {
        // A sessão já foi encerrada por `authenticatedFetch`; aqui só o caminho de volta.
        showToast('error', message, undefined, {
          label: 'Fazer login',
          onAction: () => navigate('/login', { state: { returnTo: location.pathname } }),
        });
      } else {
        showToast('error', message);
      }
    } finally {
      downloadingRef.current = false;
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!certificate) return;

    // Sempre o link público de verificação: a URL atual pode ser a rota logada
    // (/aluno/certificado/...), que mostra sidebar e botões para quem recebe.
    const publicUrl = `${window.location.origin}/certificados/${certificate.certificate.verificationCode}`;

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
              <h2 className={styles.courseSummaryTitle}>Sobre o curso:</h2>
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

            {isOwner && (
              <div className={styles.actions}>
                <Button
                  ref={downloadButtonRef}
                  label={isDownloading ? 'Baixando…' : 'Baixar'}
                  variant="primary"
                  icon={<Download size={18} />}
                  isLoading={isDownloading}
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

  const toastNode = toast && (
    <Toast
      key={toast.key}
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) dismissToast();
      }}
      title={toast.title}
      description={toast.description}
      actionLabel={toast.action?.label}
      onAction={toast.action?.onAction}
      variant={toast.variant}
    />
  );

  if (certificate && showAuthenticatedLayout) {
    return (
      // Sem sessão no contexto, o dono é o próprio aluno do certificado.
      <AuthenticatedLayout
        role={layoutRole}
        user={{
          name: certificate.student.name,
          role: SIDEBAR_ROLE_LABELS[layoutRole],
          avatarUrl: certificate.student.avatarUrl ?? undefined,
        }}
        items={SIDEBAR_MENU_PRESETS[layoutRole].map((item) => ({ ...item, active: false }))}
        notificationsCount={0}
      >
        {content}
        {toastNode}
      </AuthenticatedLayout>
    );
  }

  return (
    <div className={styles.publicShell}>
      <Navbar state="noAuth" />
      <main>{content}</main>
      {toastNode}
    </div>
  );
};
