import React, { useState, useEffect, useRef } from 'react';
import {
  Card, CardBody, Button, Chip, Pagination, Spinner,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Textarea, Select, SelectItem, Divider,
  useDisclosure,
} from '@heroui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, AdminTour } from '../../services/AdminService';
import { Plus, Edit, Trash2, Eye, Calendar, Image as ImageIcon, X, Upload } from 'lucide-react';

const STATUSES = [
  { id: '1', name: 'active', label: 'Активний' },
  { id: '2', name: 'inactive', label: 'Неактивний' },
  { id: '3', name: 'draft', label: 'Чернетка' },
];

interface Location {
  id: number;
  name: string;
  country: string;
}

interface TourDateForm {
  from_location_id: number;
  to_location_id: number;
  date_from: string;
  date_to: string;
}

const API_BASE_URL = 'http://127.0.0.1:1323';

const uploadImage = async (file: File, type: 'card' | 'gallery'): Promise<string> => {
  const token = localStorage.getItem('tour_auth_token');
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_BASE_URL}/admin/upload?type=${type}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Upload failed');
  }

  const data = await res.json();
  return data.url;
};

const ImageUpload: React.FC<{
  label: string;
  value: string;
  onChange: (url: string) => void;
  type: 'card' | 'gallery';
  description?: string;
}> = ({ label, value, onChange, type, description }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const url = await uploadImage(file, type);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>{label}</span>

      {value && (
        <div style={{ position: 'relative', width: 'fit-content', display: 'inline-block' }}>
          <img
            src={`${API_BASE_URL}${value}`}
            alt="Preview"
            style={{
              width: type === 'card' ? 200 : 150,
              height: type === 'card' ? 130 : 100,
              objectFit: 'cover',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              display: 'block',
            }}
          />
          <button
            onClick={() => onChange('')}
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <Button
          size="sm"
          variant="flat"
          color="primary"
          onClick={() => inputRef.current?.click()}
          isLoading={uploading}
          startContent={!uploading && <Upload size={14} />}
        >
          {uploading ? 'Завантаження...' : value ? 'Замінити' : 'Завантажити'}
        </Button>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>JPG, PNG, WebP до 5MB</span>
      </div>

      {error && <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>{error}</span>}
      {description && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{description}</span>}
    </div>
  );
};

export const AdminTours: React.FC = () => {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingTour, setEditingTour] = useState<any>(null);
  const [locations, setLocations] = useState<Location[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    call_to_action: 'Забронювати',
    price: 0,
    status_id: 1,
    detailed_description: '',
    total_seats: 10,
  });

  const [cardImage, setCardImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [tourDates, setTourDates] = useState<TourDateForm[]>([
    { from_location_id: 0, to_location_id: 0, date_from: '', date_to: '' },
  ]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'tours', page],
    queryFn: () => adminService.getTours(page, 20),
  });

  useEffect(() => {
    const token = localStorage.getItem('tour_auth_token');
    fetch(`${API_BASE_URL}/admin/locations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setLocations)
      .catch(console.error);
  }, []);

  const createMutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...formData,
        card_image: cardImage,
        gallery_images: galleryImages.filter((img) => img.trim() !== ''),
        dates: tourDates.filter(
          (d) => d.from_location_id > 0 && d.to_location_id > 0 && d.date_from && d.date_to
        ),
      };
      return adminService.createTour(payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tours'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...formData,
        card_image: cardImage || '',
        gallery_images: galleryImages.filter((img) => img.trim() !== ''),
        dates: tourDates.filter(
          (d) => d.from_location_id > 0 && d.to_location_id > 0 && d.date_from && d.date_to
        ),
      };
      return adminService.updateTour(editingTour.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tours'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteTour(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tours'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      call_to_action: 'Забронювати',
      price: 0,
      status_id: 1,
      detailed_description: '',
      total_seats: 10,
    });
    setCardImage('');
    setGalleryImages([]);
    setTourDates([{ from_location_id: 0, to_location_id: 0, date_from: '', date_to: '' }]);
    setEditingTour(null);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleCreate = () => {
    resetForm();
    onOpen();
  };

  const handleEdit = async (tour: AdminTour) => {
    const token = localStorage.getItem('tour_auth_token');
    const res = await fetch(`${API_BASE_URL}/admin/tours/${tour.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const detail = await res.json();

    setEditingTour(detail.tour);
    setFormData({
      title: detail.tour.title,
      description: detail.tour.description,
      call_to_action: detail.tour.call_to_action,
      price: detail.tour.price,
      status_id: detail.tour.status_id,
      detailed_description: detail.tour.detailed_description,
      total_seats: detail.tour.total_seats,
    });
    setCardImage(detail.card_image || '');
    setGalleryImages(detail.gallery_images?.length > 0 ? detail.gallery_images : []);

    if (detail.dates?.length > 0) {
      setTourDates(
        detail.dates.map((d: any) => ({
          from_location_id: d.from_location_id,
          to_location_id: d.to_location_id,
          date_from: d.date_from ? d.date_from.slice(0, 16) : '',
          date_to: d.date_to ? d.date_to.slice(0, 16) : '',
        }))
      );
    } else {
      setTourDates([{ from_location_id: 0, to_location_id: 0, date_from: '', date_to: '' }]);
    }

    onOpen();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Ви впевнені, що хочете деактивувати цей тур?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = () => {
    if (editingTour) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const addDate = () => {
    setTourDates([...tourDates, { from_location_id: 0, to_location_id: 0, date_from: '', date_to: '' }]);
  };

  const removeDate = (index: number) => {
    setTourDates(tourDates.filter((_, i) => i !== index));
  };

  const updateDate = (index: number, field: keyof TourDateForm, value: any) => {
    const updated = [...tourDates];
    updated[index] = { ...updated[index], [field]: value };
    setTourDates(updated);
  };

  const addGalleryImage = async (file: File) => {
    try {
      const url = await uploadImage(file, 'gallery');
      setGalleryImages((prev) => [...prev, url]);
    } catch (err) {
      console.error('Gallery upload failed:', err);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
  };

  const getStatusChip = (name: string) => {
    switch (name) {
      case 'active': return <Chip color="success" variant="flat" size="sm">Активний</Chip>;
      case 'inactive': return <Chip color="danger" variant="flat" size="sm">Неактивний</Chip>;
      case 'draft': return <Chip color="warning" variant="flat" size="sm">Чернетка</Chip>;
      default: return <Chip variant="flat" size="sm">{name}</Chip>;
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 }).format(price);

  const GalleryUploadButton: React.FC = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      setUploading(true);
      for (let i = 0; i < files.length; i++) {
        await addGalleryImage(files[i]);
      }
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    };

    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFiles}
          style={{ display: 'none' }}
        />
        <Button
          size="sm"
          variant="flat"
          color="primary"
          onClick={() => inputRef.current?.click()}
          isLoading={uploading}
          startContent={!uploading && <Upload size={14} />}
        >
          {uploading ? 'Завантаження...' : 'Додати фото'}
        </Button>
      </>
    );
  };

  return (
    <div className="admin-tours">
      <div className="admin-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Тури</h1>
            <p>Управління каталогом турів</p>
          </div>
          <Button color="primary" startContent={<Plus size={16} />} onClick={handleCreate}>
            Додати тур
          </Button>
        </div>
      </div>

      <Card className="admin-table-card">
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div className="admin-loading"><Spinner size="lg" /></div>
          ) : (
            <Table aria-label="Tours table" removeWrapper>
              <TableHeader>
                <TableColumn>ID</TableColumn>
                <TableColumn>Назва</TableColumn>
                <TableColumn>Ціна</TableColumn>
                <TableColumn>Рейтинг</TableColumn>
                <TableColumn>Місця</TableColumn>
                <TableColumn>Статус</TableColumn>
                <TableColumn>Дії</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Немає турів">
                {(data?.tours || []).map((tour: AdminTour) => (
                  <TableRow key={tour.id}>
                    <TableCell>#{tour.id}</TableCell>
                    <TableCell><span style={{ fontWeight: 600 }}>{tour.title}</span></TableCell>
                    <TableCell><span style={{ fontWeight: 700 }}>{formatPrice(tour.price)}</span></TableCell>
                    <TableCell>⭐ {tour.rating}</TableCell>
                    <TableCell>{tour.total_seats}</TableCell>
                    <TableCell>{getStatusChip(tour.status_name)}</TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <Button isIconOnly size="sm" variant="light" onClick={() => window.open(`/TourDetails/${tour.id}`, '_blank')}>
                          <Eye size={16} />
                        </Button>
                        <Button isIconOnly size="sm" variant="light" onClick={() => handleEdit(tour)}>
                          <Edit size={16} />
                        </Button>
                        <Button isIconOnly size="sm" variant="light" color="danger" onClick={() => handleDelete(tour.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
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

      <Modal isOpen={isOpen} onClose={handleClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{editingTour ? 'Редагувати тур' : 'Створити тур'}</ModalHeader>
          <ModalBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Basic info */}
              <div>
                <h4 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Основна інформація</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Input
                    label="Назва туру"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    isRequired
                    variant="bordered"
                  />
                  <Textarea
                    label="Короткий опис"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    variant="bordered"
                    minRows={2}
                  />
                  <Textarea
                    label="Детальний опис"
                    value={formData.detailed_description}
                    onChange={(e) => setFormData({ ...formData, detailed_description: e.target.value })}
                    variant="bordered"
                    minRows={4}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Input
                      label="Ціна (UAH)"
                      type="number"
                      value={formData.price.toString()}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      isRequired
                      variant="bordered"
                    />
                    <Input
                      label="Кількість місць"
                      type="number"
                      value={formData.total_seats.toString()}
                      onChange={(e) => setFormData({ ...formData, total_seats: Number(e.target.value) })}
                      variant="bordered"
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Input
                      label="Call to Action"
                      value={formData.call_to_action}
                      onChange={(e) => setFormData({ ...formData, call_to_action: e.target.value })}
                      variant="bordered"
                    />
                    <Select
                      label="Статус"
                      selectedKeys={[formData.status_id.toString()]}
                      onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0];
                        if (val) setFormData({ ...formData, status_id: Number(val) });
                      }}
                      variant="bordered"
                    >
                      {STATUSES.map((s) => (
                        <SelectItem key={s.id}>{s.label}</SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>

              <Divider />

              {/* Tour Dates */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <Calendar size={18} /> Дати подорожі
                  </h4>
                  <Button size="sm" variant="flat" color="primary" onClick={addDate} startContent={<Plus size={14} />}>
                    Додати дату
                  </Button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {tourDates.map((td, index) => (
                    <Card key={index} style={{ border: '1px solid #e2e8f0' }}>
                      <CardBody style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Дата #{index + 1}</span>
                          {tourDates.length > 1 && (
                            <Button isIconOnly size="sm" variant="light" color="danger" onClick={() => removeDate(index)}>
                              <X size={14} />
                            </Button>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <Select
                            label="Звідки"
                            placeholder="Оберіть місто"
                            selectedKeys={td.from_location_id ? [td.from_location_id.toString()] : []}
                            onSelectionChange={(keys) => {
                              const val = Array.from(keys)[0];
                              if (val) updateDate(index, 'from_location_id', Number(val));
                            }}
                            variant="bordered"
                            size="sm"
                          >
                            {locations.map((loc) => (
                              <SelectItem key={loc.id.toString()}>{loc.name}, {loc.country}</SelectItem>
                            ))}
                          </Select>
                          <Select
                            label="Куди"
                            placeholder="Оберіть місто"
                            selectedKeys={td.to_location_id ? [td.to_location_id.toString()] : []}
                            onSelectionChange={(keys) => {
                              const val = Array.from(keys)[0];
                              if (val) updateDate(index, 'to_location_id', Number(val));
                            }}
                            variant="bordered"
                            size="sm"
                          >
                            {locations.map((loc) => (
                              <SelectItem key={loc.id.toString()}>{loc.name}, {loc.country}</SelectItem>
                            ))}
                          </Select>
                          <Input
                            label="Початок"
                            placeholder="Дата початку"
                            type="datetime-local"
                            value={td.date_from}
                            onChange={(e) => updateDate(index, 'date_from', e.target.value)}
                            variant="bordered"
                            size="sm"
                          />
                          <Input
                            label="Завершення"
                            placeholder="Дата завершення"
                            type="datetime-local"
                            value={td.date_to}
                            onChange={(e) => updateDate(index, 'date_to', e.target.value)}
                            variant="bordered"
                            size="sm"
                          />
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>

              <Divider />

              {/* Images */}
              <div>
                <h4 style={{ marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ImageIcon size={18} /> Зображення
                </h4>

                <ImageUpload
                  label="Зображення картки (каталог)"
                  value={cardImage}
                  onChange={setCardImage}
                  type="card"
                  description="Головне зображення яке показується в каталозі турів"
                />

                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Галерея (сторінка туру)</span>
                    <GalleryUploadButton />
                  </div>

                  {galleryImages.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                      {galleryImages.map((img, index) => (
                        <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                          <img
                            src={`${API_BASE_URL}${img}`}
                            alt={`Gallery ${index + 1}`}
                            style={{
                              width: 120,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              display: 'block',
                            }}
                          />
                          <button
                            onClick={() => removeGalleryImage(index)}
                            style={{
                              position: 'absolute',
                              top: 2,
                              right: 2,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 10,
                            }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Немає зображень в галереї</p>
                  )}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={handleClose}>Скасувати</Button>
            <Button
              color="primary"
              onClick={handleSubmit}
              isLoading={createMutation.isPending || updateMutation.isPending}
              isDisabled={!formData.title || formData.price <= 0}
            >
              {editingTour ? 'Зберегти' : 'Створити'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};