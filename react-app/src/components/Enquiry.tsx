import { useRef, useState } from 'react';
import { useApp } from '../state/AppContext';
import { buildDraft, type EnquiryFields } from '../state/enquiry';
import { cfiProducts } from '../data/cfiCatalogue';
import { business } from '../data/business';
import { Icon } from './Icon';

export function EnquiryForm() {
  const { content, products, saved, enquiry, setEnquiry, setPanel } = useApp();
  const fields = enquiry.fields;
  const choices = [...new Set([fields.interest, 'Product enquiry', 'Mattresses', 'PU Foam', 'EPE products', 'Furniture & interiors', 'Kitchen design', 'My shortlist', ...cfiProducts.map(p => p.name), ...content.products.map(p => p.name)])];
  function change(name: keyof EnquiryFields, value: string) {
    setEnquiry(previous => ({ ...previous, fields: { ...previous.fields, [name]: value },
      ...(name === 'interest' ? { selected: value === 'My shortlist' ? saved.map(id => products[id]).filter(Boolean) : content.products.filter(p => p.name === value) } : {}) }));
  }
  return <><h2 id="drawerTitle">What do you have in mind?</h2><p>Tell us what you’re looking for and prepare a message for the team.</p>
    <form className="enquiry-form" onSubmit={event => { event.preventDefault(); setEnquiry({ ...enquiry, message: buildDraft(enquiry) }); setPanel({ kind: 'draft' }); }}>
      <label htmlFor="interest">I’m interested in</label><select id="interest" name="interest" value={fields.interest} onChange={e => change('interest', e.target.value)}>{choices.map(choice => <option key={choice}>{choice}</option>)}</select>
      <div className="form-grid"><div><label htmlFor="enquiryName">Your name <span>(optional)</span></label><input id="enquiryName" autoComplete="name" value={fields.name} onChange={e => change('name', e.target.value)} /></div><div><label htmlFor="enquiryContact">Email or phone <span>(optional)</span></label><input id="enquiryContact" value={fields.contact} onChange={e => change('contact', e.target.value)} /></div></div>
      <label htmlFor="dimensions">Dimensions or quantity <span>(optional)</span></label><input id="dimensions" value={fields.dimensions} onChange={e => change('dimensions', e.target.value)} />
      {fields.interest.startsWith('Kitchen') && <><label htmlFor="kitchenLayout">Layout you have in mind</label><select id="kitchenLayout" value={fields.layout} onChange={e => change('layout', e.target.value)}>{['Not sure yet', 'Straight kitchen', 'L-shaped kitchen', 'U-shaped kitchen', 'Kitchen with an island'].map(layout => <option key={layout}>{layout}</option>)}</select></>}
      <label htmlFor="enquiryNotes">Your message <span>(optional)</span></label><textarea id="enquiryNotes" placeholder="Tell us about the product, project or application you have in mind." value={fields.notes} onChange={e => change('notes', e.target.value)} />
      <button className="button" type="submit">Prepare my enquiry <Icon /></button><p className="fineprint">Your message is prepared for you to copy or open in your email app. It is not sent automatically.</p>
    </form>
  </>;
}
export function EnquiryDraft() {
  const { enquiry, setEnquiry, setPanel, notify } = useApp();
  const input = useRef<HTMLTextAreaElement>(null);
  const [status, setStatus] = useState('Nothing has been sent.');
  async function copy() {
    try { await navigator.clipboard.writeText(enquiry.message); setStatus('Copied. You can paste your enquiry into a message.'); notify('Enquiry copied'); }
    catch { input.current?.focus(); input.current?.select(); setStatus('Select and copy the message above with your keyboard.'); }
  }
  const mailtoUrl = `mailto:${business.email}?subject=${encodeURIComponent(`Product enquiry: ${enquiry.fields.interest}`)}&body=${encodeURIComponent(enquiry.message)}`;
  return <><h2 id="drawerTitle">Your enquiry.</h2><p>Review your message before sharing it with the team.</p><label className="eyebrow" htmlFor="messagePreview" style={{ marginTop: 22 }}>YOUR MESSAGE</label><textarea ref={input} className="message-preview" id="messagePreview" value={enquiry.message} onChange={e => setEnquiry({ ...enquiry, message: e.target.value })} /><div className="draft-actions"><button type="button" className="button" onClick={copy}>Copy enquiry <Icon /></button><button type="button" className="button outline" onClick={() => setPanel({ kind: 'enquiry' })}>Edit details</button></div><div className="draft-direct-email"><a className="button outline direct-mail-btn" href={mailtoUrl}>Open in email client ↗</a></div><p className="fineprint" role="status">{status}</p></>;
}
