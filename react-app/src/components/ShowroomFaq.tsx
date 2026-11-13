import { useState } from 'react';
import { business } from '../data/business';
const faqs = [
  { q: 'What does the company make?', a: 'The published range includes mattresses, PU foam, and EPE foam rolls, sheets and cushions.' },
  { q: 'Which mattress series are listed?', a: 'The catalogue groups mattresses into Comfort, Flexible Spring and Premium / Luxury series. Some mattresses appear in more than one series.' },
  { q: 'Where is the company based?', a: `The listed address is ${business.address}.` },
  { q: 'How do I ask about sizes and availability?', a: 'Choose a product and use the enquiry button, or contact the company directly by phone or email.' },
  { q: 'Can businesses enquire about foam?', a: 'Yes. The published company information describes products for furniture makers, hospitality and packaging applications.' },
];
export function ShowroomFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return <section className="showroom-faq showroom-extension section" id="faq"><div className="section-heading"><div><span className="eyebrow">GOOD TO KNOW</span><h2>Frequently asked questions.</h2></div><p>Start here, or get in touch for details about a specific product.</p></div><div className="faq-accordion-list">{faqs.map((item, index) => <div key={item.q} className={`faq-item${openIndex === index ? ' open' : ''}`}><button type="button" className="faq-question-btn" aria-expanded={openIndex === index} onClick={() => setOpenIndex(openIndex === index ? null : index)}><span>{item.q}</span><span className="faq-toggle-icon" aria-hidden="true">{openIndex === index ? '−' : '+'}</span></button>{openIndex === index && <div className="faq-answer-pane"><p>{item.a}</p></div>}</div>)}</div></section>;
}
export default ShowroomFaq;
