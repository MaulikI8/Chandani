import { useState } from 'react';
import { useApp } from '../state/AppContext';
import { asset } from '../data/service';
import { Icon } from './Icon';

const materials = [
  { id: 'pu', title: 'PU Foam', image: 'pu-foam.webp', description: 'Polyurethane foam is used for cushioning and comfort. Ask about the options available for your intended use.' },
  { id: 'epe-roll', title: 'EPE Rolls', image: 'epe-foam.webp', description: 'Expanded polyethylene foam in roll form for cushioning and protective applications.' },
  { id: 'epe-sheet', title: 'EPE Sheets', image: 'epe-sheet.webp', description: 'Expanded polyethylene sheets for protective and industrial uses.' },
  { id: 'epe-cushion', title: 'EPE Cushions', image: 'epe-cushion.webp', description: 'EPE cushioning for protection and packaging applications.' },
];
export function MaterialsExplorer() {
  const [index, setIndex] = useState(0);
  const { query } = useApp();
  const item = materials[index];
  return <div className="materials-explorer" id="materialsExplorer">
    <div className="explorer-header"><div><span className="eyebrow">FOAM FOR DIFFERENT NEEDS</span><h3>Explore the materials.</h3><p>From cushioning to protective packaging, find a starting point for your enquiry.</p></div></div>
    <div className="swatch-chips" role="group" aria-label="Choose a foam type">{materials.map((material, i) => <button type="button" className={`variant-pill${index === i ? ' active' : ''}`} aria-pressed={index === i} key={material.id} onClick={() => setIndex(i)}>{material.title}</button>)}</div>
    <div className="cfi-material-preview"><img src={asset(`cfi/${item.image}`)} alt={item.title} loading="lazy" /><div><h4>{item.title}</h4><p>{item.description}</p><button type="button" className="text-link" onClick={() => query({ range: item.id }, '#catalogue')}>Explore this range <Icon /></button></div></div>
  </div>;
}
export default MaterialsExplorer;
