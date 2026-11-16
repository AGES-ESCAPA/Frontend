import { memo } from 'react';
import { Link2 } from 'lucide-react';
import { FormField, Panel, TextArea, TextInput } from '@components/ui';
import type { CourseFormField } from '@/types/course';
import { CoverImageField } from './CoverImageField';
import styles from './BasicInfoCard.module.css';

export interface BasicInfoCardProps {
  title: string;
  teaserVideoUrl: string;
  shortDescription: string;
  thumbnailUrl: string;
  titleError?: string;
  teaserVideoUrlError?: string;
  shortDescriptionError?: string;
  disabled?: boolean;
  onFieldChange: (field: CourseFormField, value: string) => void;
  onCoverUploadingChange: (uploading: boolean) => void;
}

const TITLE_ID = 'course-title';
const TEASER_ID = 'course-teaser-video-url';
const SHORT_DESCRIPTION_ID = 'course-short-description';

const BasicInfoCardBase = ({
  title,
  teaserVideoUrl,
  shortDescription,
  thumbnailUrl,
  titleError,
  teaserVideoUrlError,
  shortDescriptionError,
  disabled = false,
  onFieldChange,
  onCoverUploadingChange,
}: BasicInfoCardProps) => (
  <Panel className={styles.card}>
    <div className={styles.identityRow}>
      <div className={styles.details}>
        <FormField label="Título" htmlFor={TITLE_ID} required error={titleError}>
          <TextInput
            id={TITLE_ID}
            value={title}
            placeholder="Turismo em Tempos de Escapismo"
            maxLength={160}
            required
            disabled={disabled}
            invalid={titleError !== undefined}
            onChange={(event) => onFieldChange('title', event.target.value)}
          />
        </FormField>

        <FormField label="URL Vídeo Teaser" htmlFor={TEASER_ID} error={teaserVideoUrlError}>
          <TextInput
            id={TEASER_ID}
            type="url"
            value={teaserVideoUrl}
            placeholder="https://vimeo.com/..."
            icon={<Link2 size={18} />}
            disabled={disabled}
            invalid={teaserVideoUrlError !== undefined}
            onChange={(event) => onFieldChange('teaserVideoUrl', event.target.value)}
          />
        </FormField>
      </div>

      <CoverImageField
        thumbnailUrl={thumbnailUrl}
        disabled={disabled}
        onChange={(url) => onFieldChange('thumbnailUrl', url)}
        onUploadingChange={onCoverUploadingChange}
      />
    </div>

    <FormField
      label="Resumo Curto"
      htmlFor={SHORT_DESCRIPTION_ID}
      required
      error={shortDescriptionError}
    >
      <TextArea
        id={SHORT_DESCRIPTION_ID}
        value={shortDescription}
        rows={3}
        maxLength={280}
        disabled={disabled}
        invalid={shortDescriptionError !== undefined}
        onChange={(event) => onFieldChange('shortDescription', event.target.value)}
      />
    </FormField>
  </Panel>
);

export const BasicInfoCard = memo(BasicInfoCardBase);
