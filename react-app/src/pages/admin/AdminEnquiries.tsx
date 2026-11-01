import React, { useState } from 'react';
import { useAdmin, EnquiryItem } from '../../state/AdminContext';
import { Search, Filter, Printer, Eye, Trash2, X, CheckCircle, Mail, Phone } from 'lucide-react';

export default function AdminEnquiries() {
  const { enquiries, updateEnquiryStatus, deleteEnquiry } = useAdmin();
  const [filterType, setFilterType] = useState<'all' | 'private' | 'trade' | 'swatch'>('all');
  const [search, setSearch] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryItem | null>(null);

  const filtered = enquiries.filter(e => {
    const matchesType = filterType === 'all' || e.clientType === filterType;
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      (e.firmName && e.firmName.toLowerCase().includes(search.toLowerCase())) ||
      e.id.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handlePrint = (e: EnquiryItem) => {
    window.print();
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Client Enquiries & Consultation Orders
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
            Manage private commissions, trade interior architects, and swatch box dispatches
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {(['all', 'trade', 'private', 'swatch'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: filterType === tab ? '1px solid #ddd6fe' : '1px solid #e2e8f0',
              background: filterType === tab ? '#f5f3ff' : '#ffffff',
              color: filterType === tab ? '#7952eb' : '#64748b',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'all' ? `All Enquiries (${enquiries.length})` : tab === 'trade' ? 'Trade Architects (−20%)' : tab === 'private' ? 'Private Clients' : 'Swatch Box Requests'}
          </button>
        ))}
      </div>

      {/* Enquiries Table */}
      <div className="admin-card" style={{ overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Client / Firm</th>
              <th>Type</th>
              <th>Interest / Scope</th>
              <th>Quoted Value</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id}>
                <td style={{ fontWeight: 600, color: '#7952eb', fontFamily: 'monospace' }}>{e.id}</td>
                <td>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{e.name}</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{e.firmName || e.email}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{e.phone}</div>
                </td>
                <td>
                  {e.clientType === 'trade' && <span className="badge badge-purple">Trade (−20%)</span>}
                  {e.clientType === 'swatch' && <span className="badge badge-sky">Swatch Box</span>}
                  {e.clientType === 'private' && <span className="badge badge-amber">Private Client</span>}
                </td>
                <td style={{ maxWidth: '300px' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1e293b' }}>{e.interest}</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e.projectScope || e.notes || 'General enquiry'}
                  </div>
                </td>
                <td style={{ fontWeight: 700, color: '#0f172a' }}>
                  {e.quotedTotal > 0 ? `रू ${e.quotedTotal.toLocaleString()}` : 'Sample Request'}
                </td>
                <td>
                  <select
                    className="admin-select"
                    style={{ fontSize: '0.76rem', padding: '4px 8px', borderRadius: '8px' }}
                    value={e.status}
                    onChange={ev => updateEnquiryStatus(e.id, ev.target.value as any)}
                  >
                    <option value="new">● New Lead</option>
                    <option value="contacted">Contacted</option>
                    <option value="in_progress">⏳ In Consultation</option>
                    <option value="fulfilled">✓ Fulfilled / Shipped</option>
                    <option value="closed">Closed</option>
                  </select>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => setSelectedEnquiry(e)} className="btn-secondary" style={{ padding: '6px 10px' }} title="View details">
                      <Eye size={14} />
                    </button>
                    <button onClick={() => { if (confirm(`Delete enquiry ${e.id}?`)) deleteEnquiry(e.id); }} className="btn-danger" style={{ padding: '6px 10px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedEnquiry && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  Enquiry #{selectedEnquiry.id}
                </h2>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Received on {new Date(selectedEnquiry.createdAt).toLocaleString()}
                </div>
              </div>
              <button onClick={() => setSelectedEnquiry(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Client Info</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginTop: '4px' }}>{selectedEnquiry.name}</div>
                  {selectedEnquiry.firmName && <div style={{ fontSize: '0.8rem', color: '#7952eb', fontWeight: 600 }}>{selectedEnquiry.firmName}</div>}
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '6px' }}>✉ {selectedEnquiry.email}</div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>📞 {selectedEnquiry.phone}</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Project Scope</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginTop: '4px' }}>{selectedEnquiry.interest}</div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '6px' }}>
                    Quoted Estimate: <strong style={{ color: '#0f172a' }}>रू {selectedEnquiry.quotedTotal.toLocaleString()}</strong>
                  </div>
                  {selectedEnquiry.roomDimensions && (
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                      Dimensions: {selectedEnquiry.roomDimensions}
                    </div>
                  )}
                </div>
              </div>

              {selectedEnquiry.shippingAddress && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="admin-label">Sample Swatch Shipping Address</label>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '0.85rem' }}>
                    {selectedEnquiry.shippingAddress}
                  </div>
                </div>
              )}

              {selectedEnquiry.notes && (
                <div style={{ marginBottom: '20px' }}>
                  <label className="admin-label">Notes & Specifications</label>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '0.85rem' }}>
                    {selectedEnquiry.notes}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <a
                  href={`https://wa.me/${selectedEnquiry.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  Contact via WhatsApp →
                </a>
                <button onClick={() => window.print()} className="btn-primary">
                  <Printer size={16} /> Print Consultation Sheet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
