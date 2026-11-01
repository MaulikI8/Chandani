import React, { useState } from 'react';
import { useAdmin, ProductItem } from '../../state/AdminContext';
import { Plus, Search, Filter, Edit2, Trash2, CheckCircle2, X } from 'lucide-react';

export default function AdminProducts() {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useAdmin();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  const [formData, setFormData] = useState<Partial<ProductItem>>({
    id: '',
    name: '',
    nepaliName: '',
    category: 'seating',
    type: 'Sofas & seating',
    priceNpr: 185000,
    image: 'sofa.webp',
    palette: 'Oatmeal',
    text: '',
    scene: 'living',
    featured: false,
    dimensions: {
      width: '240 cm',
      depth: '102 cm',
      height: '76 cm',
      seatHeight: '42 cm',
    },
    materialsList: ['Solid beech timber', 'Natural linen-cotton weave'],
    finishDetails: 'Textured Oatmeal linen blend with matte smoked oak plinth.',
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.nepaliName && p.nepaliName.includes(search)) ||
      p.palette.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      id: `piece-${Date.now().toString().slice(-4)}`,
      name: '',
      nepaliName: '',
      category: 'seating',
      type: 'Sofas & seating',
      priceNpr: 120000,
      image: 'sofa.webp',
      palette: '',
      text: '',
      scene: 'living',
      featured: false,
      dimensions: { width: '', depth: '', height: '', seatHeight: '' },
      materialsList: ['Handcrafted solid timber frame'],
      finishDetails: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: ProductItem) => {
    setEditingProduct(p);
    setFormData({ ...p });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.id) return;

    if (editingProduct) {
      updateProduct(formData as ProductItem);
    } else {
      addProduct(formData as ProductItem);
    }
    setModalOpen(false);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Bespoke Pieces & Catalogue
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
            Manage Chandani furniture, hand-knotted carpets, and architectural objects
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary">
          <Plus size={16} /> Add New Piece
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
          <input
            type="text"
            className="admin-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search piece by name, Nepali title, palette, or material..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Filter size={16} color="#64748b" />
          <select
            className="admin-select"
            style={{ width: 'auto' }}
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map(c => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Piece</th>
                <th>Category</th>
                <th>Dimensions</th>
                <th>Price (NPR)</th>
                <th>Palette</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={`/${p.image}`}
                        alt={p.name}
                        style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', background: '#f8fafc', border: '1px solid #f1f5f9' }}
                        onError={(e) => { (e.target as HTMLImageElement).src = '/hero-chalk-wide.webp'; }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.name}</div>
                        {p.nepaliName && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{p.nepaliName}</div>}
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace' }}>ID: {p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
                      {p.category}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: '#475569' }}>
                    {p.dimensions?.width ? `${p.dimensions.width} × ${p.dimensions.depth || ''}` : 'Custom Sizing'}
                  </td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>
                    रू {p.priceNpr.toLocaleString()}
                  </td>
                  <td>
                    <span className="badge badge-sky">{p.palette || 'Natural'}</span>
                  </td>
                  <td>
                    {p.featured ? (
                      <span className="badge badge-emerald">
                        <CheckCircle2 size={12} /> Yes
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>—</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleOpenEdit(p)} className="btn-secondary" style={{ padding: '6px 10px' }} title="Edit piece">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => { if (confirm(`Remove ${p.name}?`)) deleteProduct(p.id); }} className="btn-danger" style={{ padding: '6px 10px' }} title="Delete piece">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                {editingProduct ? 'Edit Atelier Piece' : 'Add New Atelier Piece'}
              </h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="admin-label">Piece Name (e.g. Haven / Sofa)</label>
                  <input
                    type="text"
                    required
                    className="admin-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="admin-label">Nepali Name (e.g. हेभन सोफा)</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={formData.nepaliName}
                    onChange={e => setFormData({ ...formData, nepaliName: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="admin-label">Category</label>
                  <select
                    className="admin-select"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(c => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="admin-label">Price (NPR / रू)</label>
                  <input
                    type="number"
                    required
                    className="admin-input"
                    value={formData.priceNpr}
                    onChange={e => setFormData({ ...formData, priceNpr: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="admin-label">Palette / Finish (e.g. Oatmeal)</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={formData.palette}
                    onChange={e => setFormData({ ...formData, palette: e.target.value })}
                  />
                </div>
                <div>
                  <label className="admin-label">Image File (e.g. sofa.webp)</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={formData.image}
                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="admin-label">Architectural Description</label>
                <textarea
                  className="admin-textarea"
                  rows={3}
                  value={formData.text}
                  onChange={e => setFormData({ ...formData, text: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <input
                  type="checkbox"
                  id="featured-check"
                  checked={formData.featured}
                  onChange={e => setFormData({ ...formData, featured: e.target.checked })}
                />
                <label htmlFor="featured-check" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>
                  Feature this piece on Storefront Homepage
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Save Changes' : 'Create Piece'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
