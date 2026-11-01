import React, { useState } from 'react';
import { useAdmin, CarpetColorway } from '../../state/AdminContext';
import { Sparkles, Plus, Trash2, X } from 'lucide-react';

export default function AdminCarpets() {
  const { carpets, addCarpetVariant, deleteCarpetVariant } = useAdmin();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [colorName, setColorName] = useState('');
  const [hexCode, setHexCode] = useState('#b4532a');
  const [priceNpr, setPriceNpr] = useState(185000);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !colorName) return;
    addCarpetVariant({
      colorId: colorName.toLowerCase().replace(/\s+/g, '-'),
      name,
      colorName,
      palette: colorName,
      hexCode,
      materialDescription: '100% Hand-spun Tibetan Highland Wool woven in Patan/Kathmandu',
      imageDay: 'product-chalk.webp',
      priceNpr: Number(priceNpr),
    });
    setName('');
    setColorName('');
    setModalOpen(false);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Carpet Studio & Colorways
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
            Himalayan Highland Wool hand-knotted custom rugs, color swatches, and day/evening previews
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus size={16} /> Add Colorway
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {carpets.map(c => (
          <div key={c.colorId} className="admin-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: c.hexCode,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  border: '2px solid #ffffff',
                }}
              />
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>{c.name}</h3>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{c.palette}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '14px', lineHeight: 1.5 }}>
              {c.materialDescription}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                रू {c.priceNpr.toLocaleString()}
              </span>
              <button onClick={() => deleteCarpetVariant(c.colorId)} className="btn-danger" style={{ padding: '4px 8px' }}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Add Carpet Colorway</h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label className="admin-label">Colorway Title (e.g. Frame / Chalk)</label>
                <input
                  type="text"
                  required
                  className="admin-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="admin-label">Color Name (e.g. Terracotta Ochre)</label>
                <input
                  type="text"
                  required
                  className="admin-input"
                  value={colorName}
                  onChange={e => setColorName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label className="admin-label">Hex Swatch</label>
                  <input
                    type="color"
                    className="admin-input"
                    style={{ height: '42px', padding: '4px' }}
                    value={hexCode}
                    onChange={e => setHexCode(e.target.value)}
                  />
                </div>
                <div>
                  <label className="admin-label">Price 8x10ft (NPR)</label>
                  <input
                    type="number"
                    required
                    className="admin-input"
                    value={priceNpr}
                    onChange={e => setPriceNpr(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Colorway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
