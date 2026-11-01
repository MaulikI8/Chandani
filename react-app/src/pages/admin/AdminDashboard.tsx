import React, { useState } from 'react';
import { useAdmin } from '../../state/AdminContext';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  Sparkles,
  Users,
  Compass,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const { enquiries, products, carpets, siteSettings } = useAdmin();
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const todayDateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Today calculations
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnquiries = enquiries.filter(e => e.createdAt && new Date(e.createdAt) >= todayStart);
  const todayRevenue = todayEnquiries.reduce((sum, e) => sum + (Number(e.quotedTotal) || 0), 0);
  const totalRevenue = enquiries.reduce((sum, e) => sum + (Number(e.quotedTotal) || 0), 0);

  const aov = todayEnquiries.length > 0
    ? Math.round(todayRevenue / todayEnquiries.length)
    : enquiries.length > 0
    ? Math.round(totalRevenue / enquiries.length)
    : 4512;

  // Hourly Order Statistics
  const hourlyCounts = Array(23).fill(0);
  todayEnquiries.forEach(e => {
    if (e.createdAt) {
      const h = new Date(e.createdAt).getHours();
      if (h >= 0 && h < 23) hourlyCounts[h]++;
    }
  });

  const maxHourly = Math.max(4, ...hourlyCounts);
  const hourlyPoints = hourlyCounts
    .map((count, h) => {
      const cx = 30 + h * 23.5;
      const cy = 110 - (count / maxHourly) * 80;
      return `${cx},${cy}`;
    })
    .join(' ');

  // Weekly Sales trend (Sunday to Today)
  const now = new Date();
  const daysSinceSunday = now.getDay() % 7;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - daysSinceSunday);
  startOfWeek.setHours(0, 0, 0, 0);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Today'];
  let thisWeekTotal = 0;

  const weeklyDays = dayNames.map((dname, idx) => {
    const dStart = new Date(startOfWeek);
    dStart.setDate(startOfWeek.getDate() + idx);
    const dEnd = new Date(dStart);
    dEnd.setDate(dStart.getDate() + 1);

    const dRev = enquiries
      .filter(e => {
        if (!e.createdAt) return false;
        const ed = new Date(e.createdAt);
        return ed >= dStart && ed < dEnd;
      })
      .reduce((s, e) => s + (Number(e.quotedTotal) || 0), 0);

    thisWeekTotal += dRev;

    return {
      day: dname,
      isToday: idx === 6,
      rev: dRev,
    };
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#0f172a' }}>
      {/* ══ 1. GREETING & DATE HEADER (EXACT TO SCREENSHOT) ══ */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#0f172a' }}>
          {greeting}, Ashutosh Basnet
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#64748b' }}>
          Here are your store's today <span style={{ color: '#7952eb', fontWeight: 600 }}>{todayDateStr}</span>
        </p>
      </div>

      {/* ══ 2. THREE STAT CARDS (EXACT TO SCREENSHOT) ══ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '18px',
          marginBottom: '22px',
        }}
      >
        {/* CARD 1: REVENUE */}
        <div
          className="admin-card"
          style={{
            padding: '20px 22px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Revenue</span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#64748b',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '2px 8px',
                borderRadius: '20px',
              }}
            >
              Today ▾
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Sales so far today</div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '14px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Rs</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              {todayRevenue.toLocaleString()}
            </span>
          </div>

          {/* Purple progress bar */}
          <div
            style={{
              height: '4px',
              width: '100%',
              background: '#f1f5f9',
              borderRadius: '10px',
              marginTop: '16px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: todayRevenue > 0 ? '65%' : '35%',
                background: 'linear-gradient(90deg, #7952eb, #906bf5)',
                borderRadius: '10px',
              }}
            />
          </div>
        </div>

        {/* CARD 2: ORDERS / ENQUIRIES */}
        <div
          className="admin-card"
          style={{
            padding: '20px 22px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Orders</span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#64748b',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '2px 8px',
                borderRadius: '20px',
              }}
            >
              Today ▾
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Orders placed today</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
            <span style={{ fontSize: '1.1rem' }}>🛒</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              {todayEnquiries.length}
            </span>
          </div>

          {/* Dashed cyan progress */}
          <div
            style={{
              height: '4px',
              width: '100%',
              background: '#f1f5f9',
              borderRadius: '10px',
              marginTop: '16px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: todayEnquiries.length > 0 ? '70%' : '15%',
                background: '#06b6d4',
                borderRadius: '10px',
              }}
            />
          </div>
        </div>

        {/* CARD 3: AVERAGE ORDER VALUE */}
        <div
          className="admin-card"
          style={{
            padding: '20px 22px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Average Order Value</span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#64748b',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '2px 8px',
                borderRadius: '20px',
              }}
            >
              Today ▾
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Average Order Value</div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '14px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Rs</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              {aov.toLocaleString()}
            </span>
          </div>

          {/* Orange progress line */}
          <div
            style={{
              height: '4px',
              width: '100%',
              background: '#f1f5f9',
              borderRadius: '10px',
              marginTop: '16px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: '80%',
                background: '#f97316',
                borderRadius: '10px',
              }}
            />
          </div>
        </div>
      </div>

      {/* ══ 3. TWO MAIN CHARTS (EXACT TO SCREENSHOT) ══ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: '18px',
          marginBottom: '26px',
        }}
      >
        {/* CHART 1: HOURLY ORDER STATISTICS */}
        <div className="admin-card" style={{ padding: '22px' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
            Hourly Order Statistics
          </div>

          <div style={{ position: 'relative', width: '100%', height: '170px' }}>
            <svg
              viewBox="0 0 580 140"
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
              preserveAspectRatio="none"
            >
              {/* Grid guide lines */}
              <line x1="30" y1="20" x2="560" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="30" y1="55" x2="560" y2="55" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="30" y1="90" x2="560" y2="90" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="30" y1="120" x2="560" y2="120" stroke="#f1f5f9" />

              {/* Y axis numbers */}
              <text x="15" y="24" fontSize="8" fill="#94a3b8">
                4
              </text>
              <text x="15" y="59" fontSize="8" fill="#94a3b8">
                3
              </text>
              <text x="15" y="94" fontSize="8" fill="#94a3b8">
                2
              </text>
              <text x="15" y="123" fontSize="8" fill="#94a3b8">
                0
              </text>

              {/* Line graph path */}
              <polyline
                fill="none"
                stroke="#7952eb"
                strokeWidth="2.2"
                points={hourlyPoints}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Dot nodes on each hour */}
              {hourlyCounts.map((count, h) => {
                const cx = 30 + h * 23.5;
                const cy = 110 - (count / maxHourly) * 80;
                return (
                  <circle
                    key={h}
                    cx={cx}
                    cy={cy}
                    r="2.8"
                    fill="#7952eb"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                  />
                );
              })}
            </svg>

            {/* Time labels below */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingLeft: '24px',
                paddingRight: '10px',
                marginTop: '4px',
                fontSize: '0.62rem',
                color: '#94a3b8',
                fontFamily: 'monospace',
              }}
            >
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
              <span>22:00</span>
            </div>
          </div>
        </div>

        {/* CHART 2: WEEKLY SALES */}
        <div className="admin-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>Weekly Sales</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                Sunday to Today, as per the last 7 days sales trend.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.72rem', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7952eb' }} /> This week
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e2e8f0' }} /> Last week
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '14px 0 10px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Rs</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              {thisWeekTotal.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '6px' }}>
              No sales in the same days last week
            </span>
          </div>

          {/* Bar Chart */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '90px', paddingTop: '10px' }}>
            {weeklyDays.map((d, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '65px' }}>
                  {/* Last week bar */}
                  <div
                    style={{
                      width: '6px',
                      height: '4px',
                      background: '#f1f5f9',
                      borderRadius: '4px',
                    }}
                  />
                  {/* This week bar */}
                  <div
                    style={{
                      width: '6px',
                      height: d.rev > 0 ? '42px' : '6px',
                      background: d.isToday ? '#7952eb' : '#ddd6fe',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: d.isToday ? '#7952eb' : '#94a3b8',
                    fontWeight: d.isToday ? 700 : 500,
                  }}
                >
                  {d.day}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ 4. RECENT ATELIER ENQUIRIES & ORDERS ══ */}
      <div className="admin-card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
              Recent Client Enquiries & Project Consultations
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Live architectural craft leads across Kathmandu Valley and Nepal
            </div>
          </div>
          <Link to="/admin/enquiries" className="btn-secondary">
            View All ({enquiries.length}) →
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Client / Firm</th>
                <th>Type</th>
                <th>Interest / Project Scope</th>
                <th>Quoted (NPR)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.slice(0, 5).map(e => (
                <tr key={e.id}>
                  <td style={{ fontWeight: 600, color: '#7952eb', fontFamily: 'monospace' }}>{e.id}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{e.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{e.firmName || e.email}</div>
                  </td>
                  <td>
                    {e.clientType === 'trade' && <span className="badge badge-purple">Trade (−20%)</span>}
                    {e.clientType === 'swatch' && <span className="badge badge-sky">Swatch Box</span>}
                    {e.clientType === 'private' && <span className="badge badge-amber">Private Client</span>}
                  </td>
                  <td style={{ maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e.projectScope || e.interest}
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {e.quotedTotal > 0 ? `रू ${e.quotedTotal.toLocaleString()}` : 'Free Sample'}
                  </td>
                  <td>
                    {e.status === 'new' && <span className="badge badge-rose">● New Lead</span>}
                    {e.status === 'in_progress' && <span className="badge badge-amber">⏳ In Progress</span>}
                    {e.status === 'fulfilled' && <span className="badge badge-emerald">✓ Shipped / Fulfilled</span>}
                    {e.status === 'contacted' && <span className="badge badge-sky">Contacted</span>}
                    {e.status === 'closed' && <span className="badge badge-purple">Closed</span>}
                  </td>
                  <td>
                    <Link to="/admin/enquiries" className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.74rem' }}>
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
