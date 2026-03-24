import React, { useState } from 'react';
import {
  Card, CardBody, Button, Chip, Pagination, Spinner,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Tabs, Tab,
} from '@heroui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, AdminBooking } from '../../services/AdminService';
import { Download, MoreVertical, CheckCircle, XCircle, Clock } from 'lucide-react';

export const AdminBookings: React.FC = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'bookings', page, statusFilter],
    queryFn: () => adminService.getBookings(page, 20, statusFilter || undefined),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminService.updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
  });

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Chip color="success" variant="flat" size="sm" startContent={<CheckCircle size={14} />}>Підтверджено</Chip>;
      case 'pending':
        return <Chip color="warning" variant="flat" size="sm" startContent={<Clock size={14} />}>Очікує</Chip>;
      case 'cancelled':
        return <Chip color="danger" variant="flat" size="sm" startContent={<XCircle size={14} />}>Скасовано</Chip>;
      default:
        return <Chip variant="flat" size="sm">{status}</Chip>;
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 }).format(price);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handleExport = () => {
    adminService.exportBookingsCSV(statusFilter || undefined);
  };

  return (
    <div className="admin-bookings">
      <div className="admin-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Бронювання</h1>
            <p>Управління бронюваннями туристів</p>
          </div>
          <Button
            color="primary"
            variant="flat"
            startContent={<Download size={16} />}
            onClick={handleExport}
          >
            Експорт CSV
          </Button>
        </div>
      </div>

      <Card className="admin-table-card">
        <div className="admin-table-header">
          <Tabs
            selectedKey={statusFilter}
            onSelectionChange={(key) => { setStatusFilter(key as string); setPage(1); }}
            variant="underlined"
            color="primary"
          >
            <Tab key="" title={`Всі (${data?.total || 0})`} />
            <Tab key="pending" title="Очікують" />
            <Tab key="confirmed" title="Підтверджені" />
            <Tab key="cancelled" title="Скасовані" />
          </Tabs>
        </div>

        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div className="admin-loading"><Spinner size="lg" /></div>
          ) : (
            <Table aria-label="Bookings table" removeWrapper>
              <TableHeader>
                <TableColumn>ID</TableColumn>
                <TableColumn>Тур</TableColumn>
                <TableColumn>Клієнт</TableColumn>
                <TableColumn>Телефон</TableColumn>
                <TableColumn>Місця</TableColumn>
                <TableColumn>Сума</TableColumn>
                <TableColumn>Статус</TableColumn>
                <TableColumn>Дата</TableColumn>
                <TableColumn>Дії</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Немає бронювань">
                {(data?.bookings || []).map((booking: AdminBooking) => (
                  <TableRow key={booking.id}>
                    <TableCell>#{booking.id}</TableCell>
                    <TableCell><span style={{ fontWeight: 600 }}>{booking.tour_title}</span></TableCell>
                    <TableCell>
                      {booking.customer_name}
                      {booking.is_guest_booking && <Chip size="sm" variant="flat" className="ml-2">Гість</Chip>}
                    </TableCell>
                    <TableCell>{booking.customer_phone}</TableCell>
                    <TableCell>{booking.seats}</TableCell>
                    <TableCell><span style={{ fontWeight: 700 }}>{formatPrice(booking.total_price)}</span></TableCell>
                    <TableCell>{getStatusChip(booking.status)}</TableCell>
                    <TableCell style={{ fontSize: '0.85rem', color: '#64748b' }}>{formatDate(booking.booked_at)}</TableCell>
                    <TableCell>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="light">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                          onAction={(key) => statusMutation.mutate({ id: booking.id, status: key as string })}
                        >
                          <DropdownItem key="confirmed" startContent={<CheckCircle size={14} />}>
                            Підтвердити
                          </DropdownItem>
                          <DropdownItem key="cancelled" color="danger" startContent={<XCircle size={14} />}>
                            Скасувати
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>

        {data && data.total_pages > 1 && (
          <div className="admin-pagination">
            <Pagination total={data.total_pages} page={page} onChange={setPage} showControls />
          </div>
        )}
      </Card>
    </div>
  );
};