import { NextRequest, NextResponse } from 'next/server';
import { getPokemonList } from '@/lib/pokeapi';

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10);
  try {
    const data = await getPokemonList(Math.max(1, page));
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch list' }, { status: 500 });
  }
}
