import { SiteLink } from '../components/Navigation';
import { useApp } from '../state/AppContext';
import { MotionButton, RevealSection } from '../components/Interactions';
import { Icon } from '../components/Icon';

export function AtelierPage() {
  const { openEnquiry } = useApp();

  return (
    <article className="atelier-page-container">
      {/* Editorial Hero */}
      <section className="atelier-hero-section section">
        <div className="atelier-hero-inner">
          <span className="eyebrow">CHANDANI ATELIER NEPAL</span>
          <h1>Crafted in silence.<br />Built for generations.</h1>
          <p className="atelier-hero-lead">
            In the ancient craft quarters of the Kathmandu Valley, Chandani brings together centuries of Newar woodworking tradition, Tibetan hand-knotted highland wool, and clean architectural lines.
          </p>
          <div className="atelier-hero-actions">
            <MotionButton className="button" onClick={() => openEnquiry('Whole home')}>
              Start a project conversation <Icon />
            </MotionButton>
            <SiteLink to="/?category=carpets#collection" className="text-link">
              Explore the collection ↓
            </SiteLink>
          </div>
        </div>
      </section>

      {/* Craft Pillars */}
      <RevealSection className="atelier-craft-section section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">OUR PHILOSOPHY</span>
            <h2>Three living materials.<br />Zero synthetic shortcuts.</h2>
          </div>
          <p>
            We believe a home should be grounded in natural substances that breathe, age with grace, and never emit volatile compounds.
          </p>
        </div>

        <div className="craft-pillars-grid">
          <div className="craft-pillar-card">
            <div className="pillar-index">01</div>
            <h3>Himalayan Highland Wool</h3>
            <p>
              Sheared from mountain sheep grazing at altitudes above 3,500 meters, this wool is extraordinarily rich in natural lanolin. Hand-carded and spun on traditional drop spindles in the Kathmandu Valley, our carpets achieve a density of 100 knots per square inch.
            </p>
            <ul className="pillar-specs">
              <li>Naturally flame retardant and soil repellent</li>
              <li>Washed in glacial mountain spring waters</li>
              <li>Zero petroleum backing or chemical adhesives</li>
            </ul>
          </div>

          <div className="craft-pillar-card">
            <div className="pillar-index">02</div>
            <h3>Patan Master Joinery</h3>
            <p>
              Our timber pieces are built in collaboration with generational master woodcarvers of Patan. Every rail, trestle, and plinth is connected using wood-pinned mortise-and-tenon joinery that accommodates natural atmospheric expansion without warping.
            </p>
            <ul className="pillar-specs">
              <li>Sustainably harvested FSC certified white oak &amp; walnut</li>
              <li>Hidden underside steel tension rods for tabletop flatness</li>
              <li>Sculpted bullnose radii shaped entirely by hand plane</li>
            </ul>
          </div>

          <div className="craft-pillar-card">
            <div className="pillar-index">03</div>
            <h3>Organic Living Finishes</h3>
            <p>
              Rather than sealing wood beneath synthetic polyurethane coatings, we hand-buff each surface with cold-pressed walnut oil and raw Himalayan beeswax. The timber remains tactile to the touch and develops a deep, lustrous patina over decades.
            </p>
            <ul className="pillar-specs">
              <li>100% Non-toxic, food-safe and child-safe</li>
              <li>Breathable barrier that resists daily moisture</li>
              <li>Easily refreshed with our organic maintenance wax</li>
            </ul>
          </div>
        </div>
      </RevealSection>

      {/* The Atelier Process */}
      <RevealSection className="atelier-process-section section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">HOW WE WORK</span>
            <h2>From space study<br />to dedicated room placement.</h2>
          </div>
          <p>
            Whether commissioning a single statement dining table or an entire architectural residence suite, our collaborative process ensures complete clarity.
          </p>
        </div>

        <div className="process-timeline">
          <div className="process-step">
            <div className="step-badge">Phase 01</div>
            <h4>Spatial Dialogue &amp; Scale Audit</h4>
            <p>
              We begin with your floorplans, architectural photography, or an in-person consultation at our Baber Mahal gallery. We map traffic circulation and natural lighting to confirm optimal proportions.
            </p>
          </div>
          <div className="process-step">
            <div className="step-badge">Phase 02</div>
            <h4>Physical Material Review</h4>
            <p>
              We provide authentic timber samples in Sisau and Smoked Walnut, raw Belgian linen weaves, and Tibetan wool swatches so you can test them in your room&apos;s natural morning and evening light.
            </p>
          </div>
          <div className="process-step">
            <div className="step-badge">Phase 03</div>
            <h4>Atelier Bench Production</h4>
            <p>
              Your piece is assigned to a dedicated master artisan in our Patan workshop. We provide periodic video and photographic updates as the timber is joined, hand-sanded, and waxed.
            </p>
          </div>
          <div className="process-step">
            <div className="step-badge">Phase 04</div>
            <h4>Dedicated Room Placement</h4>
            <p>
              Our specialist two-person logistics crew delivers directly into your room of choice, levels the piece, secures structural anchor points, and takes away all protective packaging for recycling.
            </p>
          </div>
        </div>
      </RevealSection>

      {/* Showrooms & Galleries */}
      <RevealSection className="atelier-locations-section section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">VISIT US</span>
            <h2>Our Galleries in Nepal</h2>
          </div>
          <p>
            Experience our furniture and hand-knotted carpets in person under natural daylight.
          </p>
        </div>

        <div className="locations-grid">
          <div className="location-card">
            <span className="location-tag">Flagship Gallery</span>
            <h3>Baber Mahal Revisited</h3>
            <p className="location-address">Courtyard II, Baber Mahal, Kathmandu, Nepal</p>
            <div className="location-hours">
              <strong>Gallery Hours:</strong>
              <p>Monday to Saturday: 10:00 to 18:00<br />Sunday: By private appointment</p>
            </div>
            <div className="location-contact">
              <p>Direct: +977 1 552 4890 · atelier@chandani.com.np</p>
            </div>
            <button
              type="button"
              className="button outline"
              onClick={() => openEnquiry('Baber Mahal Gallery Visit', 'private', 'Requesting private appointment at Baber Mahal Revisited.')}
            >
              Book gallery consultation
            </button>
          </div>

          <div className="location-card">
            <span className="location-tag">Artisan Studio &amp; Workshop</span>
            <h3>Patan Craft Quarter</h3>
            <p className="location-address">Patan Industrial Estate, Lalitpur, Nepal</p>
            <div className="location-hours">
              <strong>Studio Visits:</strong>
              <p>By private reservation for interior designers, architects, and bespoke patrons.</p>
            </div>
            <div className="location-contact">
              <p>Concierge WhatsApp: +977 980 123 4567</p>
            </div>
            <button
              type="button"
              className="button outline"
              onClick={() => openEnquiry('Patan Workshop Visit', 'trade', 'Trade studio visit to observe woodworking and loom weaving.')}
            >
              Reserve workshop tour
            </button>
          </div>
        </div>
      </RevealSection>

      {/* Trade & Architecture Banner */}
      <RevealSection className="atelier-trade-banner section">
        <div className="trade-banner-inner">
          <span className="eyebrow">FOR DESIGN PROFESSIONALS</span>
          <h2>B2B Trade &amp; Architecture Program</h2>
          <p>
            We partner with interior architects, boutique hoteliers, and residential design studios across Nepal and internationally. Enjoy 20% trade pricing, 2D/3D CAD models, custom dimensions, and COM upholstery support.
          </p>
          <div className="trade-banner-ctas">
            <button type="button" className="button" onClick={() => openEnquiry('Trade Partnership', 'trade')}>
              Designer &amp; Architectural Enquiry <Icon />
            </button>
            <button type="button" className="button outline" onClick={() => openEnquiry('Material Swatches', 'swatch')}>
              Request Material Swatches
            </button>
          </div>
        </div>
      </RevealSection>
    </article>
  );
}
