import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Product } from '../data/types';
import { useApp } from '../state/AppContext';
import { asset } from '../data/service';
import { SiteLink } from '../components/Navigation';
import { SaveButton, focusStyle } from '../components/Products';
import { Icon } from '../components/Icon';
import { MotionButton, RevealSection } from '../components/Interactions';
import ProductAccordion from '../components/ProductAccordion';
import { toast } from 'sonner';

function RoomFitChecker({ dimensions }: { dimensions?: { width: string; depth: string; height: string } }) {
  const [roomW, setRoomW] = useState('4.5');
  const [roomL, setRoomL] = useState('5.0');
  if (!dimensions) return null;
  const pieceW = parseFloat(dimensions.width) / (dimensions.width.includes('cm') ? 100 : 1);
  const pieceD = parseFloat(dimensions.depth) / (dimensions.depth.includes('cm') ? 100 : 1);
  const rw = parseFloat(roomW) || 4.5;
  const rl = parseFloat(roomL) || 5.0;
  const roomArea = rw * rl;
  const pieceArea = pieceW * pieceD;
  const footprintPct = Math.min(100, Math.round((pieceArea / roomArea) * 100));
  const clearance = Math.max(0, (Math.min(rw, rl) - Math.max(pieceW, pieceD)) / 2).toFixed(1);
  const fitVerdict = parseFloat(clearance) >= 0.8
    ? { label: 'Generous fit', cls: 'fit-great', desc: 'Optimal circulation with > 80 cm side clearance.' }
    : parseFloat(clearance) >= 0.5
    ? { label: 'Balanced fit', cls: 'fit-good', desc: 'Comfortable proportions for standard spaces.' }
    : { label: 'Snug fit', cls: 'fit-snug', desc: 'Cozy scale; consider orientation against walls.' };

  return (
    <div className="room-fit-widget" aria-label="Room fit calculator">
      <div className="room-fit-header">
        <h4>Check Room Scale &amp; Fit</h4>
        <span className={`fit-pill ${fitVerdict.cls}`}>● {fitVerdict.label}</span>
      </div>
      <p className="room-fit-sub">Estimate how this piece will sit in your specific room:</p>
      <div className="room-fit-inputs">
        <label>
          <span>Width (m)</span>
          <input type="number" min="1.5" max="15" step="0.5" value={roomW} onChange={e => setRoomW(e.target.value)} />
        </label>
        <label>
          <span>Length (m)</span>
          <input type="number" min="1.5" max="15" step="0.5" value={roomL} onChange={e => setRoomL(e.target.value)} />
        </label>
      </div>
      <div className="room-fit-readout">
        <div><span>Room area:</span> <strong>{(rw * rl).toFixed(1)} m²</strong></div>
        <div><span>Footprint:</span> <strong>~{footprintPct}% of floor</strong></div>
        <div><span>Clearance:</span> <strong>~{clearance} m</strong></div>
      </div>
      <p className="room-fit-verdict">{fitVerdict.desc}</p>
    </div>
  );
}

function BespokeProjectEstimator({ product, onEnquire }: { product: Product; onEnquire: (scope: string, notes: string) => void }) {
  const [tier, setTier] = useState<'piece' | 'room' | 'residence'>('room');
  const [woodFinish, setWoodFinish] = useState<'standard' | 'custom'>('standard');

  const tiers = {
    piece: {
      title: 'Statement Piece',
      price: woodFinish === 'standard' ? 'रू 3,80,000 - रू 5,20,000' : 'रू 4,60,000 - रू 6,40,000',
      timeline: '4-6 weeks handcrafted',
      scopeDesc: `Handcrafted ${product.name} in ${product.palette}. Sized for your primary space.`,
      deliverables: [
        'Dedicated artisan workshop build & bench-made assembly',
        'Pre-scheduled 2-person white-glove delivery to room of choice',
        '10-year structural joinery & frame guarantee',
      ],
    },
    room: {
      title: 'Complete Room Curation',
      price: woodFinish === 'standard' ? 'रू 16,50,000 - रू 24,00,000' : 'रू 19,50,000 - रू 29,00,000',
      timeline: '6-8 weeks artisan curation',
      scopeDesc: `${product.name} + 2 coordinating accent pieces and a hand-tufted New Zealand wool carpet.`,
      deliverables: [
        'Complimentary in-home or virtual 3D room scale & lighting audit',
        'Curated acoustic palette coordination with textile swatch kit',
        'Consolidated white-glove delivery, room placement, and unboxing',
        'Priority workshop bench reservation with lead craftsman',
      ],
    },
    residence: {
      title: 'Architectural Residence Suite',
      price: woodFinish === 'standard' ? 'रू 58,00,000 - रू 1,10,00,000+' : 'रू 72,00,000 - रू 1,35,00,000+',
      timeline: '10-14 weeks atelier production',
      scopeDesc: 'Whole-home interior package covering living, dining, private suites, and custom architectural kitchen.',
      deliverables: [
        'Dedicated Senior Atelier Interior Architect & project manager',
        'Custom millimeter dimension tailoring & COM (Customer’s Own Material)',
        'Full 3D digital architectural visualization & finish board delivery',
        'Milestone-based workshop video updates and private studio viewing',
      ],
    },
  };

  const current = tiers[tier];

  function handleEnquire() {
    const briefNotes = `Project estimate requested for ${product.name}:\n- Scope: ${current.title} (${current.price})\n- Finish spec: ${woodFinish === 'standard' ? 'Artisan Standard (' + product.palette + ')' : 'Custom Millimeter Bespoke / COM'}\n- Estimated timeline: ${current.timeline}\n- Deliverables: ${current.deliverables.join('; ')}`;
    onEnquire(current.title, briefNotes);
  }

  return (
    <div className="project-estimator-section" aria-label="Bespoke project budget and scope estimator">
      <div className="estimator-header">
        <div>
          <span className="eyebrow">TRANSPARENT ATELIER INVESTMENT</span>
          <h3>Project Budget &amp; Scope Estimator</h3>
        </div>
        <span className="estimator-badge">● Artisan Direct Pricing</span>
      </div>
      <p className="estimator-sub">Explore estimated investment ranges from single statement commissions to complete whole-home architectural curations:</p>

      <div className="estimator-tier-tabs" role="tablist" aria-label="Project scope tier">
        <button
          type="button"
          role="tab"
          aria-selected={tier === 'piece'}
          className={`estimator-tab${tier === 'piece' ? ' active' : ''}`}
          onClick={() => setTier('piece')}
        >
          Statement Piece
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tier === 'room'}
          className={`estimator-tab${tier === 'room' ? ' active' : ''}`}
          onClick={() => setTier('room')}
        >
          Room Curation <span className="tab-pill">Most Requested</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tier === 'residence'}
          className={`estimator-tab${tier === 'residence' ? ' active' : ''}`}
          onClick={() => setTier('residence')}
        >
          Full Residence Suite
        </button>
      </div>

      <div className="estimator-card">
        <div className="estimator-main-row">
          <div>
            <h4 className="estimator-tier-name">{current.title}</h4>
            <p className="estimator-tier-desc">{current.scopeDesc}</p>
          </div>
          <div className="estimator-price-box">
            <span className="estimator-price-label">Estimated Investment</span>
            <strong className="estimator-price">{current.price}</strong>
            <span className="estimator-timeline">⏱ {current.timeline}</span>
          </div>
        </div>

        <div className="estimator-options-row">
          <label>
            <span>Finish specification:</span>
            <select value={woodFinish} onChange={e => setWoodFinish(e.target.value as any)}>
              <option value="standard">Signature Palette ({product.palette})</option>
              <option value="custom">Bespoke Millimeter Tailoring / COM Upholstery (+15%)</option>
            </select>
          </label>
        </div>

        <div className="estimator-deliverables">
          <span className="deliverables-title">Included White-Glove Atelier Services:</span>
          <ul>
            {current.deliverables.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="estimator-actions">
          <button type="button" className="button" onClick={handleEnquire}>
            Apply scope to project enquiry <Icon />
          </button>
          <span className="estimator-note">No obligation. Pricing confirmed after initial space consultation.</span>
        </div>
      </div>
    </div>
  );
}

function TradeConciergeCard({ onTrade, onSwatch }: { onTrade: () => void; onSwatch: () => void }) {
  return (
    <div className="trade-concierge-portal" aria-label="Trade and architect services">
      <div className="trade-portal-content">
        <span className="eyebrow">TRADE &amp; ARCHITECTURAL SPECIFICATION</span>
        <h3>For Interior Designers, Architects &amp; Developers</h3>
        <p>
          We partner with leading design studios and architectural practices globally. Access trade privileges, technical 2D/3D CAD models, and prioritized workshop scheduling for your residential and commercial projects.
        </p>
        <div className="trade-highlights-grid">
          <div className="trade-highlight-item">
            <strong>20% Trade Discount</strong>
            <span>Tiered commercial volume pricing on qualified studio projects.</span>
          </div>
          <div className="trade-highlight-item">
            <strong>2D &amp; 3D CAD Library</strong>
            <span>Direct .DWG, .OBJ, and high-resolution material PBR render textures.</span>
          </div>
          <div className="trade-highlight-item">
            <strong>Dedicated Account Lead</strong>
            <span>Single point of contact with 24-hour turnaround on formal quotations.</span>
          </div>
          <div className="trade-highlight-item">
            <strong>Custom Millimeter Specs</strong>
            <span>Bespoke sizing, COM upholstery, and contract fire-rated certifications.</span>
          </div>
        </div>
        <div className="trade-portal-actions">
          <button type="button" className="button" onClick={onTrade}>
            Request trade account &amp; CAD files <Icon />
          </button>
          <button type="button" className="button outline" onClick={onSwatch}>
            Order complimentary material swatch box ↗
          </button>
        </div>
      </div>
    </div>
  );
}

function AtelierProvenance() {
  const pillars = [
    {
      num: '01',
      title: 'Patan Master Joinery',
      desc: 'Solid kiln-dried hardwoods connected with traditional mortise-and-tenon wood dowels by generational woodcarvers in the Kathmandu Valley.',
    },
    {
      num: '02',
      title: '100-Knot Highland Wool',
      desc: 'Hand-carded Tibetan highland wool washed in glacial spring waters and knotted by hand with zero chemical binding agents or synthetic backings.',
    },
    {
      num: '03',
      title: 'Living Organic Patina',
      desc: 'Hand-buffed with pure cold-pressed walnut oil and Himalayan beeswax. An organic finish that breathes and acquires a rich natural patina over decades.',
    },
    {
      num: '04',
      title: 'White-Glove Placement',
      desc: 'Turnkey installation crew delivers into your room of choice, levels the piece, secures structural anchor points, and recycles all packaging.',
    },
  ];

  return (
    <div className="atelier-provenance-section" aria-label="Atelier craftsmanship pillars">
      <div className="section-head-mini">
        <span className="eyebrow">CRAFT &amp; PROVENANCE</span>
        <h4>The Kathmandu Atelier Standard</h4>
      </div>
      <div className="provenance-grid">
        {pillars.map(pill => (
          <div key={pill.num} className="provenance-card">
            <span className="card-number">{pill.num}</span>
            <h5>{pill.title}</h5>
            <p>{pill.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchitecturalTestimonials() {
  const quotes = [
    {
      quote: "Chandani crafts furniture with the permanence of architecture. The proportions of the Haven sofa bring a rare contemplative stillness to our Himalayan residential project.",
      author: "Ar. Prashant Shrestha",
      firm: "Studio Archaic · Jhamsikhel, Lalitpur",
      project: "Patan Heritage Residence",
    },
    {
      quote: "The tactile depth of the hand-knotted New Zealand wool under shifting mountain daylight is peerless. It grounds the entire room without demanding attention.",
      author: "Maya Sen-Gupta",
      firm: "Kora Interior Architecture · Pokhara",
      project: "Annapurna Mountain Retreat",
    },
  ];

  return (
    <div className="atelier-testimonials-section" aria-label="Architectural reviews">
      <div className="section-head-mini">
        <span className="eyebrow">ARCHITECTURAL VOICES</span>
        <h4>Collector &amp; Designer Perspectives</h4>
      </div>
      <div className="testimonials-grid">
        {quotes.map((q, idx) => (
          <blockquote key={idx} className="testimonial-card">
            <p className="testimonial-quote">“{q.quote}”</p>
            <footer className="testimonial-meta">
              <strong>{q.author}</strong>
              <span>{q.firm}</span>
              <small>{q.project}</small>
            </footer>
          </blockquote>
        ))}
      </div>
    </div>
  );
}

function KathmanduShowroomCard({ onBookVisit }: { onBookVisit: () => void }) {
  return (
    <div className="showroom-visit-card" aria-label="Visit our Kathmandu galleries">
      <div className="showroom-card-body">
        <span className="eyebrow">EXPERIENCE IN PERSON</span>
        <h4>Visit Our Galleries in Kathmandu</h4>
        <p>We welcome private clients, interior designers, and architects to experience the tactile warmth of our collection in natural daylight.</p>
        
        <div className="showroom-locations-grid">
          <div className="location-box">
            <span className="location-badge">Gallery &amp; Showroom</span>
            <h5>Baber Mahal Revisited</h5>
            <p>Courtyard II, Kathmandu, Nepal</p>
            <small>Monday – Saturday · 10:00 to 18:00</small>
          </div>
          <div className="location-box">
            <span className="location-badge">Atelier &amp; Workshop</span>
            <h5>Patan Craft Quarter</h5>
            <p>Industrial Estate, Lalitpur, Nepal</p>
            <small>By Private Appointment with Master Craftsman</small>
          </div>
        </div>

        <div className="showroom-card-actions">
          <button type="button" className="button" onClick={onBookVisit}>
            Book a private gallery viewing <Icon />
          </button>
          <a
            href="https://wa.me/9779801234567"
            target="_blank"
            rel="noopener noreferrer"
            className="button outline"
          >
            Direct WhatsApp Concierge ↗
          </a>
        </div>
      </div>
    </div>
  );
}

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { products, content, openProduct, openEnquiry, openTry } = useApp();
  const [galleryIndex, setGalleryIndex] = useState(0);

  const p = id ? products[id] : undefined;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setGalleryIndex(0);
  }, [id]);

  if (!p) {
    return (
      <section className="section product-not-found">
        <h1>Piece not found</h1>
        <p>This design concept is not in our current collection.</p>
        <SiteLink className="button" to="/#collection">
          Explore the collection <Icon />
        </SiteLink>
      </section>
    );
  }

  const roomImage = p.category === 'carpets' ? `room-${p.id}.webp` : (content.rooms[p.scene]?.image ?? p.image);
  const gallery = p.galleryImages && p.galleryImages.length > 0 ? p.galleryImages : [
    { src: p.image, label: 'Studio portrait', alt: `${p.name} studio portrait` },
    { src: roomImage, label: 'Room context', alt: `${p.name} in room context` },
  ];
  const activeImage = gallery[galleryIndex] ?? gallery[0];
  const related = (p.relatedIds ?? []).map(relId => products[relId]).filter(Boolean);

  function handleShareProduct() {
    if (!p) return;
    const url = window.location.href;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        toast.success('Piece link copied', {
          description: `${p.name} link copied to clipboard.`
        });
      }).catch(() => {
        toast.info(`Link: ${url}`);
      });
    } else {
      toast.info(`Link: ${url}`);
    }
  }

  return (
    <article className="product-page section">
      <nav className="product-breadcrumb" aria-label="Breadcrumb">
        <SiteLink to="/">Home</SiteLink>
        <span aria-hidden="true">/</span>
        <SiteLink to="/#collection">Collection</SiteLink>
        <span aria-hidden="true">/</span>
        <SiteLink to={`/?room=${p.scene}#home-room`}>{p.scene.toUpperCase()}</SiteLink>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{p.name}</span>
      </nav>

      <div className="product-hero-layout">
        <div className="product-gallery-stage">
          <div className="product-main-view">
            <img
              src={asset(activeImage.src)}
              alt={activeImage.alt}
              style={galleryIndex === 0 ? focusStyle(p) : undefined}
            />
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
        </div>

        <div className="product-primary-info">
          <span className="eyebrow">{p.type.toUpperCase()} · CHANDANI ATELIER</span>
          <h1>{p.name}</h1>
          <p className="product-lead">{p.text}</p>

          {p.availability && (
            <div className="product-page-status">
              <span className="avail-dot">●</span>
              <span>{p.availability}</span>
            </div>
          )}

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

          <div className="product-main-actions">
            <MotionButton className="button" onClick={() => openEnquiry(p.name)}>
              Enquire about this piece <Icon />
            </MotionButton>
            <SaveButton id={p.id} className="button outline" />
            <MotionButton className="button outline" onClick={() => openTry(p.id)} aria-haspopup="dialog">
              Try in the room <Icon />
            </MotionButton>
            <button type="button" className="button outline" onClick={handleShareProduct}>
              Share piece ↗
            </button>
          </div>

          <div className="product-quick-perks" role="group" aria-label="Bespoke atelier services">
            <button type="button" className="quick-perk-btn" onClick={() => openEnquiry(p.name, 'swatch')}>
              🪵 Material &amp; Finish Samples
            </button>
            <button type="button" className="quick-perk-btn" onClick={() => openEnquiry(p.name, 'trade')}>
              📐 Architecture &amp; Designer Collaboration
            </button>
          </div>

          {p.category === 'carpets' ? (
            <SiteLink className="text-link" to={`/carpet-studio?rug=${p.id}`}>
              Compare it in the carpet studio <Icon />
            </SiteLink>
          ) : (
            <SiteLink className="text-link" to={`/?room=${p.scene}&piece=${p.id}#home-room`}>
              Explore room inspiration <Icon />
            </SiteLink>
          )}

          <div className="product-guarantee-note">
            <p><strong>Bespoke Craftsmanship:</strong> Each Chandani piece is custom made or finished in small artisan workshops. Pricing, dimensions, and finishes are confirmed prior to production.</p>
          </div>
        </div>
      </div>

      <RevealSection className="product-deep-dive section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SPECIFICATIONS &amp; CRAFT</span>
            <h2>Made for your home.</h2>
          </div>
        </div>

        <div className="product-specs-grid">
          <div className="product-spec-card">
            <h3>Materials &amp; Finish</h3>
            <p><strong>Palette:</strong> {p.finishDetails ?? p.palette}</p>
            {p.materialsList && (
              <ul>
                {p.materialsList.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            )}
          </div>

          <div className="product-spec-card">
            <h3>Dimensions &amp; Scale</h3>
            {p.dimensions ? (
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
            ) : (
              <p>Custom dimensions available on request.</p>
            )}
          </div>
        </div>

        <RoomFitChecker dimensions={p.dimensions} />

        <div className="product-accordion-wrapper">
          <ProductAccordion
            details={[
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
        </div>

        <BespokeProjectEstimator
          product={p}
          onEnquire={(scope, notes) => openEnquiry(p.name, 'private', notes)}
        />

        <TradeConciergeCard
          onTrade={() => openEnquiry(p.name, 'trade')}
          onSwatch={() => openEnquiry(p.name, 'swatch')}
        />

        <AtelierProvenance />

        <ArchitecturalTestimonials />

        <KathmanduShowroomCard
          onBookVisit={() => openEnquiry('Baber Mahal Showroom Viewing', 'private', 'Requesting a private gallery viewing appointment at Baber Mahal Revisited.')}
        />
      </RevealSection>

      {related.length > 0 && (
        <RevealSection className="product-related-full section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">COORDINATING PIECES</span>
              <h2>Complete the space.</h2>
            </div>
            <SiteLink className="text-link" to="/#collection">
              Explore the whole collection <Icon />
            </SiteLink>
          </div>

          <div className="product-grid">
            {related.map(rel => (
              <article className="product-card" key={rel.id}>
                <div className="product-visual">
                  <button className="product-image" onClick={() => openProduct(rel.id)} aria-label={`Explore ${rel.name}`}>
                    <img src={asset(rel.image)} alt={rel.name} loading="lazy" style={focusStyle(rel)} />
                  </button>
                  <SaveButton id={rel.id} className="save-button" />
                </div>
                <div className="product-info">
                  <div>
                    <h3><button onClick={() => openProduct(rel.id)}>{rel.name}</button></h3>
                    <p>{rel.palette}</p>
                  </div>
                  <button className="icon-button" onClick={() => openProduct(rel.id)} aria-label={`View ${rel.name}`}><Icon /></button>
                </div>
              </article>
            ))}
          </div>
        </RevealSection>
      )}
    </article>
  );
}
