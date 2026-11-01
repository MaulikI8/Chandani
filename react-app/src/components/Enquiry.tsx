import { useRef, useState } from 'react';
import { useApp } from '../state/AppContext';
import { buildDraft, type EnquiryFields } from '../state/enquiry';
import { Icon } from './Icon';

function estimateArea(dimStr: string) {
  const match = dimStr.match(/(\d+(?:\.\d+)?)\s*(?:m)?\s*[×x*]\s*(\d+(?:\.\d+)?)/i);
  if (!match) return null;
  const w = parseFloat(match[1]);
  const l = parseFloat(match[2]);
  if (isNaN(w) || isNaN(l) || w <= 0 || l <= 0) return null;
  const areaM2 = (w * l).toFixed(1);
  const areaSqFt = Math.round(w * l * 10.764);
  return { areaM2, areaSqFt };
}

export function EnquiryForm() {
  const { content, products, saved, enquiry, setEnquiry, setPanel } = useApp();
  const fields = enquiry.fields;
  const choices = [...new Set([fields.interest, 'Whole home', 'Kitchen design', 'Living room', 'Bedroom', 'Dining room', 'My shortlist', ...content.products.map(p => p.name)])];
  const dimensionPresets = ['4 m × 3 m', '5 m × 4 m', '6 m × 4 m', '3.5 m × 3 m'];
  const areaEst = estimateArea(fields.dimensions);

  const filledCount = [
    fields.interest,
    fields.name || fields.contact,
    fields.dimensions,
    fields.notes
  ].filter(Boolean).length;

  function change(name: keyof EnquiryFields, value: string) {
    setEnquiry(previous => ({ ...previous, fields: { ...previous.fields, [name]: value },
      ...(name === 'interest' ? { selected: value === 'My shortlist' ? saved.map(id => products[id]) : content.products.filter(p => p.name === value) } : {}) }));
  }
  return <><h2 id="drawerTitle">What do you have in mind?</h2><p>Start with a piece, a room or an idea.</p>
    <div className="enquiry-client-types" role="tablist" aria-label="Select enquiry type">
      <button
        type="button"
        role="tab"
        aria-selected={fields.clientType === 'private' || !fields.clientType}
        className={`enquiry-type-tab${fields.clientType === 'private' || !fields.clientType ? ' active' : ''}`}
        onClick={() => change('clientType', 'private')}
      >
        Private Client
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={fields.clientType === 'trade'}
        className={`enquiry-type-tab${fields.clientType === 'trade' ? ' active' : ''}`}
        onClick={() => change('clientType', 'trade')}
      >
        Trade &amp; Designers <span className="tab-badge">Pro</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={fields.clientType === 'swatch'}
        className={`enquiry-type-tab${fields.clientType === 'swatch' ? ' active' : ''}`}
        onClick={() => change('clientType', 'swatch')}
      >
        Material Samples <span className="tab-badge">Review</span>
      </button>
    </div>

    {fields.clientType === 'trade' && (
      <div className="trade-perks-banner">
        <div className="trade-perks-header">
          <strong>Architect &amp; Interior Design Concierge</strong>
          <span className="trade-status-pill">● Verified Trade Accounts</span>
        </div>
        <p className="trade-perks-sub">Exclusive commercial &amp; residential benefits for design professionals:</p>
        <ul className="trade-perks-list">
          <li>Tiered 20% trade discount on bespoke orders (रू 15,00,000+); 25% on whole-home specifications</li>
          <li>Direct workshop concierge with 24h quotation &amp; finish customization turnaround</li>
          <li>Instant 2D/3D CAD (.DWG, .OBJ) files and high-resolution material textures</li>
          <li>COM (Customer’s Own Material) tailoring &amp; commercial contract fire ratings</li>
        </ul>
      </div>
    )}

    {fields.clientType === 'swatch' && (
      <div className="swatch-perks-banner">
        <div className="swatch-perks-header">
          <strong>Complimentary Curated Material Box</strong>
          <span className="trade-status-pill">● Dispatches in 48h</span>
        </div>
        <p className="swatch-perks-sub">Feel the textures in your home’s natural lighting before ordering:</p>
        <div className="swatch-kit-preview" aria-label="Included swatches">
          <div className="swatch-chip-item"><span className="swatch-sample wood-oak" /> <span>Solid European Oak</span></div>
          <div className="swatch-chip-item"><span className="swatch-sample wood-walnut" /> <span>American Black Walnut</span></div>
          <div className="swatch-chip-item"><span className="swatch-sample fabric-linen" /> <span>Belgian Oatmeal Linen</span></div>
          <div className="swatch-chip-item"><span className="swatch-sample fabric-wool" /> <span>New Zealand Wool</span></div>
        </div>
      </div>
    )}

    <div className="enquiry-progress-strip" aria-label="Enquiry completeness">
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${(filledCount / 4) * 100}%` }} />
      </div>
      <span className="progress-label">{filledCount} of 4 details provided</span>
    </div>

    <form className="enquiry-form" onSubmit={event => { event.preventDefault(); setEnquiry({ ...enquiry, message: buildDraft(enquiry) }); setPanel({ kind: 'draft' }); }}>
      <label htmlFor="interest">I’m interested in</label>
      <select id="interest" name="interest" value={fields.interest} onChange={e => change('interest', e.target.value)}>
        {choices.map(choice => <option key={choice}>{choice}</option>)}
      </select>

      {fields.clientType === 'trade' && (
        <div className="form-grid">
          <div>
            <label htmlFor="firmName">Design practice / Firm <span>(optional)</span></label>
            <input id="firmName" name="firmName" placeholder="e.g. Studio Harrison & Partners" value={fields.firmName ?? ''} onChange={e => change('firmName', e.target.value)} />
          </div>
          <div>
            <label htmlFor="projectScope">Project typology</label>
            <select id="projectScope" name="projectScope" value={fields.projectScope ?? 'High-End Private Residence'} onChange={e => change('projectScope', e.target.value)}>
              {['High-End Private Residence', 'Boutique Hotel / Hospitality', 'Commercial / Executive Office', 'Multi-Residential Development', 'Showhome Staging'].map(opt => <option key={opt}>{opt}</option>)}
            </select>
          </div>
        </div>
      )}

      {fields.clientType === 'swatch' && (
        <div>
          <label htmlFor="shippingAddress">Delivery address &amp; postal code <span>(optional)</span></label>
          <input id="shippingAddress" name="shippingAddress" placeholder="Street address, city, postal code" value={fields.shippingAddress ?? ''} onChange={e => change('shippingAddress', e.target.value)} />
        </div>
      )}

      <div className="form-grid">
        <div>
          <label htmlFor="enquiryName">Your name <span>(optional)</span></label>
          <input id="enquiryName" name="name" autoComplete="name" value={fields.name} onChange={e => change('name', e.target.value)} />
        </div>
        <div>
          <label htmlFor="enquiryContact">Email or phone <span>(optional)</span></label>
          <input id="enquiryContact" name="contact" value={fields.contact} onChange={e => change('contact', e.target.value)} />
        </div>
      </div>

      <div hidden={!fields.interest.startsWith('Kitchen')}>
        <label htmlFor="kitchenLayout">Layout you have in mind</label>
        <select id="kitchenLayout" name="layout" value={fields.layout} onChange={e => change('layout', e.target.value)}>
          {['Not sure yet', 'Straight kitchen', 'L-shaped kitchen', 'U-shaped kitchen', 'Kitchen with an island'].map(layout => <option key={layout}>{layout}</option>)}
        </select>
      </div>

      {fields.clientType !== 'swatch' && (
        <>
          <label htmlFor="dimensions">Room dimensions <span>(optional)</span></label>
          <input id="dimensions" name="dimensions" placeholder="For example, 4 m × 3 m" value={fields.dimensions} onChange={e => change('dimensions', e.target.value)} />
          <div className="dimension-presets" role="group" aria-label="Quick room dimension suggestions">
            {dimensionPresets.map(preset => (
              <button
                key={preset}
                type="button"
                className={`preset-chip${fields.dimensions === preset ? ' active' : ''}`}
                onClick={() => change('dimensions', preset)}
              >
                {preset}
              </button>
            ))}
          </div>
          {areaEst && (
            <div className="enquiry-area-helper" aria-live="polite">
              <span className="area-symbol">📐</span>
              <span>Estimated floor area: <strong>~{areaEst.areaM2} m²</strong> ({areaEst.areaSqFt} sq ft)</span>
            </div>
          )}
        </>
      )}

      <label htmlFor="enquiryNotes">A little about your space &amp; timeline <span>(optional)</span></label>
      <textarea id="enquiryNotes" name="notes" placeholder={fields.clientType === 'trade' ? 'Project location, square footage, CAD requirements, or installation deadline...' : 'What would you like to change? Any colours or ideas in mind?'} value={fields.notes} onChange={e => change('notes', e.target.value)} />
      <div className="enquiry-char-helper">
        <span>{fields.notes.length} characters</span>
        {fields.notes.length > 25 && <span className="notes-pill">● Helpful detail</span>}
      </div>
      <button className="button" type="submit">Prepare my enquiry <Icon /></button>
      <p className="fineprint">This preview prepares a draft for you to copy. It does not send your details.</p>
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
  const mailtoUrl = `mailto:studio@chandani.interior?subject=${encodeURIComponent(`Chandani Interior Consultation: ${enquiry.fields.interest}`)}&body=${encodeURIComponent(enquiry.message)}`;

  return <><h2 id="drawerTitle">A starting point.</h2><p>Your draft is ready to copy and share with Chandani.</p>
    <label className="eyebrow" htmlFor="messagePreview" style={{ marginTop: 22 }}>YOUR MESSAGE</label><textarea ref={input} className="message-preview" id="messagePreview" value={enquiry.message} onChange={e => setEnquiry({ ...enquiry, message: e.target.value })} />
    <div className="draft-actions">
      <button className="button" onClick={copy}>Copy enquiry <Icon /></button>
      <button className="button outline" onClick={() => setPanel({ kind: 'enquiry' })}>Edit details</button>
    </div>
    <div className="draft-direct-email">
      <a className="button outline direct-mail-btn" href={mailtoUrl}>
        Open in email client ↗
      </a>
    </div>
    <p className="fineprint" role="status">{status}</p>
  </>;
}
