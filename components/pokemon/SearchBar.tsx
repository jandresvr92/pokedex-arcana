'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  isSearching: boolean;
  locale: 'en' | 'es';
}

const PLACEHOLDER = {
  es: 'Buscar por nombre o número…',
  en: 'Search by name or number…',
};
const HINT = {
  es: 'Ej: Pikachu, Charizard, 25, 006',
  en: 'E.g: Pikachu, Charizard, 25, 006',
};

export function SearchBar({ onSearch, onClear, isSearching, locale }: SearchBarProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
    }
  };

  const handleClear = () => {
    setValue('');
    onClear();
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={cn(
            'neo rounded-2xl flex items-center gap-2 px-4 py-3',
            'transition-shadow duration-200',
            'focus-within:shadow-[4px_4px_10px_#C4C0BA,_-4px_-4px_10px_#FFFFFF]'
          )}
        >
          {/* Search icon */}
          <SearchIcon className="flex-shrink-0 w-5 h-5 text-arc-muted" />

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={PLACEHOLDER[locale]}
            className={cn(
              'flex-1 bg-transparent outline-none',
              'font-body text-arc-text placeholder:text-arc-muted/70',
              'text-base'
            )}
          />

          {/* Clear button */}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-arc-muted hover:text-arc-text transition-colors p-1"
              aria-label="Clear"
            >
              ✕
            </button>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSearching || !value.trim()}
            className={cn(
              'neo-sm rounded-xl px-4 py-1.5',
              'font-body text-sm font-medium text-arc-text',
              'transition-all duration-150',
              'hover:shadow-none active:shadow-[inset_2px_2px_5px_#C4C0BA,inset_-2px_-2px_5px_#FFFFFF]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'whitespace-nowrap'
            )}
          >
            {isSearching
              ? (locale === 'es' ? 'Buscando…' : 'Searching…')
              : (locale === 'es' ? 'Buscar' : 'Search')}
          </button>
        </div>
      </form>

      {/* Hint text */}
      <p className="text-center text-arc-muted text-xs mt-2 font-mono">
        {HINT[locale]}
      </p>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" d="m21 21-4.35-4.35" />
    </svg>
  );
}
