import { NextRequest, NextResponse } from 'next/server';
import { searchPokemon } from '@/lib/pokeapi';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }
  try {
    const result = await searchPokemon(q.trim());
    return NextResponse.json({ results: result ? [result] : [] });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
