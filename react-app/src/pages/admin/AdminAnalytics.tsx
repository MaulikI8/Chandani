import React from 'react';
import { useAdmin } from '../../state/AdminContext';
import { TrendingUp, Eye, Compass, ShoppingBag, Users } from 'lucide-react';

export default function AdminAnalytics() {
  const { enquiries, products, carpets } = useAdmin();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
          Atelier Performance & Analytics
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
          Real-time room exploration engagement, category demand, and trade conversion
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginBottom: '24px' }}>
        <div className="admin-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Total Leads & Consultations</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>
            {enquiries.length}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>+28% this month</div>
        </div>

        <div className="admin-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Active Catalogue Pieces</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>
            {products.length} pieces
          </div>
          <div style={{ fontSize: '0.74rem', color: '#7952eb', fontWeight: 600 }}>Across 4 collections</div>
        </div>

        <div className="admin-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Carpet Studio Swatches</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>
            {carpets.length} colorways
          </div>
          <div style={{ fontSize: '0.74rem', color: '#d97706', fontWeight: 600 }}>Tibetan Highland Wool</div>
        </div>
      </div>

      <div className="admin-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', marginBottom: '16px' }}>
          Client Commission Distribution by Sector
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span>Trade Architects & Interior Designers</span>
              <strong>58%</strong>
            </div>
            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ width: '58%', height: '100%', background: '#7952eb' }} />
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span>Private Residential Clients</span>
              <strong>32%</strong>
            </div>
            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ width: '32%', height: '100%', background: '#06b6d4' }} />
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span>Material Swatch Box Dispatches</span>
              <strong>10%</strong>
            </div>
            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ width: '10%', height: '100%', background: '#f97316' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
