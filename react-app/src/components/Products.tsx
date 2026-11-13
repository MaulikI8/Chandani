import { RevealSection, MotionButton } from './Interactions';
import { useState, type CSSProperties } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import { asset, searchCatalogue } from '../data/service';
import { getRoomRenderPlan } from '../data/rendering';
import type { Product } from '../data/types';
import { Icon } from './Icon';
import { SiteLink } from './Navigation';
import { cfiProducts, rangeLabels } from '../data/cfiCatalogue';
import { toast } from 'sonner';

import { focusStyle, SaveButton, ProductCard, filters, ProductCollection } from '../pages/Home';
export { focusStyle, SaveButton, ProductCard, filters, ProductCollection };
export function ProductDetails({ id }: { id: string }) {
  const { products, openEnquiry, openTry } = useApp();
  const p = products[id];
  return <>
    <div className="drawer-image"><img src={asset(p.image)} alt={`${p.name}, illustrative room concept`} style={focusStyle(p)} /></div>
    <div className="product-title-row"><h2 id="drawerTitle">{p.name}</h2></div>
    <p>{p.text}</p>
    <dl className="detail-specs"><div><dt>PALETTE</dt><dd>{p.palette}</dd></div><div><dt>CONCEPT</dt><dd>{p.type}</dd></div></dl>
    <p className="fineprint">This is an illustrative room concept. Contact us to discuss actual products and available options.</p>
    <MotionButton className="button" onClick={() => openEnquiry(p.name)}>Enquire about this idea <Icon /></MotionButton>
    <SaveButton id={id} />
    <MotionButton className="button outline" onClick={() => openTry(p.id)} aria-haspopup="dialog">Try in the room <Icon /></MotionButton>
    <SiteLink className="text-link" to={`/product/${p.id}`}>Explore the concept <Icon /></SiteLink>
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
  const term = query.trim().toLocaleLowerCase();
  const cfiResults = cfiProducts.filter(p => !term || [p.name, ...p.ranges.map(r => rangeLabels[r])].join(' ').toLocaleLowerCase().includes(term));
  const suggestions = ['Mattress', 'PU Foam', 'EPE', 'Sofa', 'Carpet', 'Kitchen'];

  return <><h2 id="drawerTitle">Find your starting point.</h2>
    <label className="search-field">
      <Icon name="search" />
      <input
        autoFocus
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); closePanel(); } }}
        placeholder="Try mattress, foam, sofa…"
        aria-label="Search products and room ideas"
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
    <div id="searchResults"><div className="search-count" role="status">{cfiResults.length + result.products.length + Number(result.kitchen)} results</div>
      {cfiResults.map(p => <article className="search-row" key={`cfi-${p.id}`}><SiteLink to={`/catalogue/${p.id}`} aria-label={`View ${p.name}`}>{p.image ? <img src={asset(`cfi/${p.image}`)} alt="" /> : <span>CFI</span>}</SiteLink><SiteLink to={`/catalogue/${p.id}`}><strong>{p.name}</strong><small>{p.ranges.map(r => rangeLabels[r]).join(' · ')}</small></SiteLink><SiteLink className="icon-button" to={`/catalogue/${p.id}`} aria-label={`View details of ${p.name}`}><Icon /></SiteLink></article>)}
      {result.kitchen && <article className="search-row"><button onClick={() => openEnquiry('Kitchen design')} aria-label="Explore kitchen design"><img src={asset('kitchen.webp')} alt="Kitchen design" /></button><button onClick={() => openEnquiry('Kitchen design')}><strong>Kitchen design</strong><small>Start with your space</small></button><SiteLink className="icon-button" to="/?room=kitchen#home-room" aria-label="View kitchen concept"><Icon /></SiteLink></article>}
      {result.products.map(p => <article className="search-row" key={p.id}><button onClick={() => openProduct(p.id)} aria-label={`View ${p.name}`}><img src={asset(p.image)} style={focusStyle(p)} alt={p.name} /></button><button onClick={() => openProduct(p.id)}><strong>{p.name}</strong><small>{p.type}</small></button><button className="icon-button" onClick={() => openProduct(p.id)} aria-label={`View details of ${p.name}`}><Icon /></button></article>)}
      {!result.kitchen && !result.products.length && !cfiResults.length && <p className="collection-empty">No matches yet. Try mattress, foam, sofa or carpet.</p>}
    </div>
  </>;
}
