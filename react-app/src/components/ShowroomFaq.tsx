import { useState } from 'react';

interface FaqItem {
  q: string;
  a: string;
}

const faqs: FaqItem[] = [
  {
    q: 'Where are Chandani furniture pieces and carpets crafted?',
    a: 'All joinery, cabinetry, and custom upholstery are produced in our workshop in Patan/Lalitpur by skilled master woodworkers. Our hand-knotted carpets are woven on traditional vertical looms in Kathmandu Valley using hand-spun Tibetan highland sheep wool and organic mineral-wash dyes.',
  },
  {
    q: 'Can dimensions, timber species, or fabrics be customized for my space?',
    a: 'Yes. Because every piece is made to order rather than mass-imported, dining tables, sofas, beds, and storage units can be tailored to your room dimensions. You can select between native Solid Sisau (Indian Rosewood), American Walnut, European White Oak, and custom upholstery weaves.',
  },
  {
    q: 'What are the realistic production and delivery timelines?',
    a: 'Selected pieces in standard sizes are ready for immediate viewing and delivery from our showroom floor. Made-to-order timber pieces typically take 3 to 5 weeks for timber seasoning, joinery, and oil curing. Custom-dimension hand-knotted rugs take 6 to 8 weeks depending on knot count and scale.',
  },
  {
    q: 'How does delivery and room installation work across Nepal?',
    a: 'For residences in Kathmandu, Lalitpur, and Bhaktapur, our team handles direct scheduled delivery, indoor positioning, leveling, and protective packaging removal. For deliveries across Nepal (including Pokhara, Chitwan, and Biratnagar), we coordinate insured freight with specialized crate packaging.',
  },
  {
    q: 'How can I inspect physical wood samples and fabric weaves before deciding?',
    a: 'You can visit our Baber Mahal gallery by appointment to touch real timber finishes and raw wool skeins under natural light. You can also request material samples during an initial interior design consultation.',
  },
  {
    q: 'What warranty and maintenance support does Chandani provide?',
    a: 'All solid timber frames carry a 5-year structural joinery warranty. We also provide organic maintenance wax-oil kits and offer workshop re-polishing and professional wool rug care services throughout Kathmandu.',
  },
];

export function ShowroomFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="showroom-faq showroom-extension section" id="faq">
      <div className="section-heading">
        <div>
          <span className="eyebrow">COMMERCIAL INTEGRITY &amp; DETAILS</span>
          <h2>Frequently Asked Questions</h2>
        </div>
        <p>
          Transparent answers about production origin, custom dimensions, delivery logistics in Nepal, and long-term timber warranty.
        </p>
      </div>

      <div className="faq-accordion-list">
        {faqs.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className={`faq-item${isOpen ? ' open' : ''}`}>
              <button
                type="button"
                className="faq-question-btn"
                aria-expanded={isOpen}
                onClick={() => toggle(idx)}
              >
                <span>{item.q}</span>
                <span className="faq-toggle-icon" aria-hidden="true">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="faq-answer-pane">
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ShowroomFaq;
