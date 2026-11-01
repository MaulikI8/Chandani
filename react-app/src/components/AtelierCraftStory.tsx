import { useApp } from '../state/AppContext';
import { asset } from '../data/service';
import { Icon } from './Icon';

export function AtelierCraftStory() {
  const { openEnquiry } = useApp();

  return (
    <section className="atelier-craft-story showroom-extension section" id="atelier">
      <div className="section-heading">
        <div>
          <span className="eyebrow">MADE IN KATHMANDU</span>
          <h2>The Workshop &amp; The Loom</h2>
        </div>
        <p>
          We do not import flat-packed compromises. Every Chandani piece is shaped by master joiners and weavers working in the Kathmandu Valley.
        </p>
      </div>

      <div className="craft-pillars-grid">
        <div className="pillar-card">
          <div className="pillar-image-wrap">
            <img src={asset('without-dining-table.webp')} alt="Patan timber joinery workshop" loading="lazy" />
            <span className="pillar-badge">01 / TIMBER JOINERY</span>
          </div>
          <div className="pillar-content">
            <h3>Patan Master Joinery</h3>
            <p>
              Located in Lalitpur, our woodworking atelier uses traditional mortise-and-tenon construction.
              We season native Solid Sisau, American Walnut, and White Oak specifically for Himalayan relative humidity fluctuations.
            </p>
            <ul className="pillar-specs">
              <li>Eased bullnose edges hand-sanded to 400-grit smoothness</li>
              <li>Organic cold-pressed linseed and botanical wax oils</li>
              <li>Hidden corner splines ensuring lifetime frame stability</li>
            </ul>
          </div>
        </div>

        <div className="pillar-card">
          <div className="pillar-image-wrap">
            <img src={asset('room-chalk.webp')} alt="Hand-knotted carpet loom weaving" loading="lazy" />
            <span className="pillar-badge">02 / TEXTILE FOUNDATION</span>
          </div>
          <div className="pillar-content">
            <h3>Hand-Knotted Tibetan Looms</h3>
            <p>
              Woven on heavy vertical wooden looms using high-altitude sheep wool rich in natural protective lanolin.
              Each knot is individually looped by hand around steel rods and cut with precision shears.
            </p>
            <ul className="pillar-specs">
              <li>80-knot density providing underfoot cushioning &amp; acoustic absorption</li>
              <li>Organic mineral and vegetable dye washes</li>
              <li>Double-warp unbleached organic cotton structural backing</li>
            </ul>
          </div>
        </div>

        <div className="pillar-card">
          <div className="pillar-image-wrap">
            <img src={asset('hero-chalk-wide.webp')} alt="Baber Mahal gallery viewing salon" loading="lazy" />
            <span className="pillar-badge">03 / VIEWING SALON</span>
          </div>
          <div className="pillar-content">
            <h3>Baber Mahal Viewing Gallery</h3>
            <p>
              Experience our furniture scales, timber grains, and carpet textures in person.
              Located in Courtyard II at Baber Mahal Revisited, open for private consultations by appointment.
            </p>
            <div className="pillar-contact-info">
              <p><strong>Baber Mahal Revisited · Courtyard II</strong></p>
              <p>Kathmandu 44600 · Phone: +977 1 552 4890</p>
              <p>Hours: Tuesday to Sunday, 10:30 AM to 6:30 PM</p>
            </div>
            <button
              type="button"
              className="button"
              onClick={() => openEnquiry('Showroom Appointment', 'private', 'Requesting a private viewing appointment at the Baber Mahal gallery.')}
            >
              Book a gallery visit <Icon />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AtelierCraftStory;
