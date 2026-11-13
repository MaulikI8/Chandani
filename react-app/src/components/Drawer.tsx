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
  return <div className="drawer-atelier-story"><h2 id="drawerTitle">Comfort and protection, made in Nepal.</h2><p>Chadhani Foam Industries manufactures mattresses, PU foam and EPE foam products in eastern Nepal.</p><p>Titriban, Ramdhuni Municipality, Sunsari</p><p><a href="tel:+9779852048761">+977 9852048761</a><br /><a href="mailto:info@cfi.com.np">info@cfi.com.np</a></p><button type="button" className="button" onClick={() => openEnquiry('Product enquiry')}>Start an enquiry <Icon /></button></div>;
}
