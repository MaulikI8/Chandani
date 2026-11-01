import { useState } from 'react';
import { Icon } from './Icon';

interface JournalArticle {
  id: string;
  category: string;
  title: string;
  summary: string;
  readTime: string;
  keyRule: string;
  content: string[];
}

const articles: JournalArticle[] = [
  {
    id: 'rug-sizing',
    category: 'PROPORTIONS & SCALE',
    title: 'The Rug Sizing Rulebook: Why Bigger Is Almost Always Better',
    summary:
      'A rug that is too small floats like an island and shrinks the visual boundaries of your room. Here is the architectural guide to getting the dimensions right the first time.',
    readTime: '4 min read',
    keyRule: 'Rule: The front legs of your sofa and armchairs should always rest 20 to 30 cm onto the rug to anchor the seating group.',
    content: [
      'In residential interior design, the most common spatial mistake is selecting a 5×7 ft rug for a standard living room. An undersized rug breaks the cohesion of the furniture and makes the space appear disjointed.',
      'For standard Kathmandu living spaces (approximately 14×16 ft or larger), an 8×10 ft (2.4×3.0 m) rug is the minimum recommended scale. It allows the front legs of the sofa, coffee table, and accent chairs to rest comfortably on the pile.',
      'In dining rooms, the rule is even stricter: the carpet must extend at least 60 cm beyond the table edges on all four sides. This guarantees that when guests slide their chairs back to stand, the rear legs stay safely on the pile without catching the edge.',
    ],
  },
  {
    id: 'clearances',
    category: 'ERGONOMICS',
    title: 'Living Room Clearances: Walkways, Reach, and Breathing Room',
    summary:
      'Comfort is not just the softness of your sofa cushion; it is the subconscious ease of moving through your space without turning sideways or bumping your knees.',
    readTime: '3 min read',
    keyRule: 'Rule: Maintain 38–45 cm between the sofa and coffee table, and minimum 90 cm for primary circulation paths.',
    content: [
      'When placing a coffee table, 40 cm is the ergonomic sweet spot: close enough to set down a cup of tea or a book without leaning forward, yet spacious enough to slide your legs through comfortably.',
      'Primary circulation pathways connecting doorways to seating areas should maintain a minimum width of 90 cm (3 feet). Secondary pathways, such as passing between an accent chair and a bookshelf, can narrow to 70 cm.',
      'Keep lighting cord runs concealed along baseboards or under flat-woven rug pads to eliminate visual and physical clutter.',
    ],
  },
  {
    id: 'timber-care',
    category: 'MATERIAL CARE',
    title: 'Solid Hardwood in the Kathmandu Valley: Monsoon to Winter',
    summary:
      'Solid Sisau, Oak, and Walnut are living, breathing natural materials. Here is how to keep your joinery stable through shifting seasonal humidity.',
    readTime: '5 min read',
    keyRule: 'Rule: Use breathable organic wax-oil finishes that allow wood pores to expand and contract naturally without surface cracking.',
    content: [
      'Kathmandu experiences dramatic shifts in relative humidity, from over 85% during the monsoon down to under 25% during dry winter months. Thick synthetic polyurethane coats trap internal moisture, causing warping or clouding.',
      'Chandani applies breathable plant-based hardwax oils that penetrate deep into the timber grain, forming a flexible microscopic barrier that shields against water rings while allowing the wood to breathe.',
      'Never place solid timber furniture directly against a high-output radiant space heater or radiator. Maintain a minimum distance of 1 meter to avoid localized desiccation.',
    ],
  },
  {
    id: 'upholstery-weaves',
    category: 'TEXTILE SELECTION',
    title: 'Linen, Bouclé, or Velvet: Selecting Upholstery for Real Homes',
    summary:
      'Balancing tactile luxury with durability. An honest breakdown of rub counts, natural soil resistance, and daily maintenance.',
    readTime: '4 min read',
    keyRule: 'Rule: For active family rooms, select natural fibers blended with tight double-wefts rated at 35,000+ Martindale rubs.',
    content: [
      'Belgian linen offers unmatched organic elegance and breathability during humid summer months. It naturally wrinkles and softens over time, developing an authentic relaxed patina.',
      'Himalayan wool bouclé provides rich three-dimensional texture and exceptional acoustic absorption in open-plan residences with tiled or timber floors. Natural wool lanolin repels water droplets if blotted promptly.',
      'For evening entertaining and reading corners, low-sheen combed cotton velvet provides deep, light-absorbing richness and exceptional durability exceeding 50,000 Martindale rubs.',
    ],
  },
];

export function DesignJournal() {
  const [selectedArticle, setSelectedArticle] = useState<JournalArticle | null>(null);

  return (
    <section className="design-journal showroom-extension section" id="designJournal">
      <div className="section-heading">
        <div>
          <span className="eyebrow">EDITORIAL &amp; EXPERTISE</span>
          <h2>The Design Journal</h2>
        </div>
        <p>
          Practical guides on proportions, carpet sizing, timber stewardship, and architectural ergonomics to help you make informed interior decisions.
        </p>
      </div>

      <div className="journal-articles-grid">
        {articles.map((art) => (
          <article key={art.id} className="journal-card">
            <div className="card-topline">
              <span className="art-cat">{art.category}</span>
              <span className="art-time">{art.readTime}</span>
            </div>
            <h3>{art.title}</h3>
            <p className="art-summary">{art.summary}</p>
            <div className="art-key-rule">
              <strong>{art.keyRule}</strong>
            </div>
            <button
              type="button"
              className="text-link"
              onClick={() => setSelectedArticle(art)}
            >
              Read full guide <Icon name="right" />
            </button>
          </article>
        ))}
      </div>

      {/* Reader Modal / Drawer */}
      {selectedArticle && (
        <div className="journal-modal-backdrop" onClick={() => setSelectedArticle(null)}>
          <div
            className="journal-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="journalModalTitle"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <span className="eyebrow">{selectedArticle.category}</span>
              <button
                type="button"
                className="close-button"
                aria-label="Close guide"
                onClick={() => setSelectedArticle(null)}
              >
                ✕
              </button>
            </div>
            <h2 id="journalModalTitle">{selectedArticle.title}</h2>
            <div className="modal-key-banner">
              <strong>Core Insight:</strong> {selectedArticle.keyRule}
            </div>
            <div className="modal-body-text">
              {selectedArticle.content.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="button outline"
                onClick={() => setSelectedArticle(null)}
              >
                Close guide
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default DesignJournal;
