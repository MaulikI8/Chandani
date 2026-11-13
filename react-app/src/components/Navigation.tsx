import { Link, type LinkProps } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import { Icon } from './Icon';
import { business } from '../data/business';

export function SiteLink(props: LinkProps) {
  const { closePanel } = useApp();
  return <Link {...props} state={{ scrollHash: true }} onClick={event => {
    props.onClick?.(event);
    if (!event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) closePanel();
  }} />;
}
export function Brand() {
  return <SiteLink className="brand" to="/" aria-label="Chandani home">
    <svg className="mark" viewBox="0 0 30 30" aria-hidden="true"><path d="M25 5H5v20h20v-5M21 9H9v12h12v-5M17 13h-4v4h4M25 1v8M1 5h8M5 21v8M21 25h8" /></svg>
    <span>chandani<small>FOAM · HOME · INTERIORS</small></span>
  </SiteLink>;
}
export function Header() {
  const { saved, openPanel, openTry, tryEntry } = useApp();
  return <header className="header"><div className="header-inner">
    <Brand />
    <nav className="desktop-nav" aria-label="Main navigation">
      <SiteLink to="/#catalogue">Products</SiteLink>
      <SiteLink to="/#categories">Home &amp; interiors</SiteLink>
      <SiteLink to="/atelier">About</SiteLink>
      <SiteLink to="/#contact">Contact</SiteLink>
      <button className="nav-try-room" onClick={() => openTry()} aria-haspopup="dialog" aria-expanded={!!tryEntry}>Try the room</button>
    </nav>
    <div className="header-actions">
      <button className="icon-button" data-search="" onClick={() => openPanel('search')} aria-label="Search the collection"><Icon name="search" /></button>
      <button className="shortlist-button" onClick={() => openPanel('shortlist')} aria-label="Open shortlist"><Icon name="save" /><span className="shortlist-word">Shortlist</span><span data-count="">{saved.length}</span></button>
      <button className="icon-button mobile-menu" onClick={() => openPanel('menu')} aria-label="Open menu"><Icon name="menu" /></button>
    </div>
  </div></header>;
}
export function MobileNavigation() {
  const { openPanel, openTry, openEnquiry, tryEntry } = useApp();
  return <><h2 id="drawerTitle">Make yourself at home.</h2><nav className="mobile-nav" aria-label="Mobile navigation">
    <button className="mobile-try-room" onClick={() => openTry()} aria-haspopup="dialog" aria-expanded={!!tryEntry}>Try the room <Icon /></button>
    <SiteLink to="/#catalogue">Mattresses &amp; foam</SiteLink>
    <SiteLink to="/#categories">Furniture &amp; interiors</SiteLink>
    <SiteLink to="/#kitchens">Kitchen design</SiteLink>
    <SiteLink to="/?room=living#home-room">Explore the rooms</SiteLink>
    <button onClick={() => openPanel('search')}>Search the collection</button>
    <SiteLink to="/carpet-studio">Carpet studio</SiteLink>
    <SiteLink to="/atelier">About the company</SiteLink>
    <button onClick={() => openEnquiry('Whole home')}>Start a conversation</button>
  </nav>
  <div className="drawer-concierge-card">
    <span className="eyebrow">CONTACT CFI</span>
    <p className="concierge-loc">{business.address}</p>
    <p className="concierge-phone"><a href={`tel:${business.phoneLink}`}>{business.phoneDisplay}</a> · <a href={`mailto:${business.email}`}>{business.email}</a></p>
    <div className="drawer-concierge-actions">
      <button type="button" className="quick-perk-chip" onClick={() => openEnquiry('Trade Partnership', 'trade')}>
        Trade &amp; Designers
      </button>
      <button type="button" className="quick-perk-chip" onClick={() => openEnquiry('Foam products')}>
        Foam enquiries
      </button>
    </div>
  </div>
  </>;
}
export function Footer() {
  const { openEnquiry } = useApp();
  return <footer className="footer"><div className="footer-main">
    <div><Brand /><p>Mattresses, foam and ideas<br />for spaces of your own.</p></div>
    <nav aria-label="Collections"><span className="eyebrow">EXPLORE</span>
      <SiteLink to="/#catalogue">Mattresses &amp; foam</SiteLink><SiteLink to="/?range=comfort#catalogue">Comfort Series</SiteLink>
      <SiteLink to="/?range=premium#catalogue">Premium / Luxury Series</SiteLink><SiteLink to="/?range=epe-roll#catalogue">EPE rolls</SiteLink>
    </nav>
    <nav aria-label="Design services"><span className="eyebrow">YOUR SPACE</span>
      <SiteLink to="/#kitchens">Kitchen design</SiteLink><SiteLink to="/?room=living#home-room">Explore the rooms</SiteLink>
      <SiteLink to="/carpet-studio">Carpet comparison</SiteLink><button onClick={() => openEnquiry('Whole home')}>Start a conversation</button>
    </nav>
    <div className="footer-note"><span className="eyebrow">CONTACT</span><p>{business.address}<br /><a href={`tel:${business.phoneLink}`}>{business.phoneDisplay}</a><br /><a href={`mailto:${business.email}`}>{business.email}</a></p><p>Room scenes and furniture concepts are illustrative.</p></div>
  </div><div className="footer-bottom"><span>© 2026 {business.name}</span><span>Mattresses · Foam · Interiors</span><a href="#main">Back to top ↑</a></div></footer>;
}
