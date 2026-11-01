import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../../state/AdminContext';
import {
  Home,
  LayoutGrid,
  Package,
  Users,
  ShoppingBag,
  Tag,
  TrendingUp,
  CreditCard,
  Camera,
  Layers,
  MessageSquare,
  UserCheck,
  Store,
  Menu,
  X,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import './admin.css';

export default function AdminLayout() {
  const { isAdmin, adminLogout, enquiries } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (!isAdmin) return null;

  const pendingEnquiries = enquiries.filter(e => e.status === 'new' || e.status === 'in_progress').length;

  const mainNav = [
    { path: '/admin', label: 'Home', icon: Home, exact: true },
    { path: '/admin/categories', label: 'Categories', icon: LayoutGrid },
    { path: '/admin/products', label: 'Products', icon: Package },
    { path: '/admin/customers', label: 'Customers', icon: Users },
    { path: '/admin/enquiries', label: 'Orders', icon: ShoppingBag, badge: pendingEnquiries > 0 ? pendingEnquiries : null },
    { path: '/admin/coupons', label: 'Discount Coupons', icon: Tag },
    { path: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
    { path: '/admin/finance', label: 'Finance', icon: CreditCard },
  ];

  const customizationNav = [
    { path: '/admin/rooms', label: 'Model Showcase', icon: Camera },
    { path: '/admin/carpets', label: 'Carpet Studio', icon: Sparkles },
    { path: '/admin/content', label: 'Content', icon: Layers },
    { path: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare },
    { path: '/admin/users', label: 'Admin Users', icon: UserCheck },
    { path: '/', label: 'Store Front', icon: Store, external: true },
  ];

  const isCurrent = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-body flex min-h-screen">
      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        style={{
          width: '240px',
          background: '#ffffff',
          borderRight: '1px solid #f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 40,
        }}
        className="hidden md:flex"
      >
        {/* Brand header */}
        <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#f5f3ff',
              border: '1px solid #ddd6fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7952eb',
              fontWeight: 800,
              fontSize: '1.2rem',
              fontFamily: 'serif',
            }}
          >
            चाँ
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
              CHANDANI
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>Atelier Control Center</div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {mainNav.map(item => {
              const active = isCurrent(item.path, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 14px',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    fontWeight: active ? 600 : 500,
                    color: active ? '#7952eb' : '#475569',
                    background: active ? '#f5f3ff' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={18} color={active ? '#7952eb' : '#64748b'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span
                      style={{
                        background: '#7952eb',
                        color: '#ffffff',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '1px 7px',
                        borderRadius: '20px',
                      }}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>

          <div style={{ margin: '20px 0 8px 14px', fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Customizations
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {customizationNav.map(item => {
              const active = isCurrent(item.path);
              const Icon = item.icon;
              return item.external ? (
                <a
                  key={item.path}
                  href={item.path}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 14px',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    fontWeight: 500,
                    color: '#475569',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={18} color="#64748b" />
                    <span>{item.label}</span>
                  </div>
                  <ExternalLink size={14} color="#94a3b8" />
                </a>
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '9px 14px',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    fontWeight: active ? 600 : 500,
                    color: active ? '#7952eb' : '#475569',
                    background: active ? '#f5f3ff' : 'transparent',
                    textDecoration: 'none',
                  }}
                >
                  <Icon size={18} color={active ? '#7952eb' : '#64748b'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a
            href="https://basnetaashutosh.com.np/api/admin/"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: '0.78rem', color: '#64748b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            Django ↗
          </a>
          <button
            onClick={adminLogout}
            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MOBILE HEADER ── */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 font-bold flex items-center justify-center font-serif text-lg">
            चाँ
          </div>
          <span className="font-bold text-slate-800 text-sm">CHANDANI ATELIER</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-600 hover:text-slate-900"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <main
        style={{
          flex: 1,
          marginLeft: '240px',
          padding: '36px 40px',
          minHeight: '100vh',
          boxSizing: 'border-box',
        }}
        className="w-full md:ml-[240px] pt-20 md:pt-9 p-4 md:p-9"
      >
        <Outlet />
      </main>
    </div>
  );
}
