import React from 'react';
import { Camera, Eye, MapPin, Sliders } from 'lucide-react';

export default function AdminRooms() {
  const rooms = [
    {
      id: 'living',
      number: '01',
      title: 'Living Room · Chalk Wide',
      image: '/hero-chalk-wide.webp',
      hotspotsCount: 4,
      pieces: ['Haven Sofa', 'Frame Chalk Carpet', 'Low Table'],
    },
    {
      id: 'evening',
      number: '02',
      title: 'Evening Study & Lounge',
      image: '/without-sofa.webp',
      hotspotsCount: 2,
      pieces: ['Study Table', 'Baber Armchair'],
    },
    {
      id: 'kitchen',
      number: '03',
      title: 'Architectural Kitchen & Millwork',
      image: '/hero-chalk-wide.webp',
      hotspotsCount: 3,
      pieces: ['Linear Island', 'Smoked Oak Cabinetry'],
    },
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
          Model Showcase & Try The Room Explorer
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
          Configure 3D room scenes, hotspot pins, and day-to-evening comparison sliders
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {rooms.map(r => (
          <div key={r.id} className="admin-card" style={{ overflow: 'hidden' }}>
            <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
              <img
                src={r.image}
                alt={r.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).src = '/hero-chalk-wide.webp'; }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  color: '#ffffff',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  backdropFilter: 'blur(4px)',
                }}
              >
                Room {r.number}
              </span>
            </div>

            <div style={{ padding: '18px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>
                {r.title}
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '14px' }}>
                {r.hotspotsCount} Interactive Hotspots Active
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {r.pieces.map((p, i) => (
                  <span key={i} className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                    {p}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <a href="/?room=living" target="_blank" rel="noreferrer" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  <Eye size={14} /> Preview Scene
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
