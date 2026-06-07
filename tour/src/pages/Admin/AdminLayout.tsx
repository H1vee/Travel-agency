import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, Car, Inbox, LogOut, ChevronLeft } from 'lucide-react';
import './Admin.scss';

const AdminLogin: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка входу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={submit}>
        <h1>Вхід для адміністратора</h1>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Пароль
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <div className="admin-login__error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Вхід…' : 'Увійти'}
        </button>
        <Link to="/" className="admin-login__back">
          ← На сайт
        </Link>
      </form>
    </div>
  );
};

export const AdminLayout: React.FC = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="admin-login"><p>Завантаження…</p></div>;
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <AdminLogin />;
  }

  const navItems = [
    { path: '/admin', icon: BarChart3, label: 'Дашборд' },
    { path: '/admin/cars', icon: Car, label: 'Автомобілі' },
    { path: '/admin/inquiries', icon: Inbox, label: 'Заявки' },
  ];

  const isActive = (path: string) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__header">
          <Link to="/" className="admin-sidebar__back">
            <ChevronLeft size={18} />
            <span>На сайт</span>
          </Link>
          <div className="admin-sidebar__brand">
            <Car size={24} />
            <span>AutoBoss Admin</span>
          </div>
        </div>

        <nav className="admin-sidebar__nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-sidebar__link ${isActive(item.path) ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__user-info">
              <span className="admin-sidebar__user-name">{user?.name}</span>
              <span className="admin-sidebar__user-role">Адміністратор</span>
            </div>
          </div>
          <button className="admin-sidebar__logout" onClick={logout}>
            <LogOut size={16} />
            <span>Вийти</span>
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};
