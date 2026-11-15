import { cloneElement } from 'react';
import type { ReactElement } from 'react';

/** O JSDOM não mede layout; mantém os gráficos reais com dimensões estáveis nos testes. */
export const FixedChartContainer = ({
  children,
}: {
  children: ReactElement<{ width?: number; height?: number }>;
}) => cloneElement(children, { width: 600, height: 320 });
