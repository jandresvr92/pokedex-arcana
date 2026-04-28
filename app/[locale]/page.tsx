import { getPokemonList } from '@/lib/pokeapi';
import { HomeClient } from '@/components/layout/HomeClient';

interface PageProps {
  params: { locale: string };
  searchParams: { page?: string; search?: string };
}

export default async function HomePage({ params, searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10));

  // Fetch initial list server-side for SSR
  const initialData = await getPokemonList(page);

  return (
    <HomeClient
      initialData={initialData}
      initialPage={page}
      locale={params.locale as 'en' | 'es'}
    />
  );
}
