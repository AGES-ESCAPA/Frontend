import { memo } from 'react';
import { Link2 } from 'lucide-react';
import { FormField, Panel, TextArea, TextInput } from '@components/ui';
import type { CourseFormField } from '@/types/course';

export interface BasicInfoCardProps {
  title: string;
  teaserVideoUrl: string;
  shortDescription: string;
  titleError?: string;
  teaserVideoUrlError?: string;
  shortDescriptionError?: string;
  disabled?: boolean;
  onFieldChange: (field: CourseFormField, value: string) => void;
}

const TITLE_ID = 'course-title';
const TEASER_ID = 'course-teaser-video-url';
const SHORT_DESCRIPTION_ID = 'course-short-description';

const BasicInfoCardBase = ({
  title,
  teaserVideoUrl,
  shortDescription,
  titleError,
  teaserVideoUrlError,
  shortDescriptionError,
  disabled = false,
  onFieldChange,
}: BasicInfoCardProps) => (
  <Panel>
    <FormField label="Título" htmlFor={TITLE_ID} required error={titleError}>
      <TextInput
        id={TITLE_ID}
        value={title}
        placeholder="Fundamentos de Design de Interfaces Corporativas"
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
        placeholder="https://youtube.com/..."
        icon={<Link2 size={18} />}
        disabled={disabled}
        invalid={teaserVideoUrlError !== undefined}
        onChange={(event) => onFieldChange('teaserVideoUrl', event.target.value)}
      />
    </FormField>

    <FormField label="Resumo Curto" htmlFor={SHORT_DESCRIPTION_ID} error={shortDescriptionError}>
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
