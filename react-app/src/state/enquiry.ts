import type { Product } from '../data/types.ts';

export type EnquiryFields = {
  interest: string;
  name: string;
  contact: string;
  dimensions: string;
  layout: string;
  notes: string;
  clientType?: 'private' | 'trade' | 'swatch';
  firmName?: string;
  projectScope?: string;
  shippingAddress?: string;
};
export type EnquiryState = { fields: EnquiryFields; selected: Pick<Product, 'id' | 'name' | 'palette'>[]; message: string };
export function newEnquiry(interest: string, selected: Product[]): EnquiryState {
  return {
    fields: { interest, name: '', contact: '', dimensions: '', layout: 'Not sure yet', notes: '', clientType: 'private' },
    selected: selected.map(({ id, name, palette }) => ({ id, name, palette })),
    message: ''
  };
}
export function buildDraft({ fields, selected }: EnquiryState): string {
  const lines = ['Hello Chandani,', '', `I’m interested in: ${fields.interest}.`];
  if (fields.clientType === 'trade' && fields.firmName?.trim()) {
    lines.push(`Trade Partner / Firm: ${fields.firmName.trim()}`);
  }
  if (fields.clientType === 'swatch' && fields.shippingAddress?.trim()) {
    lines.push(`Material sample delivery address: ${fields.shippingAddress.trim()}`);
  }
  if (fields.projectScope?.trim()) {
    lines.push(`Project scope & estimate: ${fields.projectScope.trim()}`);
  }
  if (selected.length) lines.push('My selection: ' + selected.map(p => `${p.name} (${p.palette})`).join(', ') + '.');
  if (fields.interest.startsWith('Kitchen')) lines.push(`Preferred layout: ${fields.layout}.`);
  if (fields.dimensions.trim()) lines.push('Room dimensions: ' + fields.dimensions.trim());
  if (fields.notes.trim()) lines.push('', fields.notes.trim());
  if (fields.name.trim()) lines.push('', 'Name: ' + fields.name.trim());
  if (fields.contact.trim()) lines.push('Contact: ' + fields.contact.trim());
  lines.push('', 'Please share the next steps and available options.');
  return lines.join('\n');
}
