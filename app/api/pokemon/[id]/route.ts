import { NextRequest, NextResponse } from 'next/server';
import { getPokemonDetail } from '@/lib/pokeapi';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const locale = (req.nextUrl.searchParams.get('locale') ?? 'en') as 'en' | 'es';
  try {
    const detail = await getPokemonDetail(params.id, locale);
    if (!detail) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(detail);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch detail' }, { status: 500 });
  }
}
