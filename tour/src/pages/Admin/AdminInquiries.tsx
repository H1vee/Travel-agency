import React, { useCallback, useEffect, useState } from 'react';
import { adminService, AdminInquiry } from '../../services/AdminService';
import { REQUEST_TYPE_LABELS, RequestType } from '../../types/cars';
import './Admin.scss';

const requestLabel = (t: string) =>
  REQUEST_TYPE_LABELS[t as RequestType] || t;

export const AdminInquiries: React.FC = () => {
  const [items, setItems] = useState<AdminInquiry[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await adminService.getInquiries(1, 50, filter || undefined);
      setItems(data.inquiries || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка');
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (item: AdminInquiry) => {
    const next = item.status === 'new' ? 'processed' : 'new';
    await adminService.setInquiryStatus(item.id, next);
    load();
  };

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <h1>Заявки</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="admin-status-select">
          <option value="">Усі</option>
          <option value="new">Нові</option>
          <option value="processed">Опрацьовані</option>
        </select>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Тип</th>
            <th>Авто</th>
            <th>Ім'я</th>
            <th>Зв'язок</th>
            <th>Телефон</th>
            <th>Повідомлення</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className={it.status === 'new' ? 'is-new' : ''}>
              <td>{new Date(it.created_at).toLocaleDateString('uk-UA')}</td>
              <td>{requestLabel(it.request_type)}</td>
              <td>{it.car_label || '—'}</td>
              <td>{it.name || '—'}</td>
              <td>{it.contact_method || '—'}</td>
              <td><a href={`tel:${it.phone}`}>{it.phone}</a></td>
              <td className="admin-table__msg">{it.message || '—'}</td>
              <td>
                <button
                  className={`admin-chip ${it.status === 'new' ? 'new' : 'done'}`}
                  onClick={() => toggle(it)}
                >
                  {it.status === 'new' ? 'Нова' : 'Опрацьована'}
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={8} className="admin-table__empty">Заявок немає.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
