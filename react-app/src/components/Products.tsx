import { RevealSection, MotionButton } from './Interactions';
import { useState, type CSSProperties } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import { asset, searchCatalogue } from '../data/service';
import { getRoomRenderPlan } from '../data/rendering';
import type { Product } from '../data/types';
import { Icon } from './Icon';
import { SiteLink } from './Navigation';
import ProductAccordion from './ProductAccordion';
import { toast } from 'sonner';

import { focusStyle, SaveButton, ProductCard, filters, ProductCollection } from '../pages/Home';
export { focusStyle, SaveButton, ProductCard, filters, ProductCollection };
export function ProductDetails({ id }: { id: string }) {
  const { content, products, openProduct, openEnquiry, openTry } = useApp();
  const p = products[id];
  const roomImage = p.category === 'carpets' ? `room-${p.id}.webp` : (content.rooms[p.scene]?.image ?? p.image);
  const gallery = p.galleryImages && p.galleryImages.length > 0 ? p.galleryImages : [
    { src: p.image, label: 'Studio portrait', alt: `${p.name} studio portrait` },
    { src: roomImage, label: 'Room context', alt: `${p.name} in room context` },
  ];
  const [galleryIndex, setGalleryIndex] = useState(0);
  const activeImage = gallery[galleryIndex] ?? gallery[0];
  const related = (p.relatedIds ?? []).map(relId => products[relId]).filter(Boolean);

  return <>
    <div className="drawer-image">
      <img src={asset(activeImage.src)} alt={activeImage.alt} style={galleryIndex === 0 ? focusStyle(p) : undefined} />
    </div>
    <div className="product-gallery-thumbnails" role="group" aria-label="Product photography angles">
      {gallery.map((img, i) => (
        <button
          key={img.src + i}
          type="button"
          className={`gallery-thumb-btn${galleryIndex === i ? ' active' : ''}`}
          aria-pressed={galleryIndex === i}
          onClick={() => setGalleryIndex(i)}
          aria-label={img.label}
        >
          <img src={asset(img.src)} alt="" />
          <span>{img.label}</span>
        </button>
      ))}
    </div>

    <div className="product-title-row">
      <h2 id="drawerTitle">{p.name}</h2>
      {p.availability && <span className="product-availability-tag">● {p.availability.split('·')[0].trim()}</span>}
    </div>
    <p>{p.text}</p>

    {p.dimensions && (
      <div className="product-quick-specs" aria-label="Key dimensions">
        <div><span>Width</span><strong>{p.dimensions.width}</strong></div>
        <div><span>Depth</span><strong>{p.dimensions.depth}</strong></div>
        <div><span>Height</span><strong>{p.dimensions.height}</strong></div>
        {p.dimensions.seatHeight && <div><span>Seat</span><strong>{p.dimensions.seatHeight}</strong></div>}
        {p.dimensions.weight && <div><span>Weight</span><strong>{p.dimensions.weight}</strong></div>}
      </div>
    )}

    <dl className="detail-specs">
      <div><dt>PALETTE</dt><dd>{p.palette}</dd></div>
      <div><dt>COLLECTION</dt><dd>{p.type}</dd></div>
    </dl>

    <ProductAccordion
      details={[
        {
          id: "materials",
          title: "Materials & finish",
          content: (
            <div>
              <p><strong>Finish &amp; palette:</strong> {p.finishDetails ?? p.palette}</p>
              {p.materialsList && (
                <ul>
                  {p.materialsList.map((item, idx) => <li key={idx}>{item}</li>)}
                </ul>
              )}
              <p className="fineprint">Illustrative palette: {p.palette}. Final materials and finishes will be confirmed with Chandani.</p>
            </div>
          ),
        },
        {
          id: "dimensions",
          title: "Dimensions & scale",
          content: p.dimensions ? (
            <div>
              <table>
                <tbody>
                  <tr><th>Width</th><td>{p.dimensions.width}</td></tr>
                  <tr><th>Depth</th><td>{p.dimensions.depth}</td></tr>
                  <tr><th>Height</th><td>{p.dimensions.height}</td></tr>
                  {p.dimensions.seatHeight && <tr><th>Seat Height</th><td>{p.dimensions.seatHeight}</td></tr>}
                  {p.dimensions.clearance && <tr><th>Clearance</th><td>{p.dimensions.clearance}</td></tr>}
                  {p.dimensions.weight && <tr><th>Weight</th><td>{p.dimensions.weight}</td></tr>}
                </tbody>
              </table>
              <p className="fineprint">Exact dimensions will be confirmed with Chandani. Include your room measurements in the enquiry.</p>
            </div>
          ) : (
            <p>Exact dimensions will be confirmed with Chandani. Include your room measurements in the enquiry.</p>
          ),
        },
        {
          id: "care",
          title: "Care instructions",
          content: p.careInstructions ? (
            <ul>
              {p.careInstructions.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          ) : (
            <p>Ask Chandani for care guidance for the confirmed material and finish.</p>
          ),
        },
        {
          id: "availability",
          title: "Availability & lead time",
          content: (
            <div>
              <p><strong>Timeline:</strong> {p.availability ?? 'Made to order in Kathmandu · 3–5 weeks'}</p>
              <p>Joinery pieces and custom upholstery are made to order in our Kathmandu Valley workshop, with select pieces available for immediate inspection and delivery from our showroom floor.</p>
              <p className="fineprint">Custom sizing, finish adjustments, and fabric selections are confirmed directly with your design advisor before production.</p>
            </div>
          ),
        },
        {
          id: "delivery",
          title: "Delivery & room placement",
          content: (
            <div>
              <p><strong>Delivery service:</strong> {p.deliveryInfo ?? 'Direct delivery and placement in Kathmandu Valley'}</p>
              <ul>
                <li>Scheduled delivery window with dedicated team</li>
                <li>Careful placement inside your room of choice</li>
                <li>Assembly, unboxing, leveling, and hardware checks</li>
                <li>Outside Kathmandu Valley delivery coordinated with insured transport partners</li>
              </ul>
            </div>
          ),
        },
      ]}
    />

    <MotionButton className="button" onClick={() => openEnquiry(p.name)}>Enquire about this piece <Icon /></MotionButton>
    <SaveButton id={id} />
    {p.category === 'carpets' ? (
      <SiteLink className="text-link" to={`/carpet-studio?rug=${p.id}`}>Compare it in the carpet studio <Icon /></SiteLink>
    ) : (
      <SiteLink className="text-link" to={`/?room=${p.scene}&piece=${p.id}#home-room`}>Explore the room inspiration <Icon /></SiteLink>
    )}
    <MotionButton className="button outline" onClick={() => openTry(p.id)} aria-haspopup="dialog">Try in the room <Icon /></MotionButton>

    <div className="product-drawer-perks" role="group" aria-label="Atelier services">
      <button
        type="button"
        className="quick-perk-chip"
        onClick={() => openEnquiry(p.name, 'swatch', `Requesting physical material and finish samples for ${p.name}.`)}
      >
        <span>Material &amp; Finish Samples</span>
      </button>
      <button
        type="button"
        className="quick-perk-chip"
        onClick={() => openEnquiry(p.name, 'trade', `Trade & designer enquiry for ${p.name}: requesting technical dimensions, finish options, and collaboration terms.`)}
      >
        <span>Architecture &amp; Interior Collaboration</span>
      </button>
    </div>

    {related.length > 0 && (
      <div className="product-related-section">
        <span className="eyebrow">COORDINATING PIECES</span>
        <div className="product-related-list">
          {related.map(rel => (
            <button
              key={rel.id}
              type="button"
              className="product-related-card"
              onClick={() => openProduct(rel.id)}
              aria-label={`View ${rel.name}`}
            >
              <img src={asset(rel.image)} alt={rel.name} loading="lazy" />
              <div>
                <strong>{rel.name}</strong>
                <small>{rel.palette}</small>
              </div>
            </button>
          ))}
        </div>
      </div>
    )}

    <p className="fineprint">Illustrative design concept. Final products, dimensions, materials and pricing will be confirmed with Chandani.</p>
  </>;
}
export function Shortlist() {
  const { saved, products, openProduct, toggleSave, openEnquiry, savedConfiguration, openTry } = useApp();
  const [removedId, setRemovedId] = useState<string | null>(null);

  function handleRemoveFromShortlist(productId: string) {
    toggleSave(productId);
    setRemovedId(productId);
  }

  function handleShareShortlist() {
    const shareUrl = `${window.location.origin}${window.location.pathname}?saved=${saved.join(',')}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success('Shortlist link copied to clipboard', {
          description: `${saved.length} pieces included in share link.`
        });
      }).catch(() => {
        toast.info(`Share link: ${shareUrl}`);
      });
    } else {
      toast.info(`Share link: ${shareUrl}`);
    }
  }

  function handleClearAll() {
    const previousSaved = [...saved];
    previousSaved.forEach(id => toggleSave(id));
    toast('Shortlist cleared', {
      action: {
        label: 'Undo',
        onClick: () => {
          previousSaved.forEach(id => {
            toggleSave(id);
          });
        }
      }
    });
  }

  return <><h2 id="drawerTitle">Your shortlist.</h2><p>Bring your favourite pieces together.</p>
    {removedId && <div className="shortlist-undo"><span role="status">{products[removedId].name} removed from shortlist.</span><button type="button" className="text-link" onClick={() => {
      if (!saved.includes(removedId)) toggleSave(removedId);
      setRemovedId(null);
    }}>Undo removal</button></div>}
    {saved.length ? <>
      <div className="shortlist-meta-bar">
        <span className="shortlist-count-badge">
          {saved.length} {saved.length === 1 ? 'curated piece' : 'curated pieces'}
        </span>
        <span className="shortlist-readiness-pill">● Consultation ready</span>
      </div>
      {saved.map(id => { const p = products[id]; return <article className="shortlist-row" key={id}>
        <button onClick={() => openProduct(id)} aria-label={`View ${p.name}`}><img src={asset(p.image)} style={focusStyle(p)} alt={p.name} /></button>
        <button onClick={() => openProduct(id)}><strong>{p.name}</strong><small>{p.type}</small></button>
        <button className="remove" onClick={() => handleRemoveFromShortlist(id)} aria-label={`Remove ${p.name}`}>×</button>
      </article>; })}
      <button className="button" onClick={() => openEnquiry('My shortlist')}>Enquire about your selection <Icon /></button>
      <div className="shortlist-secondary-actions">
        <button type="button" className="button outline" onClick={handleShareShortlist}>
          Share shortlist link ↗
        </button>
        <button type="button" className="text-link shortlist-clear-btn" onClick={handleClearAll}>
          Clear all
        </button>
      </div>
      <p className="fineprint">Your selection is saved in this browser. Shareable link encodes your exact selection.</p>
    </> : <div className="empty-panel"><p>See something that feels like you? Save it with the bookmark beside each piece.</p><SiteLink className="button" to="/#collection">Explore the collection <Icon /></SiteLink></div>}
    {savedConfiguration && (
      <section className="shortlist-saved-scheme" aria-label="Saved room scheme">
        <div className="shortlist-scheme-header">
          <span className="eyebrow">SAVED ROOM SCHEME</span>
          <h3>Living room composition</h3>
        </div>
        <div className="shortlist-scheme-card">
          <img src={asset(getRoomRenderPlan(savedConfiguration, 'living').image)} alt="Saved living room composition" />
          <div className="shortlist-scheme-details">
            <p>Carpet: <strong>{savedConfiguration.rooms.living.carpet ?? 'Default'}</strong></p>
            <button type="button" className="button outline" onClick={() => openTry(undefined, 'living')}>Explore in room <Icon /></button>
          </div>
        </div>
      </section>
    )}
  </>;
}
export function Search() {
  const { content, openProduct, openEnquiry, closePanel } = useApp();
  const [query, setQuery] = useState('');
  const result = searchCatalogue(content.products, query);
  const suggestions = ['Sofa', 'Carpet', 'Dining table', 'Bed', 'Kitchen', 'Oak', 'Walnut', 'Bouclé'];

  return <><h2 id="drawerTitle">Find your starting point.</h2>
    <label className="search-field">
      <Icon name="search" />
      <input
        autoFocus
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); closePanel(); } }}
        placeholder="Try sofa, carpet, kitchen…"
        aria-label="Search products and kitchen design"
        autoComplete="off"
      />
      {query && (
        <button
          type="button"
          className="search-clear-btn"
          onClick={() => setQuery('')}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </label>
    <div className="search-suggestions" role="group" aria-label="Suggested searches">
      <span className="eyebrow">POPULAR SEARCHES</span>
      <div className="search-chip-group">
        {suggestions.map(item => (
          <button
            key={item}
            type="button"
            className={`search-chip${query.toLowerCase() === item.toLowerCase() ? ' active' : ''}`}
            onClick={() => setQuery(query.toLowerCase() === item.toLowerCase() ? '' : item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
    <div id="searchResults"><div className="search-count" role="status">{result.products.length + Number(result.kitchen)} results</div>
      {result.kitchen && <article className="search-row"><button onClick={() => openEnquiry('Kitchen design')} aria-label="Explore kitchen design"><img src={asset('kitchen.webp')} alt="Kitchen design" /></button><button onClick={() => openEnquiry('Kitchen design')}><strong>Kitchen design</strong><small>Start with your space</small></button><SiteLink className="icon-button" to="/?room=kitchen#home-room" aria-label="View kitchen concept"><Icon /></SiteLink></article>}
      {result.products.map(p => <article className="search-row" key={p.id}><button onClick={() => openProduct(p.id)} aria-label={`View ${p.name}`}><img src={asset(p.image)} style={focusStyle(p)} alt={p.name} /></button><button onClick={() => openProduct(p.id)}><strong>{p.name}</strong><small>{p.type}</small></button><button className="icon-button" onClick={() => openProduct(p.id)} aria-label={`View details of ${p.name}`}><Icon /></button></article>)}
      {!result.kitchen && !result.products.length && <p className="collection-empty">No matches yet. Try a broader term, such as sofa, bed or carpet.</p>}
    </div>
  </>;
}
