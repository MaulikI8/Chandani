import React, { useState } from 'react';
import { useAdmin } from '../../state/AdminContext';
import { Users, Search, Phone, Mail, Award, MapPin } from 'lucide-react';

export default function AdminCustomers() {
  const { enquiries } = useAdmin();
  const [search, setSearch] = useState('');

  // Extract distinct clients
  const clientMap = new Map();
  enquiries.forEach(e => {
    if (!clientMap.has(e.email)) {
      clientMap.set(e.email, {
        name: e.name,
        email: e.email,
        phone: e.phone,
        firmName: e.firmName,
        clientType: e.clientType,
        totalEnquiries: 1,
        totalQuoted: e.quotedTotal,
      });
    } else {
      const existing = clientMap.get(e.email);
      existing.totalEnquiries += 1;
      existing.totalQuoted += e.quotedTotal;
    }
  });

  const clients = Array.from(clientMap.values()).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.firmName && c.firmName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Clients & Architecture Firms
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
            CRM directory of interior design practices, architects, and private patrons
          </p>
        </div>
      </div>

      <div className="admin-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <input
          type="text"
          className="admin-input"
          placeholder="Search by client name, architecture firm, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="admin-card" style={{ overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Firm / Practice</th>
              <th>Type</th>
              <th>Total Enquiries</th>
              <th>Total Quoted Value</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.email}>
                <td style={{ fontWeight: 700, color: '#0f172a' }}>{c.name}</td>
                <td>
                  {c.firmName ? (
                    <span style={{ fontWeight: 600, color: '#7952eb' }}>{c.firmName}</span>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>Private Residential</span>
                  )}
                </td>
                <td>
                  {c.clientType === 'trade' ? (
                    <span className="badge badge-purple">Verified Trade (−20%)</span>
                  ) : (
                    <span className="badge badge-amber">Private Client</span>
                  )}
                </td>
                <td style={{ fontWeight: 600 }}>{c.totalEnquiries} project(s)</td>
                <td style={{ fontWeight: 700 }}>रू {c.totalQuoted.toLocaleString()}</td>
                <td>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    <div>✉ {c.email}</div>
                    <div>📞 {c.phone}</div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
