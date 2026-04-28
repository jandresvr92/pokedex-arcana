'use client';

import { useState, useCallback } from 'react';
import { Header } from './Header';
import { SearchBar } from '../pokemon/SearchBar';
import { PokemonGrid } from '../pokemon/PokemonGrid';
import { PokemonModal } from '../pokemon/PokemonModal';
import { Pagination } from '../ui/Pagination';
import { ChatBot } from '../chat/ChatBot';
import { Footer } from './Footer';
import type { PokemonCard } from '@/lib/types';

interface HomeClientProps {
  initialData: {
    cards: PokemonCard[];
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  initialPage: number;
  locale: 'en' | 'es';
}

export function HomeClient({ initialData, initialPage, locale }: HomeClientProps) {
  const [listData, setListData] = useState(initialData);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchResults, setSearchResults] = useState<PokemonCard[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Navigate to a page
  const goToPage = useCallback(async (page: number) => {
    setLoadingPage(true);
    try {
      const res = await fetch(`/api/pokemon?page=${page}`);
      const data = await res.json();
      setListData(data);
      setCurrentPage(page);
      setSearchResults(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoadingPage(false);
    }
  }, []);

  // Search handler
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/pokemon/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.results);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults(null);
  }, []);

  const displayedCards = searchResults ?? listData.cards;
  const isSearchMode = searchResults !== null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header locale={locale} />

      {/* Hero search section */}
      <section className="py-10 md:py-16 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-8">
          <p className="font-display italic text-arc-muted text-lg">
            {locale === 'es' ? 'Explora el universo Pokémon' : 'Explore the Pokémon universe'}
          </p>
        </div>
        <SearchBar
          onSearch={handleSearch}
          onClear={clearSearch}
          isSearching={isSearching}
          locale={locale}
        />
      </section>

      {/* Main content */}
      <main className="flex-1 px-4 pb-12 max-w-7xl mx-auto w-full">
        {/* Section label */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl text-arc-text/70">
            {isSearchMode
              ? (locale === 'es' ? 'Resultados' : 'Results')
              : (locale === 'es' ? 'Pokédex Nacional' : 'National Pokédex')}
          </h2>
          {!isSearchMode && (
            <span className="font-mono text-sm text-arc-muted">
              {listData.total.toLocaleString(locale === 'es' ? 'es-ES' : 'en-US')} {locale === 'es' ? 'Pokémon' : 'Pokémon'}
            </span>
          )}
        </div>

        {/* Grid */}
        <PokemonGrid
          cards={displayedCards}
          loading={loadingPage || isSearching}
          onSelect={(id) => setSelectedId(id)}
          locale={locale}
        />

        {/* Pagination (only when not in search mode) */}
        {!isSearchMode && (
          <div className="mt-10">
            <Pagination
              currentPage={currentPage}
              total={listData.total}
              pageSize={20}
              hasNext={listData.hasNext}
              hasPrev={listData.hasPrev}
              onNext={() => goToPage(currentPage + 1)}
              onPrev={() => goToPage(currentPage - 1)}
              locale={locale}
            />
          </div>
        )}
      </main>

      {/* Pokémon detail modal */}
      {selectedId !== null && (
        <PokemonModal
          pokemonId={selectedId}
          locale={locale}
          onClose={() => setSelectedId(null)}
        />
      )}

      {/* Floating chatbot */}
      <ChatBot locale={locale} />

      {/* Footer */}
      <Footer locale={locale} />
    </div>
  );
}
