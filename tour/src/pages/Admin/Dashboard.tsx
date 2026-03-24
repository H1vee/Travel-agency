import React from 'react';
import { Card, CardBody, Spinner } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { ShoppingBag, Users, Map, CreditCard, Clock, CheckCircle, XCircle } from 'lucide-react';
import { adminService } from '../../services/AdminService';
import './Admin.scss';

const COLORS = ['#f59e0b', '#10b981', '#ef4444'];

export const Dashboard: React.FC = () => {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => adminService.getOverview(),
  });

  const { data: bookingsByMonth } = useQuery({
    queryKey: ['admin', 'bookings-by-month'],
    queryFn: () => adminService.getBookingsByMonth(),
  });

  const { data: revenueByMonth } = useQuery({
    queryKey: ['admin', 'revenue-by-month'],
    queryFn: () => adminService.getRevenueByMonth(),
  });

  const { data: popularTours } = useQuery({
    queryKey: ['admin', 'popular-tours'],
    queryFn: () => adminService.getPopularTours(),
  });

  if (overviewLoading) {
    return (
      <div className="admin-loading">
        <Spinner size="lg" />
        <p>Завантаження дашборду...</p>
      </div>
    );
  }

  const pieData = overview ? [
    { name: 'Очікують', value: overview.pending_count },
    { name: 'Підтверджені', value: overview.confirmed_count },
    { name: 'Скасовані', value: overview.cancelled_count },
  ].filter(d => d.value > 0) : [];

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h1>Дашборд</h1>
        <p>Загальна статистика вашого бізнесу</p>
      </div>

      <div className="stats-grid">
        <Card className="stat-card stat-card--primary">
          <CardBody className="stat-card__body">
            <div className="stat-card__icon"><Map size={24} /></div>
            <div className="stat-card__info">
              <span className="stat-card__number">{overview?.total_tours || 0}</span>
              <span className="stat-card__label">Турів</span>
            </div>
          </CardBody>
        </Card>

        <Card className="stat-card stat-card--success">
          <CardBody className="stat-card__body">
            <div className="stat-card__icon"><ShoppingBag size={24} /></div>
            <div className="stat-card__info">
              <span className="stat-card__number">{overview?.total_bookings || 0}</span>
              <span className="stat-card__label">Бронювань</span>
            </div>
          </CardBody>
        </Card>

        <Card className="stat-card stat-card--warning">
          <CardBody className="stat-card__body">
            <div className="stat-card__icon"><Users size={24} /></div>
            <div className="stat-card__info">
              <span className="stat-card__number">{overview?.total_users || 0}</span>
              <span className="stat-card__label">Користувачів</span>
            </div>
          </CardBody>
        </Card>

        <Card className="stat-card stat-card--green">
          <CardBody className="stat-card__body">
            <div className="stat-card__icon"><CreditCard size={24} /></div>
            <div className="stat-card__info">
              <span className="stat-card__number">{formatPrice(overview?.total_revenue || 0)}</span>
              <span className="stat-card__label">Дохід</span>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="stats-grid stats-grid--small">
        <Card className="stat-card stat-card--mini">
          <CardBody className="stat-card__body">
            <Clock size={18} className="text-warning" />
            <span className="stat-card__mini-number">{overview?.pending_count || 0}</span>
            <span className="stat-card__mini-label">Очікують</span>
          </CardBody>
        </Card>
        <Card className="stat-card stat-card--mini">
          <CardBody className="stat-card__body">
            <CheckCircle size={18} className="text-success" />
            <span className="stat-card__mini-number">{overview?.confirmed_count || 0}</span>
            <span className="stat-card__mini-label">Підтверджені</span>
          </CardBody>
        </Card>
        <Card className="stat-card stat-card--mini">
          <CardBody className="stat-card__body">
            <XCircle size={18} className="text-danger" />
            <span className="stat-card__mini-number">{overview?.cancelled_count || 0}</span>
            <span className="stat-card__mini-label">Скасовані</span>
          </CardBody>
        </Card>
      </div>

      <div className="charts-grid">
        <Card className="chart-card">
          <CardBody>
            <h3>Бронювання за місяцями</h3>
            {bookingsByMonth && bookingsByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={bookingsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="confirmed" name="Підтверджені" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Очікують" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cancelled" name="Скасовані" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">Немає даних за останні 12 місяців</div>
            )}
          </CardBody>
        </Card>

        <Card className="chart-card">
          <CardBody>
            <h3>Розподіл по статусах</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">Немає бронювань</div>
            )}
          </CardBody>
        </Card>

        <Card className="chart-card">
          <CardBody>
            <h3>Дохід за місяцями</h3>
            {revenueByMonth && revenueByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: any) => formatPrice(Number(value))} />
                  <Line type="monotone" dataKey="revenue" name="Дохід" stroke="#6366f1" strokeWidth={3} dot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">Немає даних</div>
            )}
          </CardBody>
        </Card>

        <Card className="chart-card">
          <CardBody>
            <h3>Популярні тури</h3>
            {popularTours && popularTours.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={popularTours} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="title" type="category" width={150} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="bookings_count" name="Бронювань" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">Немає даних</div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};