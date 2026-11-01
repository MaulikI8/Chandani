export function Icon({ name = 'arrow' }: { name?: 'arrow' | 'save' | 'search' | 'close' | 'menu' | 'right' }) {
  return <svg className="icon" viewBox="0 0 18 18" aria-hidden="true">
    {name === 'search' && <circle cx="8" cy="8" r="5" />}
    <path d={{ arrow: 'M4 14 14 4M4 4h10v10', save: 'M5 3h8v12l-4-3-4 3z', search: 'm12 12 4 4',
      close: 'm4 4 10 10M14 4 4 14', menu: 'M2 5h14M2 12h14', right: 'M3 9h12M10 4l5 5-5 5' }[name]} />
  </svg>;
}
