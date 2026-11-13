import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { cfiProducts, filterCfiProducts, rangeLabels, type CfiProduct, type CfiRange } from '../data/cfiCatalogue';
import { business } from '../data/business';
import { asset } from '../data/service';
import { useApp } from '../state/AppContext';
import { Icon } from './Icon';
import { RevealSection } from './Interactions';
import { SiteLink } from './Navigation';
import './CfiCatalogue.css';

const ranges = Object.keys(rangeLabels) as CfiRange[];

function ProductImage({ product }: { product: CfiProduct }) {
  return product.image ? (
    <img src={asset(`cfi/${product.image}`)} alt={`${product.name} from the published catalogue`} loading="lazy" />
  ) : (
    <div className="cfi-image-placeholder" aria-label="Product image to be confirmed">
      <span>CHADHANI</span><small>Product image to be confirmed</small>
    </div>
  );
}

function CatalogueCard({ product }: { product: CfiProduct }) {
  return (
    <article className="product-card cfi-product-card">
      <SiteLink to={`/catalogue/${product.id}`} className="cfi-product-image" aria-label={`View ${product.name}`}>
        <ProductImage product={product} />
      </SiteLink>
      <div className="product-info">
        <div><h3><SiteLink to={`/catalogue/${product.id}`}>{product.name}</SiteLink></h3><p>{product.ranges.map(r => rangeLabels[r]).join(' · ')}</p></div>
        <SiteLink className="icon-button" to={`/catalogue/${product.id}`} aria-label={`View details of ${product.name}`}><Icon /></SiteLink>
      </div>
    </article>
  );
}

export function CfiCatalogue() {
  const location = useLocation();
  const { query } = useApp();
  const [search, setSearch] = useState('');
  const requested = new URLSearchParams(location.search).get('range');
  const range: CfiRange | 'all' = requested && ranges.includes(requested as CfiRange) ? requested as CfiRange : 'all';
  const products = filterCfiProducts(range, search);

  return (
    <RevealSection className="collection section cfi-catalogue" id="catalogue">
      <div className="section-heading">
        <div><span className="eyebrow">THE CFI PRODUCT RANGE</span><h2>Comfort, in every form.</h2></div>
        <p>Explore our mattress series, PU foam and EPE products. Contact us to discuss specifications and availability.</p>
      </div>
      <div className="cfi-search">
        <label htmlFor="cfi-search">Find a product</label>
        <input id="cfi-search" type="search" placeholder="Search mattresses or foam" value={search} onChange={event => setSearch(event.target.value)} />
      </div>
      <div className="collection-bar cfi-collection-bar">
        <div className="filters" role="group" aria-label="Filter products by series or foam type">
          <button type="button" aria-pressed={range === 'all'} onClick={() => query({ range: null })}>All products</button>
          {ranges.map(id => <button type="button" key={id} aria-pressed={range === id} onClick={() => query({ range: id })}>{rangeLabels[id]}</button>)}
        </div>
        <span aria-live="polite">{products.length} {products.length === 1 ? 'product' : 'products'}</span>
      </div>
      {products.length ? <div className="product-grid">{products.map(product => <CatalogueCard key={product.id} product={product} />)}</div> : (
        <div className="cfi-empty"><p>No products match this search.</p><button type="button" className="text-link" onClick={() => { setSearch(''); query({ range: null }); }}>Clear search and filters <Icon /></button></div>
      )}
    </RevealSection>
  );
}

export function CfiProductPage() {
  const { id } = useParams();
  const { openEnquiry } = useApp();
  const product = cfiProducts.find(item => item.id === id);
  if (!product) return <section className="section"><h1>Product not found.</h1><SiteLink className="button" to="/#catalogue">Explore products <Icon /></SiteLink></section>;
  const related = cfiProducts.filter(item => item.id !== product.id && item.ranges.some(range => product.ranges.includes(range))).slice(0, 3);
  return (
    <article className="product-page section cfi-detail">
      <nav className="product-breadcrumb" aria-label="Breadcrumb"><SiteLink to="/">Home</SiteLink><span aria-hidden="true">/</span><SiteLink to="/#catalogue">Products</SiteLink><span aria-hidden="true">/</span><span aria-current="page">{product.name}</span></nav>
      <div className="product-hero-layout">
        <div className="product-gallery-stage"><div className="product-main-view cfi-detail-image"><ProductImage product={product} /></div></div>
        <div className="product-primary-info">
          <span className="eyebrow">{product.ranges.map(r => rangeLabels[r]).join(' / ')}</span>
          <h1>{product.name}</h1>
          <p className="product-lead">{product.description}</p>
          <dl className="detail-specs"><div><dt>RANGE</dt><dd>{product.ranges.map(r => rangeLabels[r]).join(' · ')}</dd></div><div><dt>DETAILS</dt><dd>Contact us for sizes and specifications.</dd></div></dl>
          <div className="product-main-actions"><button type="button" className="button" onClick={() => openEnquiry(product.name)}>Enquire about this product <Icon /></button><a className="button outline" href={`tel:${business.phoneLink}`}>Call us</a></div>
          <p className="fineprint">Product availability and specifications are confirmed directly by the Chandani team.</p>
        </div>
      </div>
      {related.length > 0 && <RevealSection className="product-related-full section"><div className="section-heading"><div><span className="eyebrow">EXPLORE THE RANGE</span><h2>More to discover.</h2></div><SiteLink className="text-link" to="/#catalogue">All products <Icon /></SiteLink></div><div className="product-grid">{related.map(item => <CatalogueCard key={item.id} product={item} />)}</div></RevealSection>}
    </article>
  );
}
