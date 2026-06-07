import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { adminService, AdminCar, CarInput, Status } from '../../services/AdminService';
import { carService } from '../../services/CarService';
import {
  FUEL_LABELS,
  TRANSMISSION_LABELS,
  DRIVE_LABELS,
  label,
} from '../../types/cars';
import './Admin.scss';

const EMPTY_CAR: CarInput = {
  make: '',
  model: '',
  year: new Date().getFullYear(),
  vin: '',
  price: 0,
  mileage: 0,
  fuel_type: 'petrol',
  engine: '',
  engine_capacity: null,
  battery_capacity: null,
  transmission: 'automatic',
  drive: 'front',
  body_type: '',
  color: '',
  seats: 5,
  description: '',
  status_id: 1,
  card_image: '',
  gallery_images: [],
};

const FUEL_KEYS = Object.keys(FUEL_LABELS);
const TRANSMISSION_KEYS = Object.keys(TRANSMISSION_LABELS);
const DRIVE_KEYS = Object.keys(DRIVE_LABELS);

export const AdminCars: React.FC = () => {
  const [cars, setCars] = useState<AdminCar[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editing, setEditing] = useState<CarInput | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await adminService.getCars(page, 20);
      setCars(data.cars || []);
      setTotalPages(data.total_pages || 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка');
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    adminService.getStatuses().then(setStatuses).catch(() => setStatuses([]));
  }, []);

  const openNew = () => {
    setEditId(null);
    setEditing({ ...EMPTY_CAR, status_id: statuses[0]?.id || 1 });
  };

  const openEdit = async (id: number) => {
    try {
      const { car, card_image, gallery_images } = await adminService.getCarDetail(id);
      setEditId(id);
      setEditing({
        make: car.make || '',
        model: car.model || '',
        year: car.year || new Date().getFullYear(),
        vin: car.vin || '',
        price: Number(car.price) || 0,
        mileage: car.mileage || 0,
        fuel_type: car.fuel_type || 'petrol',
        engine: car.engine || '',
        engine_capacity: car.engine_capacity ?? null,
        battery_capacity: car.battery_capacity ?? null,
        transmission: car.transmission || 'automatic',
        drive: car.drive || 'front',
        body_type: car.body_type || '',
        color: car.color || '',
        seats: car.seats || 5,
        description: car.description || '',
        status_id: car.status_id || statuses[0]?.id || 1,
        card_image: card_image || '',
        gallery_images: gallery_images || [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка');
    }
  };

  const save = async () => {
    if (!editing) return;
    try {
      if (editId) await adminService.updateCar(editId, editing);
      else await adminService.createCar(editing);
      setEditing(null);
      setEditId(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не вдалося зберегти');
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Видалити цей автомобіль?')) return;
    await adminService.deleteCar(id);
    load();
  };

  const quickStatus = async (car: AdminCar, statusId: number) => {
    await adminService.setCarStatus(car.id, statusId);
    load();
  };

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <h1>Автомобілі</h1>
        <button className="admin-btn" onClick={openNew}>
          <Plus size={18} /> Додати авто
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Авто</th>
            <th>Рік</th>
            <th>Ціна</th>
            <th>Статус</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {cars.map((car) => (
            <tr key={car.id}>
              <td>{car.id}</td>
              <td>{car.make} {car.model}</td>
              <td>{car.year}</td>
              <td>${Math.round(car.price).toLocaleString('uk-UA')}</td>
              <td>
                <select
                  value={car.status_id}
                  onChange={(e) => quickStatus(car, Number(e.target.value))}
                  className={`admin-status-select ${car.status_name === 'active' ? 'is-active' : ''}`}
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name === 'active' ? 'Опубліковано' : 'Приховано'}
                    </option>
                  ))}
                </select>
              </td>
              <td className="admin-table__actions">
                <button onClick={() => openEdit(car.id)} title="Редагувати"><Pencil size={16} /></button>
                <button onClick={() => remove(car.id)} title="Видалити"><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
          {cars.length === 0 && (
            <tr><td colSpan={6} className="admin-table__empty">Автомобілів ще немає.</td></tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="admin-pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>
              {p}
            </button>
          ))}
        </div>
      )}

      {editing && (
        <CarForm
          value={editing}
          statuses={statuses}
          isNew={!editId}
          onChange={setEditing}
          onSave={save}
          onClose={() => { setEditing(null); setEditId(null); }}
        />
      )}
    </div>
  );
};

interface FormProps {
  value: CarInput;
  statuses: Status[];
  isNew: boolean;
  onChange: (v: CarInput) => void;
  onSave: () => void;
  onClose: () => void;
}

const CarForm: React.FC<FormProps> = ({ value, statuses, isNew, onChange, onSave, onClose }) => {
  const [uploading, setUploading] = useState(false);
  const set = (patch: Partial<CarInput>) => onChange({ ...value, ...patch });

  const uploadCard = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      set({ card_image: await adminService.uploadImage(file, 'card') });
    } finally {
      setUploading(false);
    }
  };

  const uploadGallery = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map((f) => adminService.uploadImage(f, 'gallery')));
      set({ gallery_images: [...value.gallery_images, ...urls] });
    } finally {
      setUploading(false);
    }
  };

  const numOrNull = (v: string) => (v === '' ? null : Number(v));

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{isNew ? 'Новий автомобіль' : 'Редагування авто'}</h2>

        <div className="admin-form-grid">
          <label>Марка *<input value={value.make} onChange={(e) => set({ make: e.target.value })} /></label>
          <label>Модель *<input value={value.model} onChange={(e) => set({ model: e.target.value })} /></label>
          <label>Рік *<input type="number" value={value.year} onChange={(e) => set({ year: Number(e.target.value) })} /></label>
          <label>Ціна, $ *<input type="number" value={value.price} onChange={(e) => set({ price: Number(e.target.value) })} /></label>
          <label>VIN<input value={value.vin} onChange={(e) => set({ vin: e.target.value })} /></label>
          <label>Пробіг, км<input type="number" value={value.mileage} onChange={(e) => set({ mileage: Number(e.target.value) })} /></label>

          <label>Тип палива
            <select value={value.fuel_type} onChange={(e) => set({ fuel_type: e.target.value })}>
              {FUEL_KEYS.map((k) => <option key={k} value={k}>{label(FUEL_LABELS, k)}</option>)}
            </select>
          </label>
          <label>Двигун<input value={value.engine} onChange={(e) => set({ engine: e.target.value })} placeholder="2.0 TDI" /></label>
          <label>Об'єм двигуна, л
            <input type="number" step="0.1" value={value.engine_capacity ?? ''} onChange={(e) => set({ engine_capacity: numOrNull(e.target.value) })} />
          </label>
          <label>Ємність батареї, кВт
            <input type="number" step="0.1" value={value.battery_capacity ?? ''} onChange={(e) => set({ battery_capacity: numOrNull(e.target.value) })} />
          </label>

          <label>Коробка передач
            <select value={value.transmission} onChange={(e) => set({ transmission: e.target.value })}>
              {TRANSMISSION_KEYS.map((k) => <option key={k} value={k}>{label(TRANSMISSION_LABELS, k)}</option>)}
            </select>
          </label>
          <label>Привід
            <select value={value.drive} onChange={(e) => set({ drive: e.target.value })}>
              {DRIVE_KEYS.map((k) => <option key={k} value={k}>{label(DRIVE_LABELS, k)}</option>)}
            </select>
          </label>
          <label>Тип кузова<input value={value.body_type} onChange={(e) => set({ body_type: e.target.value })} placeholder="sedan / suv …" /></label>
          <label>Колір<input value={value.color} onChange={(e) => set({ color: e.target.value })} /></label>
          <label>Кількість місць<input type="number" value={value.seats} onChange={(e) => set({ seats: Number(e.target.value) })} /></label>
          <label>Статус
            <select value={value.status_id} onChange={(e) => set({ status_id: Number(e.target.value) })}>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>{s.name === 'active' ? 'Опубліковано' : 'Приховано'}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="admin-form-full">Детальний опис
          <textarea rows={4} value={value.description} onChange={(e) => set({ description: e.target.value })} />
        </label>

        <div className="admin-form-full">
          <span className="admin-form-label">Головне фото</span>
          <input type="file" accept="image/*" onChange={(e) => uploadCard(e.target.files?.[0])} />
          {value.card_image && <img className="admin-preview" src={carService.getImageUrl(value.card_image)} alt="card" />}
        </div>

        <div className="admin-form-full">
          <span className="admin-form-label">Галерея (карусель)</span>
          <input type="file" accept="image/*" multiple onChange={(e) => uploadGallery(e.target.files)} />
          <div className="admin-gallery-previews">
            {value.gallery_images.map((src, i) => (
              <div key={i} className="admin-gallery-thumb">
                <img src={carService.getImageUrl(src)} alt={`g${i}`} />
                <button onClick={() => set({ gallery_images: value.gallery_images.filter((_, j) => j !== i) })}>×</button>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-modal__actions">
          <button className="admin-btn ghost" onClick={onClose}>Скасувати</button>
          <button className="admin-btn" onClick={onSave} disabled={uploading}>
            {uploading ? 'Завантаження фото…' : 'Зберегти'}
          </button>
        </div>
      </div>
    </div>
  );
};
