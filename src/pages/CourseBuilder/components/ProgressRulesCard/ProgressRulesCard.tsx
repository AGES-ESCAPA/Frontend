import { memo } from 'react';
import { ListChecks } from 'lucide-react';
import { Checkbox, Panel } from '@components/ui';
import type { CourseProgressRules } from '@/types/course';
import styles from './ProgressRulesCard.module.css';

export interface ProgressRulesCardProps {
  rules: CourseProgressRules;
  disabled?: boolean;
  onChange: (field: keyof CourseProgressRules, value: boolean) => void;
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
  </Panel>
);

export const ProgressRulesCard = memo(ProgressRulesCardBase);
