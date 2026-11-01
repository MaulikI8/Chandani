import React, { useState } from 'react';
import { useAdmin, CategoryItem } from '../../state/AdminContext';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export default function AdminCategories() {
  const { categories, products, addCategory, deleteCategory } = useAdmin();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [nepaliName, setNepaliName] = useState('');
  const [slug, setSlug] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;
    addCategory({
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
      name,
      nepaliName,
      sortOrder: categories.length + 1,
    });
    setName('');
    setNepaliName('');
    setSlug('');
    setModalOpen(false);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Atelier Collections & Categories
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
            Structure furniture categories, hand-knotted carpets, and kitchen interior sections
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="admin-card" style={{ overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Collection Name</th>
              <th>Nepali Title</th>
              <th>Slug / Identifier</th>
              <th>Pieces Count</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c, i) => {
              const count = products.filter(p => p.category === c.slug).length;
              return (
                <tr key={c.slug}>
                  <td style={{ color: '#94a3b8', fontWeight: 600 }}>0{i + 1}</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{c.name}</td>
                  <td style={{ color: '#64748b' }}>{c.nepaliName || '—'}</td>
                  <td>
                    <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', color: '#7952eb' }}>
                      {c.slug}
                    </code>
                  </td>
                  <td>
                    <span className="badge badge-purple">{count} pieces</span>
                  </td>
                  <td>
                    <button
                      onClick={() => { if (confirm(`Delete ${c.name}?`)) deleteCategory(c.slug); }}
                      className="btn-danger"
                      style={{ padding: '6px 10px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Add New Category</h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label className="admin-label">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Architectural Millwork"
                  className="admin-input"
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="admin-label">Nepali Name</label>
                <input
                  type="text"
                  placeholder="e.g. आर्किटेक्चरल काठकाम"
                  className="admin-input"
                  value={nepaliName}
                  onChange={e => setNepaliName(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="admin-label">Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. millwork"
                  className="admin-input"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
