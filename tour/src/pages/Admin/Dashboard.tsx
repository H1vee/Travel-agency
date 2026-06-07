import React, { useEffect, useState } from 'react';
import { Car, Eye, EyeOff, Inbox, Bell, CheckCircle } from 'lucide-react';
import { adminService, OverviewStats } from '../../services/AdminService';
import './Admin.scss';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminService
      .getOverview()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Помилка'));
  }, []);

  const cards = stats
    ? [
        { icon: Car, label: 'Усього авто', value: stats.total_cars, color: '#2563eb' },
        { icon: Eye, label: 'Опубліковано', value: stats.active_cars, color: '#16a34a' },
        { icon: EyeOff, label: 'Приховано', value: stats.hidden_cars, color: '#64748b' },
        { icon: Inbox, label: 'Усього заявок', value: stats.total_inquiries, color: '#7c3aed' },
        { icon: Bell, label: 'Нові заявки', value: stats.new_inquiries, color: '#ea580c' },
        { icon: CheckCircle, label: 'Опрацьовані', value: stats.processed_inquiries, color: '#0891b2' },
      ]
    : [];

  return (
    <div className="admin-page">
      <h1>Дашборд</h1>
      {error && <div className="admin-error">{error}</div>}
      {!stats ? (
        <p>Завантаження…</p>
      ) : (
        <div className="admin-stats">
          {cards.map((c) => (
            <div className="admin-stat" key={c.label}>
              <div className="admin-stat__icon" style={{ background: `${c.color}1a`, color: c.color }}>
                <c.icon size={22} />
              </div>
              <div className="admin-stat__body">
                <span className="admin-stat__value">{c.value}</span>
                <span className="admin-stat__label">{c.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
