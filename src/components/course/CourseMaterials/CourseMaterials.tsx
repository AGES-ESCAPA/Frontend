import { Download, Paperclip } from 'lucide-react';
import { useRef, useState } from 'react';
import type { FC } from 'react';
import { Toast } from '@components/ui/Toast/Toast';
import { useToast } from '@hooks/useToast';
import { downloadMaterial } from '@services/MaterialsService';
import type { CourseMaterial } from '@/types/course';
import styles from './CourseMaterials.module.css';

export interface CourseMaterialsProps {
  materials: CourseMaterial[];
  isDownloadable?: boolean;
}

const materialLabel = (material: CourseMaterial): string =>
  material.format ? `${material.title} (${material.format})` : material.title;

/** Extrai um nome de arquivo por meio da URL do material. */
const materialFileName = (material: CourseMaterial): string => {
  const lastSegment = material.fileUrl.split('/').pop();
  return lastSegment && lastSegment.trim() !== '' ? lastSegment : materialLabel(material);
};

export const CourseMaterials: FC<CourseMaterialsProps> = ({
  materials,
  isDownloadable = false,
}) => {
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
  const { toast, isOpen, showToast, dismissToast } = useToast();

  const handleDownload = async (material: CourseMaterial) => {
    setDownloadingUrl(material.fileUrl);

    try {
      const objectUrl = await downloadMaterial(material.fileUrl);
      const anchor = anchorRef.current;

      if (anchor) {
        anchor.href = objectUrl;
        anchor.download = materialFileName(material);
        anchor.click();
      }

      URL.revokeObjectURL(objectUrl);
    } catch {
      showToast(
        'error',
        'Não foi possível baixar o arquivo',
        `Ocorreu um erro ao baixar "${materialLabel(material)}". Tente novamente.`,
      );
    } finally {
      setDownloadingUrl(null);
    }
  };

  return (
    <section className={styles.section} aria-labelledby="materials-title">
      <div className={styles.card}>
        <h2 id="materials-title">Materiais Inclusos</h2>
        <ul className={styles.list}>
          {materials.map((material) => {
            const label = materialLabel(material);
            const isDownloadingThis = downloadingUrl === material.fileUrl;

            return (
              <li className={styles.item} key={`${material.title}-${material.fileUrl}`}>
                <Paperclip size={18} aria-hidden="true" />
                <span className={styles.title}>{label}</span>
                {isDownloadable ? (
                  <button
                    type="button"
                    className={styles.downloadButton}
                    onClick={() => handleDownload(material)}
                    disabled={isDownloadingThis}
                    aria-label={`Baixar ${label}`}
                  >
                    <Download size={18} aria-hidden="true" />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      {isDownloadable ? (
        <>
          {/* Âncora oculta usada apenas para disparar o download do blob obtido no service. */}
          <a ref={anchorRef} className={styles.hiddenAnchor} hidden>
            download
          </a>

          {toast ? (
            <Toast
              key={toast.key}
              open={isOpen}
              variant={toast.variant}
              title={toast.title}
              description={toast.description}
              onOpenChange={(open) => {
                if (!open) dismissToast();
              }}
            />
          ) : null}
        </>
      ) : null}
    </section>
  );
};
