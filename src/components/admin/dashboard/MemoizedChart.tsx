'use client';

import { memo } from 'react';

interface MemoizedChartProps {
  children: React.ReactNode;
  data: unknown;
}

// Мемоизированный компонент для предотвращения ненужных ререндеров графиков
export default memo(function MemoizedChart({ children }: MemoizedChartProps) {
  return <>{children}</>;
}, (prevProps, nextProps) => {
  // Сравниваем данные для определения необходимости ререндера
  return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
});
