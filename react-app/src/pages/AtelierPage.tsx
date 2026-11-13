import { asset } from '../data/service';
import { business } from '../data/business';
import { useApp } from '../state/AppContext';
import { SiteLink } from '../components/Navigation';
import { Icon } from '../components/Icon';

export function AtelierPage() {
  const { openEnquiry } = useApp();
  return <article className="section cfi-about-page">
    <div className="section-heading"><div><span className="eyebrow">ABOUT THE COMPANY</span><h1>Comfort and protection,<br /><em>made in Nepal.</em></h1></div><p>{business.name} produces mattresses, PU foam and EPE products in eastern Nepal.</p></div>
    <div className="product-hero-layout"><div className="product-main-view"><img src={asset('cfi/pu-foam.webp')} alt="PU foam production" /></div><div className="product-primary-info"><span className="eyebrow">OUR FACTORY</span><h2>A foundation for everyday needs.</h2><p>From mattress comfort to protective foam, our range serves homes, furniture makers, hospitality and packaging applications.</p><p>The company’s facility is based in Sunsari, eastern Nepal.</p><SiteLink className="button" to="/#catalogue">Explore products <Icon /></SiteLink></div></div>
    <div className="contact section" style={{ paddingLeft: 0, paddingRight: 0 }}><div><span className="eyebrow">CONTACT</span><h2>Let’s work together.</h2></div><div><p>{business.address}<br /><a href={`tel:${business.phoneLink}`}>{business.phoneDisplay}</a><br /><a href={`mailto:${business.email}`}>{business.email}</a></p><button type="button" className="button" onClick={() => openEnquiry('Product enquiry')}>Start an enquiry <Icon /></button></div></div>
  </article>;
}
