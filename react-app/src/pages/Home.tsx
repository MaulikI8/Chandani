import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { RevealSection, MotionButton } from '../components/Interactions';
import { useApp } from '../state/AppContext';
import { asset } from '../data/service';
import type { RoomId, Product } from '../data/types';
import { Icon } from '../components/Icon';
import { CrossfadeImage } from '../components/CrossfadeImage';
import { useImagePair } from '../hooks/useImagePair';
import { CuratedCollections } from '../components/CuratedCollections';
import { ShopByRoom } from '../components/ShopByRoom';
import { MaterialsExplorer } from '../components/MaterialsExplorer';
import { PlanningAssistant } from '../components/PlanningAssistant';
import { RoomStudio } from '../components/RoomStudio';
import { DesignJournal } from '../components/DesignJournal';
import { AtelierCraftStory } from '../components/AtelierCraftStory';
import { ShowroomFaq } from '../components/ShowroomFaq';
import { CfiCatalogue } from '../components/CfiCatalogue';

/* ==========================================================================
   HOMEPAGE IN A SINGLE FILE
   Everything for the Chandani homepage is contained within this single file:
   - Interactive Room Explorer & Room Toolbar Actions
   - Hotspot Navigation & Live Scene Selection Cards
   - Category Directory
   - Product Collection Grid, Product Cards, and Shortlist Save Buttons
   - Curated Filters
   - Kitchen Design Study Feature
   - Guidance & Planning Steps
   - Whole-Home Consultation Contact
   ========================================================================== */

/* 1. PRODUCT CARDS, SAVE BUTTONS & COLLECTION FILTERS */
export const focusStyle = (p: Product) => ({ '--focus': p.focus ?? '50%' }) as CSSProperties;

export function SaveButton({
  id,
  className = 'button outline',
  iconFirst = false,
  children,
}: {
  id: string;
  className?: string;
  iconFirst?: boolean;
  children?: ReactNode;
}) {
  const { saved, products, toggleSave } = useApp();
  const on = saved.includes(id);
  return (
    <MotionButton
      className={className}
      aria-pressed={on}
      aria-label={`${on ? 'Remove' : 'Save'} ${products[id].name} ${on ? 'from' : 'to'} shortlist`}
      onClick={() => toggleSave(id)}
    >
      {iconFirst && <Icon name="save" />}
      {children ?? (className !== 'save-button' && <span>{on ? 'Saved to shortlist' : 'Save to shortlist'}</span>)}
      {!iconFirst && <Icon name="save" />}
    </MotionButton>
  );
}

export function ProductCard({ product: p }: { product: Product }) {
  const { openProduct } = useApp();
  return (
    <article className="product-card">
      <div className="product-visual">
        <button className="product-image" onClick={() => openProduct(p.id)} aria-label={`Explore ${p.name}`}>
          <img src={asset(p.image)} alt={`${p.name} design concept`} loading="lazy" style={focusStyle(p)} />
        </button>
        <SaveButton id={p.id} className="save-button" />
      </div>
      <div className="product-info">
        <div>
          <h3><button onClick={() => openProduct(p.id)}>{p.name}</button></h3>
          <p>{p.palette}</p>
        </div>
        <button className="icon-button" onClick={() => openProduct(p.id)} aria-label={`View ${p.name}`}>
          <Icon />
        </button>
      </div>
    </article>
  );
}

export const filters = {
  featured: 'The edit',
  all: 'All pieces',
  seating: 'Seating',
  carpets: 'Carpets',
  dining: 'Dining',
  bedroom: 'Bedroom',
  lighting: 'Lighting & décor',
  storage: 'Storage',
};

/* 1. ROOM TOOLBAR ACTIONS */
function RoomViewActions({ onReset, onSave }: { onReset: () => void; onSave: () => void }) {
  return (
    <div className="room-view-actions" role="group" aria-label="Room view actions">
      <button type="button" className="text-link" onClick={onReset} aria-label="Reset room view">
        Reset view
      </button>
      <button type="button" className="text-link" onClick={onSave}>
        Save room selections <span aria-hidden="true">↗</span>
      </button>
    </div>
  );
}

/* 2. INTERACTIVE ROOM EXPLORER */
const roomLabels: Record<RoomId, string> = {
  living: 'Living room',
  kitchen: 'Kitchen',
  bedroom: 'Bedroom',
  dining: 'Dining',
};

export function RoomExplorer() {
  const { content, products, query, openProduct, openEnquiry, openTry, tryEntry, saveConfiguration } = useApp();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const requestedRoom = params.get('room');
  const exploring = !!requestedRoom && Object.hasOwn(content.rooms, requestedRoom);
  const roomId: RoomId = exploring ? (requestedRoom as RoomId) : 'living';
  const room = content.rooms[roomId];
  const { status, revision, retry } = useImagePair(room.image, room.image);
  const index = Math.max(0, room.items.findIndex(item => (item.product ?? item.id) === params.get('piece')));
  const item = room.items[index];
  const product = item.product ? products[item.product] : undefined;
  const exploreButton = useRef<HTMLButtonElement>(null);
  const firstHotspot = useRef<HTMLButtonElement>(null);
  const focusAfterLoad = useRef(false);
  const returnToExplore = useRef(false);

  useEffect(() => {
    if (exploring && status === 'ready' && focusAfterLoad.current) {
      focusAfterLoad.current = false;
      if (
        document.activeElement === exploreButton.current ||
        document.activeElement === document.body ||
        document.activeElement?.closest('.scene-photo .try-loading')
      ) {
        firstHotspot.current?.focus({ preventScroll: true });
      }
    }
  }, [status, exploring]);

  useEffect(() => {
    if (!exploring && returnToExplore.current) {
      returnToExplore.current = false;
      exploreButton.current?.focus({ preventScroll: true });
    }
  }, [exploring]);

  const explore = (id: RoomId) => query({ room: id, piece: null }, '#home-room');

  return (
    <section className="home-room" id="home-room" aria-label="Explore a Chandani home">
      <div className={`scene${exploring ? ' exploring' : ''}`} id="scene">
        <div className="scene-photo" id="scenePhoto">
          <CrossfadeImage
            ready={status === 'ready'}
            revision={revision}
            id="sceneImage"
            src={asset(room.image)}
            width="1919"
            height="820"
            fetchPriority="high"
            alt={exploring ? room.alt : 'A light living room with an ivory sofa, a bordered rug and a sculptural side table'}
          />
          {exploring && status !== 'ready' && (
            <div className="try-loading" role="status">
              <span>{status === 'error' ? 'The room photograph could not load.' : `Loading ${room.label.toLowerCase()}…`}</span>
              {status === 'error' && (
                <button onClick={() => { focusAfterLoad.current = true; retry(); }}>
                  Try again
                </button>
              )}
            </div>
          )}
          <div className="hotspots" id="hotspots" hidden={!exploring}>
            {room.items.map((hotspot, i) => (
              <button
                key={hotspot.product ?? hotspot.id}
                ref={i === 0 ? firstHotspot : undefined}
                disabled={status !== 'ready'}
                className="hotspot"
                style={{ '--x': `${hotspot.x}%`, '--y': `${hotspot.y}%` } as CSSProperties}
                aria-label={`Explore ${hotspot.label.toLowerCase()}`}
                aria-pressed={i === index}
                onClick={() => query({ piece: hotspot.product ?? hotspot.id }, undefined, true)}
              >
                <span className="pin">{String(i + 1).padStart(2, '0')}</span>
                <span className="pin-label">{hotspot.label}</span>
              </button>
            ))}
          </div>
          <div className="scene-topline" id="sceneTopline" hidden={!exploring}>
            <span>{room.number} / {room.label.toUpperCase()}</span>
            <button
              aria-label="Return to introduction"
              onClick={() => {
                returnToExplore.current = true;
                query({ room: null, piece: null });
              }}
            >
              Close room view ×
            </button>
          </div>
        </div>
        <div className="hero-copy" id="heroCopy" hidden={exploring}>
          <span className="eyebrow">MATTRESSES, FOAM &amp; INTERIORS</span>
          <h1>A home,<br />in your<br /><em>own way.</em></h1>
          <p>Discover mattresses and foam made in Nepal, alongside ideas for the spaces you call home.</p>
          <MotionButton
            className="button"
            ref={exploreButton}
            onClick={() => {
              focusAfterLoad.current = true;
              explore('living');
            }}
          >
            Explore this room <Icon />
          </MotionButton>
          <a className="text-link" href="#catalogue">
            Discover the collection <span>↓</span>
          </a>
        </div>
        <div className="scene-card" id="sceneCard" hidden={!exploring} aria-live="polite">
          <span className="eyebrow">{room.label.toUpperCase()} / {String(index + 1).padStart(2, '0')}</span>
          {product ? (
            <>
              <h3>{product.name}</h3>
              <p>{product.text}</p>
              <button className="button" onClick={() => openProduct(product.id)}>
                Explore the piece <Icon />
              </button>
              <div className="scene-small-actions">
                <SaveButton id={product.id} className="" iconFirst />
                {product.category === 'carpets' ? (
                  <button type="button" onClick={() => openTry(product.id, 'living')}>
                    Compare colours ↗
                  </button>
                ) : (
                  <button onClick={() => openEnquiry(product.name)}>
                    Enquire ↗
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <button className="button" onClick={() => openEnquiry(item.interest!)}>
                Discuss this idea <Icon />
              </button>
              <div className="scene-small-actions">
                <a href="#kitchens">About kitchen design ↓</a>
              </div>
            </>
          )}
        </div>
      </div>
      <div className={`room-toolbar${exploring ? ' has-view-actions' : ''}`}>
        <div className="room-intro">
          <span className="eyebrow">A DIFFERENT WAY TO EXPLORE</span>
          <span>Start with a room.</span>
        </div>
        <div className="room-tabs" aria-label="Choose a room">
          {(Object.keys(content.rooms) as RoomId[]).map(id => (
            <button key={id} onClick={() => explore(id)} aria-pressed={id === roomId}>
              <span>{content.rooms[id].number}</span> {roomLabels[id]}
            </button>
          ))}
        </div>
        <MotionButton
          className="room-hint try-room-launch"
          onClick={() => openTry(undefined, roomId)}
          aria-haspopup="dialog"
          aria-expanded={!!tryEntry}
        >
          Try the room <Icon />
        </MotionButton>
        {exploring && <RoomViewActions onReset={() => explore(roomId)} onSave={saveConfiguration} />}
      </div>
    </section>
  );
}

/* 3. CATEGORY DIRECTORY */
const categories = [
  { id: 'seating', title: 'Sofas & seating', sub: 'Make yourself comfortable', image: 'sofa.webp', className: 'sofa' },
  { id: 'carpets', title: 'Carpets', sub: 'Give the room its foundation', image: 'product-clay.webp', className: 'rug' },
  { id: 'bedroom', title: 'Bedroom', sub: 'Make space to slow down', image: 'bedroom.webp', className: 'bedroom' },
  { id: 'dining', title: 'Dining', sub: 'For everyday gatherings', image: 'dining.webp', className: 'dining' },
];

export function CategoryDirectory() {
  const { query } = useApp();
  return (
    <RevealSection className="categories section" id="categories">
      <div className="section-heading">
        <div>
          <span className="eyebrow">ROOM INSPIRATION</span>
          <h2>One piece.<br />Or a whole new perspective.</h2>
        </div>
        <p>Explore illustrative furniture and interior ideas. Contact us to discuss what is available for your space.</p>
      </div>
      <div className="category-grid">
        {categories.map(c => (
          <button className="category" key={c.id} onClick={() => query({ category: c.id }, '#collection')}>
            <div className={`category-image ${c.className}`}>
              <img src={asset(c.image)} loading="lazy" alt={`${c.title} design concept`} />
            </div>
            <span className="category-title">{c.title}<Icon /></span>
            <span className="category-sub">{c.sub}</span>
          </button>
        ))}
      </div>
      <div className="category-more">
        <span>And the details that finish it.</span>
        <button onClick={() => query({ category: 'lighting' }, '#collection')}>
          Lighting &amp; décor <Icon />
        </button>
        <button onClick={() => query({ category: 'storage' }, '#collection')}>
          Storage <Icon />
        </button>
        <a href="#kitchens">Kitchen design <Icon /></a>
      </div>
    </RevealSection>
  );
}

/* 4. PRODUCT COLLECTION */
export function ProductCollection() {
  const { content, query } = useApp();
  const location = useLocation();
  const category = new URLSearchParams(location.search).get('category') ?? 'featured';
  const filter = Object.hasOwn(filters, category) ? category : 'featured';
  const list = content.products.filter(p => filter === 'all' || (filter === 'featured' ? p.featured : p.category === filter));

  return (
    <RevealSection className="collection section" id="collection">
      <div className="section-heading">
        <div>
          <span className="eyebrow">ILLUSTRATIVE ROOM CONCEPTS</span>
          <h2>Ideas to make it yours.</h2>
        </div>
        <button className="text-link" onClick={() => query({ category: 'all' })}>
          Explore all pieces <Icon name="right" />
        </button>
      </div>
      <div className="collection-bar">
        <div className="filters" aria-label="Filter the collection">
          {Object.entries(filters).map(([id, label]) => (
            <button key={id} onClick={() => query({ category: id })} aria-pressed={filter === id}>
              {label}
            </button>
          ))}
        </div>
        <span id="resultCount" aria-live="polite">
          {list.length} pieces
        </span>
      </div>
      <div className="product-grid" id="productGrid">
        {list.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </RevealSection>
  );
}

/* 5. KITCHEN DESIGN STUDY FEATURE */
export function KitchenFeature() {
  const { openEnquiry, query } = useApp();
  return (
    <RevealSection className="kitchen-section" id="kitchens">
      <div className="kitchen-image">
        <img
          src={asset('kitchen.webp')}
          width="1881"
          height="836"
          loading="lazy"
          alt="Kitchen design concept with a walnut island, stone-style worktop and green cabinetry"
        />
        <span className="image-caption">A KITCHEN DESIGN STUDY</span>
      </div>
      <div className="kitchen-copy">
        <span className="eyebrow">KITCHEN DESIGN / CHANDANI</span>
        <h2>Made around<br />the way<br /><em>you live.</em></h2>
        <p>A place to cook. To catch up. To come together. Start with your space, then explore the layout, storage and finishes that feel right.</p>
        <MotionButton className="button light" onClick={() => openEnquiry('Kitchen design')}>
          Let’s plan your kitchen <Icon />
        </MotionButton>
        <button className="text-link" onClick={() => query({ room: 'kitchen', piece: null }, '#home-room')}>
          Explore the kitchen concept <Icon name="right" />
        </button>
      </div>
    </RevealSection>
  );
}

/* 6. MAIN COMPOSITION: ALL-IN-ONE HOMEPAGE DIGITAL SHOWROOM */
export function Home() {
  const { openEnquiry } = useApp();
  return (
    <>
      {/* 01. The Interactive Residence */}
      <RoomExplorer />

      {/* The existing manufacturer's actual product categories. */}
      <CfiCatalogue />

      {/* 02. Explore Chandani Category Directory */}
      <CategoryDirectory />

      {/* 03. Curated Collections: Intentional Combinations */}
      <CuratedCollections />

      {/* 04. Shop by Room: Four Spatial Worlds */}
      <ShopByRoom />

      {/* 05. The Distinctive Interactive Showcase: Materials & Planning */}
      <section className="showroom-interactive-duo showroom-extension section" id="interactiveShowcase">
        <MaterialsExplorer />
        <PlanningAssistant />
      </section>

      {/* 06. The Chandani Room Studio: Coordinated Shortlist Ensemble */}
      <section className="showroom-studio-wrapper showroom-extension section" id="studioEnsemble">
        <RoomStudio />
      </section>

      {/* 07. An Illustrative Collection: Restrained Featured Products */}
      <ProductCollection />

      {/* 08. Kitchen & Interior Studio Service Showcase */}
      <KitchenFeature />

      {/* 09. The Design Journal: Educational Architectural Guidance */}
      <DesignJournal />

      {/* 10. The Atelier & Craft Story: Made in Kathmandu */}
      <AtelierCraftStory />

      {/* 11. Commercial FAQs: Real Timelines, Logistics & Warranty */}
      <ShowroomFaq />

      {/* 12. Consultation Process: Planning Guidance Steps */}
      <RevealSection className="planning section">
        <div className="planning-title">
          <span className="eyebrow">FROM AN IDEA TO A SPACE</span>
          <h2>A little guidance.<br />A home that feels like you.</h2>
        </div>
        <div className="planning-steps">
          <article>
            <span>01</span>
            <h3>Bring your space.</h3>
            <p>A room, a rough measurement, a few ideas. Start with what you have.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Explore the possibilities.</h3>
            <p>Look at pieces, palettes and layouts together, in the context of your home.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Make it your own.</h3>
            <p>Bring your favourites together and discuss the details with Chandani.</p>
          </article>
        </div>
      </RevealSection>

      {/* 13. Whole-Home Consultation Contact */}
      <RevealSection className="contact section" id="contact">
        <div>
          <span className="eyebrow">LET’S BEGIN</span>
          <h2>Let’s talk about<br />what you need.</h2>
        </div>
        <div>
          <p>Mattresses, foam or a space of your own.<br />Tell us what you have in mind.</p>
          <MotionButton className="button" onClick={() => openEnquiry('Whole home')}>
            Start a conversation <Icon />
          </MotionButton>
        </div>
      </RevealSection>
    </>
  );
}

export default Home;
