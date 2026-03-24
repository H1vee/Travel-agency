import React, { useState } from 'react';
import {
  Card, CardBody, Button, Chip, Pagination, Spinner,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody,
  Avatar,
  useDisclosure,
} from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { adminService, AdminUser, AdminBooking } from '../../services/AdminService';
import { Eye, Shield, CheckCircle } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [page, setPage] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userBookings, setUserBookings] = useState<AdminBooking[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: () => adminService.getUsers(page, 20),
  });

  const handleViewUser = async (userId: number) => {
    setDetailLoading(true);
    try {
      const detail = await adminService.getUserDetail(userId);
      setSelectedUser(detail.user);
      setUserBookings(detail.bookings || []);
      onOpen();
    } catch (err) {
      console.error('Failed to load user detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === '0001-01-01T00:00:00Z') return 'Ніколи';
    return new Date(dateStr).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 }).format(price);

  return (
    <div className="admin-users">
      <div className="admin-page-header">
        <h1>Користувачі</h1>
        <p>Зареєстровані користувачі системи</p>
      </div>

      <Card className="admin-table-card">
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div className="admin-loading"><Spinner size="lg" /></div>
          ) : (
            <Table aria-label="Users table" removeWrapper>
              <TableHeader>
                <TableColumn>ID</TableColumn>
                <TableColumn>Користувач</TableColumn>
                <TableColumn>Email</TableColumn>
                <TableColumn>Телефон</TableColumn>
                <TableColumn>Роль</TableColumn>
                <TableColumn>Верифікація</TableColumn>
                <TableColumn>Реєстрація</TableColumn>
                <TableColumn>Дії</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Немає користувачів">
                {(data?.users || []).map((user: AdminUser) => (
                  <TableRow key={user.id}>
                    <TableCell>#{user.id}</TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Avatar name={user.name} size="sm" />
                        <span style={{ fontWeight: 600 }}>{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || '—'}</TableCell>
                    <TableCell>
                      {user.role === 'admin' ? (
                        <Chip color="warning" variant="flat" size="sm" startContent={<Shield size={12} />}>Admin</Chip>
                      ) : (
                        <Chip variant="flat" size="sm">User</Chip>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.is_verified ? (
                        <Chip color="success" variant="flat" size="sm" startContent={<CheckCircle size={12} />}>Так</Chip>
                      ) : (
                        <Chip color="default" variant="flat" size="sm">Ні</Chip>
                      )}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.85rem', color: '#64748b' }}>{formatDate(user.created_at)}</TableCell>
                    <TableCell>
                      <Button isIconOnly size="sm" variant="light" onClick={() => handleViewUser(user.id)}>
                        <Eye size={16} />
                      </Button>
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

      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>Деталі користувача</ModalHeader>
          <ModalBody style={{ paddingBottom: '2rem' }}>
            {detailLoading ? (
              <div className="admin-loading"><Spinner size="lg" /></div>
            ) : selectedUser && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Avatar name={selectedUser.name} size="lg" />
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 700 }}>{selectedUser.name}</h3>
                    <p style={{ margin: 0, color: '#64748b' }}>{selectedUser.email}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Card>
                    <CardBody>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Бронювань</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{selectedUser.bookings_count}</span>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Витрачено</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{formatPrice(selectedUser.total_spent)}</span>
                    </CardBody>
                  </Card>
                </div>

                {userBookings.length > 0 && (
                  <div>
                    <h4 style={{ marginBottom: '0.75rem' }}>Бронювання користувача</h4>
                    <Table aria-label="User bookings" removeWrapper>
                      <TableHeader>
                        <TableColumn>Тур</TableColumn>
                        <TableColumn>Сума</TableColumn>
                        <TableColumn>Статус</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {userBookings.map((b: AdminBooking) => (
                          <TableRow key={b.id}>
                            <TableCell>{b.tour_title}</TableCell>
                            <TableCell>{formatPrice(b.total_price)}</TableCell>
                            <TableCell>
                              <Chip
                                size="sm"
                                variant="flat"
                                color={b.status === 'confirmed' ? 'success' : b.status === 'pending' ? 'warning' : 'danger'}
                              >
                                {b.status}
                              </Chip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};