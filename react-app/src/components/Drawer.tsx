import { useLayoutEffect, useRef } from 'react';
import { useApp } from '../state/AppContext';
import { useDialog, outsideDialog } from '../hooks/useDialog';
import { Icon } from './Icon';
import { ProductDetails, Search, Shortlist } from './Products';
import { MobileNavigation } from './Navigation';
import { EnquiryDraft, EnquiryForm } from './Enquiry';

export function Drawer() {
  const { panel, products, closePanel } = useApp();
  const dialog = useDialog();
  const close = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    dialog.current!.scrollTop = 0;
    if (panel?.kind === 'search') dialog.current?.querySelector<HTMLInputElement>('input[type=search]')?.focus();
    else close.current?.focus({ preventScroll: true });
  }, [panel, dialog]);
  if (!panel) return null;
  const label = panel.kind === 'product' ? products[panel.id].type.toUpperCase() : {
    search: 'EXPLORE CHANDANI', shortlist: 'YOUR SELECTION', menu: 'CHANDANI', enquiry: 'LET’S TALK ABOUT YOUR HOME', draft: 'YOUR ENQUIRY', atelier: 'THE ATELIER STORY',
  }[panel.kind];
  return <dialog id="drawer" ref={dialog} data-lenis-prevent aria-labelledby="drawerTitle" onCancel={event => { event.preventDefault(); closePanel(); }} onClick={event => { if (outsideDialog(event)) closePanel(); }}>
    <div className="drawer-head"><span className="eyebrow">{label}</span><button ref={close} className="icon-button" onClick={closePanel} aria-label="Close panel"><Icon name="close" /></button></div>
    <div className="drawer-body">
      {panel.kind === 'product' && <ProductDetails id={panel.id} />}
      {panel.kind === 'search' && <Search />}
      {panel.kind === 'shortlist' && <Shortlist />}
      {panel.kind === 'menu' && <MobileNavigation />}
      {panel.kind === 'enquiry' && <EnquiryForm />}
      {panel.kind === 'draft' && <EnquiryDraft />}
      {panel.kind === 'atelier' && <AtelierDrawerStory />}
    </div>
  </dialog>;
}

export function AtelierDrawerStory() {
  const { openEnquiry } = useApp();
  return (
    <div className="drawer-atelier-story" style={{ padding: '4px 0 24px' }}>
      <h2 id="drawerTitle" style={{ fontSize: '28px', lineHeight: 1.15, marginBottom: '16px' }}>
        Crafted in silence.<br />Built for generations.
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.7, marginBottom: '24px' }}>
        In the ancient craft quarters of the Kathmandu Valley, Chandani brings together centuries of Newar woodworking tradition, Tibetan hand-knotted highland wool, and clean architectural lines.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
        <div style={{ background: 'var(--white)', border: '1px solid var(--line)', padding: '16px', borderRadius: '6px' }}>
          <span style={{ color: 'var(--rust)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>01 / Highland Tibetan Wool</span>
          <h4 style={{ margin: '4px 0 6px', fontSize: '15px' }}>Lanolin-Rich Mountain Fibers</h4>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
            Sheared above 3,500m and hand-spun on drop spindles. Naturally flame-retardant and soil-resistant with 100 knots per square inch.
          </p>
        </div>

        <div style={{ background: 'var(--white)', border: '1px solid var(--line)', padding: '16px', borderRadius: '6px' }}>
          <span style={{ color: 'var(--rust)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>02 / Patan Joinery</span>
          <h4 style={{ margin: '4px 0 6px', fontSize: '15px' }}>Mortise-and-Tenon Architecture</h4>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
            Bench-made solid walnut, oak, and sal wood frames crafted without synthetic screws, allowing the wood to breathe across seasons.
          </p>
        </div>

        <div style={{ background: 'var(--white)', border: '1px solid var(--line)', padding: '16px', borderRadius: '6px' }}>
          <span style={{ color: 'var(--rust)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>03 / Flagship Viewing Gallery</span>
          <h4 style={{ margin: '4px 0 6px', fontSize: '15px' }}>Baber Mahal Revisited · Courtyard II</h4>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
            Private viewing sessions by appointment. Touch raw wool skeins, timber finishes, and experience room scales in person.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button type="button" className="button" onClick={() => openEnquiry('Whole home')}>
          Book an Atelier Consultation →
        </button>
        <button type="button" className="button outline" onClick={() => openEnquiry('Material Swatches', 'swatch')}>
          Request Material &amp; Finish Samples
        </button>
      </div>
    </div>
  );
}

