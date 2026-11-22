import { memo } from 'react';
import { ListChecks } from 'lucide-react';
import { Checkbox, Panel, TextInput } from '@components/ui';
import type { CourseProgressRules } from '@/types/course';
import styles from './ProgressRulesCard.module.css';

export interface ProgressRulesCardProps {
  rules: CourseProgressRules;
  disabled?: boolean;
  onChange: <K extends keyof CourseProgressRules>(field: K, value: CourseProgressRules[K]) => void;
}

const ProgressRulesCardBase = ({ rules, disabled = false, onChange }: ProgressRulesCardProps) => (
  <Panel title="Regras de Progresso" icon={<ListChecks size={22} />} className={styles.panel}>
    <div className={styles.rule}>
      <Checkbox
        label="Exigir conclusão do módulo anterior para liberar o próximo"
        hint="Garante que o aluno consuma o conteúdo de forma linear."
        checked={rules.requireSequentialProgress}
        disabled={disabled}
        onChange={(event) => onChange('requireSequentialProgress', event.target.checked)}
      />
    </div>

    <div className={styles.rule}>
      <Checkbox
        label="Bloquear acesso após expiração do prazo"
        hint="O aluno perderá o acesso ao curso X dias após a matrícula (configurado na aba Informações Básicas)."
        checked={rules.blockAccessAfterDeadline}
        disabled={disabled}
        onChange={(event) => onChange('blockAccessAfterDeadline', event.target.checked)}
      />
    </div>

    <div className={styles.rule}>
      <label className={styles.percentLabel} htmlFor="min-quiz-pass-percentage">
        Percentual mínimo de acerto para concluir o quiz
      </label>
      <p className={styles.percentHint}>
        Aulas do tipo quiz só são concluídas quando o aluno atinge este percentual.
      </p>
      <div className={styles.percentField}>
        <TextInput
          id="min-quiz-pass-percentage"
          type="number"
          min={0}
          max={100}
          step={1}
          disabled={disabled}
          value={rules.minQuizPassPercentage}
          onChange={(event) => {
            const next = Number(event.target.value);
            onChange(
              'minQuizPassPercentage',
              Number.isFinite(next) ? Math.min(100, Math.max(0, Math.round(next))) : 0,
            );
          }}
          rightAction={<span aria-hidden="true">%</span>}
        />
      </div>
    </div>
  </Panel>
);

export const ProgressRulesCard = memo(ProgressRulesCardBase);
