interface FooterProps {
  locale: 'en' | 'es';
}

export function Footer({ locale }: FooterProps) {
  return (
    <footer className="border-t border-arc-border/60 py-6 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-arc-muted text-sm">
        <div className="flex items-center gap-2">
          <span>{locale === 'es' ? 'Datos de' : 'Data from'}</span>
          <a
            href="https://pokeapi.co"
            target="_blank"
            rel="noopener noreferrer"
            className="text-arc-accent hover:underline font-medium"
          >
            PokéAPI
          </a>
        </div>
        <p className="font-display italic text-xs text-center">
          {locale === 'es'
            ? 'Pokémon y sus nombres son marcas registradas de Nintendo.'
            : 'Pokémon and all related names are trademarks of Nintendo.'}
        </p>
      </div>
    </footer>
  );
}
