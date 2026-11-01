import React from 'react';
import { useAdmin } from '../../state/AdminContext';
import { MessageSquare, Star, Quote } from 'lucide-react';

export default function AdminTestimonials() {
  const { testimonials } = useAdmin();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
          Patron & Architect Testimonials
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
          Client stories and architectural features for Chandani pieces and wool rugs
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {testimonials.map(t => (
          <div key={t.id} className="admin-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '3px', color: '#f59e0b', marginBottom: '12px' }}>
              {[...Array(t.rating)].map((_, i) => (
                <Star key={i} size={14} fill="#f59e0b" />
              ))}
            </div>
            <p style={{ fontSize: '0.88rem', color: '#334155', fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 16px' }}>
              "{t.quote}"
            </p>
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{t.author}</div>
              <div style={{ fontSize: '0.74rem', color: '#7952eb', fontWeight: 600 }}>{t.role}</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>📍 {t.location}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
