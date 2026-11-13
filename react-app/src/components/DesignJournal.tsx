const guides = [
  { label: 'FOR YOUR BEDROOM', title: 'Start with your space.', text: 'Measure the bed frame and room before choosing a mattress. Confirm the available sizes with the team.' },
  { label: 'FOR FURNITURE MAKERS', title: 'Think about the application.', text: 'When enquiring about foam, share what you are making and the dimensions you need.' },
  { label: 'FOR PACKAGING', title: 'Choose the right format.', text: 'EPE is listed in rolls, sheets and cushions. Describe the item you need to protect when you enquire.' },
];
export function DesignJournal() {
  return <section className="design-journal showroom-extension section" id="designJournal"><div className="section-heading"><div><span className="eyebrow">A LITTLE GUIDANCE</span><h2>Before you choose.</h2></div><p>Helpful details to have in mind when exploring a product.</p></div><div className="journal-articles-grid">{guides.map(item => <article className="journal-card" key={item.title}><div className="card-topline"><span className="art-cat">{item.label}</span></div><h3>{item.title}</h3><p className="art-summary">{item.text}</p></article>)}</div></section>;
}
export default DesignJournal;
