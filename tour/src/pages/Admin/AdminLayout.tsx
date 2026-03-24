import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart3,
  ShoppingBag,
  Users,
  Map,
  LogOut,
  ChevronLeft,
  Shield,
  Download,
} from 'lucide-react';
import { Button, Avatar } from '@heroui/react';
import './Admin.scss';

export const AdminLayout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="admin-denied">
        <Shield size={64} />
        <h2>Доступ заборонено</h2>
        <p>Ця сторінка доступна лише адміністраторам</p>
        <Button color="primary" onClick={() => navigate('/')}>
          На головну
        </Button>
      </div>
    );
  }

  const navItems = [
    { path: '/admin', icon: BarChart3, label: 'Дашборд' },
    { path: '/admin/bookings', icon: ShoppingBag, label: 'Бронювання' },
    { path: '/admin/tours', icon: Map, label: 'Тури' },
    { path: '/admin/users', icon: Users, label: 'Користувачі' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__header">
          <Link to="/" className="admin-sidebar__back">
            <ChevronLeft size={18} />
            <span>На сайт</span>
          </Link>
          <div className="admin-sidebar__brand">
            <Shield size={24} />
            <span>Admin Panel</span>
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
            <Avatar
              src={user?.avatar_url}
              name={user?.name}
              size="sm"
            />
            <div className="admin-sidebar__user-info">
              <span className="admin-sidebar__user-name">{user?.name}</span>
              <span className="admin-sidebar__user-role">Адміністратор</span>
            </div>
          </div>
          <Button
            variant="light"
            color="danger"
            size="sm"
            startContent={<LogOut size={16} />}
            onClick={logout}
            className="admin-sidebar__logout"
          >
            Вийти
          </Button>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};