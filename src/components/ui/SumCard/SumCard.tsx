import { useId } from 'react';
import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import styles from './SumCard.module.css';

export interface SumCardTrend {
  /** Variação em pontos percentuais: `5.2` para +5,2%, `-3` para -3%. */
  value: number;
  /**
   * Texto ao lado da variação, como "vs último mês". O prefixo "vs" é lido por extenso como
   * "em relação ao" pelo leitor de tela, então use-o só com termos masculinos.
   */
  label: string;
}

export interface SumCardProps {
  /** Rótulo curto exibido acima do valor, em caixa alta. */
  label: string;
  /** Número ou texto de destaque do cartão. */
  value: ReactNode;
  /** Linha de apoio abaixo do valor. */
  description?: string;
  /** Variação do indicador em relação a um período anterior. */
  trend?: SumCardTrend;
  className?: string;
}

const describeTrendLabel = (label: string): string => label.replace(/^vs\.?\s+/i, 'em relação ao ');

const TrendIndicator = ({ value, label }: SumCardTrend) => {
  if (!Number.isFinite(value)) return null;

  // Arredonda antes de decidir o sentido: -0,04 aparece como 0%, então não pode ter seta.
  const rounded = Number(value.toFixed(1));
  const magnitude = Math.abs(rounded).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

  let visibleChange = `${magnitude}%`;
  let toneClass = styles.trendNeutral;
  let icon: ReactNode = null;
  let spokenChange = 'sem variação';

  if (rounded > 0) {
    visibleChange = `+${magnitude}%`;
    toneClass = styles.trendPositive;
    icon = <ArrowUp size={14} />;
    spokenChange = `aumento de ${magnitude}%`;
  } else if (rounded < 0) {
    visibleChange = `-${magnitude}%`;
    toneClass = styles.trendNegative;
    icon = <ArrowDown size={14} />;
    spokenChange = `queda de ${magnitude}%`;
  }

  return (
    <p className={styles.trend}>
      <span className={styles.trendVisual} aria-hidden="true">
        <span className={`${styles.trendChange} ${toneClass}`}>
          {icon}
          <span>{visibleChange}</span>
        </span>
        <span>{label}</span>
      </span>
      <span className={styles.srOnly}>{`${spokenChange} ${describeTrendLabel(label)}`}</span>
    </p>
  );
};

export const SumCard = ({ label, value, description, trend, className = '' }: SumCardProps) => {
  const headingId = useId();
  // Conteúdo em bloco, como um gráfico, não pode ficar dentro de <p>.
  const ValueTag = typeof value === 'string' || typeof value === 'number' ? 'p' : 'div';

  return (
    <article className={`${styles.card} ${className}`.trim()} aria-labelledby={headingId}>
      <p className={styles.label} id={headingId}>
        {label}
      </p>
      <ValueTag className={styles.value}>{value}</ValueTag>
      {trend === undefined ? null : <TrendIndicator value={trend.value} label={trend.label} />}
      {description === undefined ? null : <p className={styles.description}>{description}</p>}
    </article>
  );
};
