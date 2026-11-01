import React, { useState } from 'react';
import { useAdmin } from '../../state/AdminContext';
import { Save, Check } from 'lucide-react';

export default function AdminContent() {
  const { siteSettings, updateSiteSettings } = useAdmin();
  const [formData, setFormData] = useState({ ...siteSettings });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Showrooms & Atelier Profile
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
            Manage Baber Mahal showroom, Patan workshop, concierge WhatsApp, and announcement banner
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="admin-card" style={{ padding: '28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label className="admin-label">Atelier Name</label>
            <input
              type="text"
              className="admin-input"
              value={formData.atelierName}
              onChange={e => setFormData({ ...formData, atelierName: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">Nepali Name</label>
            <input
              type="text"
              className="admin-input"
              value={formData.atelierNameNepali}
              onChange={e => setFormData({ ...formData, atelierNameNepali: e.target.value })}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label className="admin-label">Announcement Banner Text</label>
          <input
            type="text"
            className="admin-input"
            value={formData.announcementText}
            onChange={e => setFormData({ ...formData, announcementText: e.target.value })}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label className="admin-label">Showroom Address (Kathmandu)</label>
            <input
              type="text"
              className="admin-input"
              value={formData.addressShowroom}
              onChange={e => setFormData({ ...formData, addressShowroom: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">Craft Quarter Workshop (Patan/Lalitpur)</label>
            <input
              type="text"
              className="admin-input"
              value={formData.addressWorkshop}
              onChange={e => setFormData({ ...formData, addressWorkshop: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label className="admin-label">Primary Telephone</label>
            <input
              type="text"
              className="admin-input"
              value={formData.phonePrimary}
              onChange={e => setFormData({ ...formData, phonePrimary: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">WhatsApp Concierge Number</label>
            <input
              type="text"
              className="admin-input"
              value={formData.whatsappNumber}
              onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
          <div>
            <label className="admin-label">Official Atelier Email</label>
            <input
              type="email"
              className="admin-input"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">Trade Architecture Discount (%)</label>
            <input
              type="number"
              className="admin-input"
              value={formData.tradeDiscountPercent}
              onChange={e => setFormData({ ...formData, tradeDiscountPercent: Number(e.target.value) })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '14px' }}>
          {saved && <span style={{ color: '#059669', fontSize: '0.84rem', fontWeight: 600 }}>✓ Saved successfully</span>}
          <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>
            <Save size={16} /> Save Atelier Settings
          </button>
        </div>
      </form>
    </div>
  );
}
