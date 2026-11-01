import React, { useState } from 'react';
import { useAdmin, CouponItem } from '../../state/AdminContext';
import { Tag, Plus, Trash2, X, CheckCircle, Percent } from 'lucide-react';

export default function AdminCoupons() {
  const { coupons, addCoupon, toggleCoupon, deleteCoupon } = useAdmin();
  const [modalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(20);
  const [description, setDescription] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    addCoupon({
      code: code.toUpperCase().trim(),
      discountPercent: Number(discountPercent),
      description,
      active: true,
    });
    setCode('');
    setDescription('');
    setModalOpen(false);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Trade Accounts & Discount Coupons
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
            Manage architect trade privileges (−20%) and private patron introductory vouchers
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus size={16} /> Create Trade Code
        </button>
      </div>

      <div className="admin-card" style={{ overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Privilege / Discount</th>
              <th>Description</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c.code}>
                <td>
                  <code style={{ background: '#f5f3ff', color: '#7952eb', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', fontSize: '0.88rem' }}>
                    {c.code}
                  </code>
                </td>
                <td style={{ fontWeight: 700, color: '#0f172a' }}>
                  {c.discountPercent}% Off
                </td>
                <td style={{ color: '#64748b', fontSize: '0.84rem' }}>{c.description}</td>
                <td>
                  <button
                    onClick={() => toggleCoupon(c.code)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {c.active ? (
                      <span className="badge badge-emerald">Active</span>
                    ) : (
                      <span className="badge badge-rose">Paused</span>
                    )}
                  </button>
                </td>
                <td>
                  <button onClick={() => deleteCoupon(c.code)} className="btn-danger" style={{ padding: '6px 10px' }}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Create Trade Voucher</h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label className="admin-label">Trade Code (e.g. ARCHITECT20)</label>
                <input
                  type="text"
                  required
                  className="admin-input"
                  placeholder="ARCHITECT20"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="admin-label">Discount Percentage (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  className="admin-input"
                  value={discountPercent}
                  onChange={e => setDiscountPercent(Number(e.target.value))}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="admin-label">Description / Purpose</label>
                <input
                  type="text"
                  required
                  placeholder="Verified Interior Design Trade Account"
                  className="admin-input"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
