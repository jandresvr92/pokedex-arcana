'use client';

import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  total: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
  locale: 'en' | 'es';
}

export function Pagination({
  currentPage,
  total,
  pageSize,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
  locale,
}: PaginationProps) {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Info */}
      <p className="font-mono text-sm text-arc-muted order-2 sm:order-1">
        {locale === 'es'
          ? `Mostrando ${start}–${end} de ${total.toLocaleString('es-ES')} Pokémon`
          : `Showing ${start}–${end} of ${total.toLocaleString('en-US')} Pokémon`}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-3 order-1 sm:order-2">
        <PagButton onClick={onPrev} disabled={!hasPrev}>
          ← {locale === 'es' ? 'Anterior' : 'Prev'}
        </PagButton>

        <span className="neo-inset rounded-lg px-4 py-2 font-mono text-sm">
          {currentPage} / {totalPages}
        </span>

        <PagButton onClick={onNext} disabled={!hasNext}>
          {locale === 'es' ? 'Siguiente' : 'Next'} →
        </PagButton>
      </div>
    </div>
  );
}

function PagButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'neo-sm rounded-xl px-4 py-2 font-body text-sm',
        'transition-all duration-150',
        'hover:shadow-none active:shadow-[inset_2px_2px_5px_#C4C0BA,inset_-2px_-2px_5px_#FFFFFF]',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-[3px_3px_7px_#C4C0BA,_-3px_-3px_7px_#FFFFFF]'
      )}
    >
      {children}
    </button>
  );
}
