import { useParams } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import { asset } from '../data/service';
import { SiteLink } from '../components/Navigation';
import { SaveButton, focusStyle } from '../components/Products';
import { Icon } from '../components/Icon';

export function ProductPage() {
  const { id } = useParams();
  const { products, openEnquiry, openTry } = useApp();
  const p = id ? products[id] : undefined;
  if (!p) return <section className="section"><h1>Concept not found.</h1><SiteLink className="button" to="/#collection">Explore the concepts <Icon /></SiteLink></section>;
  return <article className="product-page section">
    <nav className="product-breadcrumb" aria-label="Breadcrumb"><SiteLink to="/">Home</SiteLink><span aria-hidden="true">/</span><SiteLink to="/#collection">Room concepts</SiteLink><span aria-hidden="true">/</span><span aria-current="page">{p.name}</span></nav>
    <div className="product-hero-layout"><div className="product-gallery-stage"><div className="product-main-view"><img src={asset(p.image)} alt={`${p.name}, illustrative room concept`} style={focusStyle(p)} /></div></div><div className="product-primary-info"><span className="eyebrow">ILLUSTRATIVE {p.type.toUpperCase()} CONCEPT</span><h1>{p.name}</h1><p className="product-lead">{p.text}</p><dl className="detail-specs"><div><dt>PALETTE</dt><dd>{p.palette}</dd></div><div><dt>TYPE</dt><dd>{p.type}</dd></div></dl><div className="product-main-actions"><button type="button" className="button" onClick={() => openEnquiry(p.name)}>Enquire about this idea <Icon /></button><SaveButton id={p.id} className="button outline" /><button type="button" className="button outline" onClick={() => openTry(p.id)}>Try in the room <Icon /></button></div><p className="fineprint">This is a design concept. Contact us to discuss available products, dimensions and materials.</p></div></div>
  </article>;
}
