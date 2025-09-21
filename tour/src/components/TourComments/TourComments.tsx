// tour/src/components/TourComments/TourComments.tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Textarea,
  Avatar,
  Spinner,
  Pagination,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { addToast } from "@heroui/react";
import { useAuth } from '../../context/AuthContext';
import { 
  MessageCircle, 
  Star, 
  Send, 
  Edit3, 
  Trash2, 
  MoreVertical,
  AlertCircle,
  User
} from 'lucide-react';
import './TourComments.scss';

interface Comment {
  id: number;
  tour_id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  comment: string;
  rating?: number;
  created_at: string;
  updated_at: string;
  is_owner: boolean;
}

interface CommentsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CommentsResponse {
  comments: Comment[];
  pagination: CommentsPagination;
}

interface TourCommentsProps {
  tourId: number;
  className?: string;
}

export const TourComments: React.FC<TourCommentsProps> = ({ tourId, className = '' }) => {
  const { isAuthenticated, user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<CommentsPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  
  // Form states
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Edit states
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState<number | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  
  // Delete modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [deletingComment, setDeletingComment] = useState<Comment | null>(null);

  const fetchComments = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('tour_auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token && isAuthenticated) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `http://127.0.0.1:1323/tour-comments/${tourId}?page=${page}&limit=${pagination.limit}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }

      const data: CommentsResponse = await response.json();
      
      // Переконуємось, що comments завжди є масивом
      setComments(Array.isArray(data.comments) ? data.comments : []);
      setPagination(data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      const errorMessage = error instanceof Error ? error.message : 'Не вдалося завантажити коментарі';
      setError(errorMessage);
      setComments([]); // Встановлюємо порожній масив при помилці
      addToast({
        title: "Помилка",
        description: errorMessage,
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tourId && tourId > 0) {
      fetchComments();
    } else {
      setLoading(false);
      setComments([]);
    }
  }, [tourId, isAuthenticated]);

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      addToast({
        title: "Увійдіть в акаунт",
        description: "Для залишення коментарів потрібна авторизація",
        color: "warning",
      });
      return;
    }

    if (!newComment.trim() || newComment.length < 5) {
      addToast({
        title: "Некоректний коментар",
        description: "Коментар повинен містити принаймні 5 символів",
        color: "warning",
      });
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('tour_auth_token');
      
      if (!token) {
        throw new Error('Токен авторизації не знайдено');
      }
      
      const response = await fetch('http://127.0.0.1:1323/tour-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tour_id: tourId,
          comment: newComment.trim(),
          rating: newRating,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create comment');
      }

      addToast({
        title: "Коментар додано!",
        description: "Ваш коментар успішно додано",
        color: "success",
      });

      setNewComment('');
      setNewRating(null);
      fetchComments(pagination.page);
    } catch (error) {
      console.error('Error creating comment:', error);
      addToast({
        title: "Помилка",
        description: error instanceof Error ? error.message : "Не вдалося додати коментар",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async () => {
    if (!editingComment || !editText.trim() || editText.length < 5) {
      addToast({
        title: "Некоректний коментар",
        description: "Коментар повинен містити принаймні 5 символів",
        color: "warning",
      });
      return;
    }

    try {
      setEditSubmitting(true);
      const token = localStorage.getItem('tour_auth_token');
      
      if (!token) {
        throw new Error('Токен авторизації не знайдено');
      }
      
      const response = await fetch(`http://127.0.0.1:1323/tour-comments/${editingComment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          comment: editText.trim(),
          rating: editRating,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update comment');
      }

      addToast({
        title: "Коментар оновлено!",
        description: "Ваш коментар успішно оновлено",
        color: "success",
      });

      setEditingComment(null);
      setEditText('');
      setEditRating(null);
      fetchComments(pagination.page);
    } catch (error) {
      console.error('Error updating comment:', error);
      addToast({
        title: "Помилка",
        description: error instanceof Error ? error.message : "Не вдалося оновити коментар",
        color: "danger",
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!deletingComment) return;

    try {
      const token = localStorage.getItem('tour_auth_token');
      
      if (!token) {
        throw new Error('Токен авторизації не знайдено');
      }
      
      const response = await fetch(`http://127.0.0.1:1323/tour-comments/${deletingComment.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete comment');
      }

      addToast({
        title: "Коментар видалено!",
        description: "Ваш коментар успішно видалено",
        color: "success",
      });

      setDeletingComment(null);
      onClose();
      fetchComments(pagination.page);
    } catch (error) {
      console.error('Error deleting comment:', error);
      addToast({
        title: "Помилка",
        description: error instanceof Error ? error.message : "Не вдалося видалити коментар",
        color: "danger",
      });
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingComment(comment);
    setEditText(comment.comment);
    setEditRating(comment.rating || null);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditText('');
    setEditRating(null);
  };

  const startDelete = (comment: Comment) => {
    setDeletingComment(comment);
    onOpen();
  };

  const renderStars = (rating: number | null, interactive: boolean = false, onStarClick?: (rating: number) => void) => {
    if (!rating && !interactive) return null;
    
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={`star ${star <= (rating || 0) ? 'filled' : 'empty'} ${interactive ? 'interactive' : ''}`}
            fill={star <= (rating || 0) ? "currentColor" : "none"}
            onClick={interactive && onStarClick ? () => onStarClick(star) : undefined}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Щойно';
      if (diffInHours < 24) return `${diffInHours} год тому`;
      if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} дн тому`;
      
      return date.toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Невідомо';
    }
  };

  const getAvatarUrl = (user_avatar: string | undefined, user_name: string) => {
    if (user_avatar) return user_avatar;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user_name)}&background=2c7be5&color=fff&size=128`;
  };

  // Якщо tourId невалідний
  if (!tourId || tourId <= 0) {
    return (
      <div className={`tour-comments ${className}`}>
        <Card className="tour-comments__container">
          <CardBody>
            <div className="empty-state">
              <AlertCircle size={48} />
              <h4>Невалідний тур</h4>
              <p>Не вдалося завантажити коментарі для цього туру</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Якщо сталася помилка
  if (error && !loading) {
    return (
      <div className={`tour-comments ${className}`}>
        <Card className="tour-comments__container">
          <CardBody>
            <div className="loading-state">
              <AlertCircle size={48} />
              <h4>Помилка завантаження</h4>
              <p>{error}</p>
              <Button color="primary" onClick={() => fetchComments()}>
                Спробувати знову
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className={`tour-comments ${className}`}>
      <Card className="tour-comments__container">
        <CardHeader className="tour-comments__header">
          <div className="header-content">
            <div className="header-main">
              <MessageCircle size={24} className="header-icon" />
              <div>
                <h3>Коментарі</h3>
                <p>{pagination.total || 0} {pagination.total === 1 ? 'коментар' : 'коментарів'}</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardBody className="tour-comments__body">
          {/* New Comment Form */}
          {isAuthenticated ? (
            <Card className="comment-form">
              <CardBody>
                <div className="comment-form__user">
                  <Avatar
                    src={getAvatarUrl(user?.avatar_url, user?.name || '')}
                    name={user?.name}
                    size="sm"
                  />
                  <span className="user-name">{user?.name}</span>
                </div>
                
                <div className="custom-textarea-wrapper">
                  <label className="textarea-label">Коментар</label>
                  <textarea
                    placeholder="Поділіться своїми враженнями про цей тур..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="custom-textarea"
                  />
                </div>
                
                <div className="comment-form__actions">
                  <div className="rating-section">
                    <span className="rating-label">Оцінка:</span>
                    {renderStars(newRating, true, setNewRating)}
                    {newRating && (
                      <Button
                        size="sm"
                        variant="light"
                        onClick={() => setNewRating(null)}
                      >
                        Скасувати оцінку
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    color="primary"
                    startContent={<Send size={16} />}
                    onClick={handleSubmitComment}
                    isLoading={submitting}
                    isDisabled={!newComment.trim() || newComment.length < 5}
                  >
                    Опублікувати
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card className="auth-prompt">
              <CardBody>
                <div className="auth-prompt__content">
                  <User size={32} className="auth-icon" />
                  <div>
                    <h4>Увійдіть в акаунт</h4>
                    <p>Щоб залишити коментар, потрібно увійти в систему</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Comments List */}
          <div className="comments-list">
            {loading ? (
              <div className="loading-state">
                <Spinner size="lg" />
                <p>Завантаження коментарів...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="empty-state">
                <MessageCircle size={48} />
                <h4>Поки що немає коментарів</h4>
                <p>Станьте першим, хто поділиться враженнями про цей тур!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id} className="comment-item">
                  <CardBody>
                    <div className="comment-header">
                      <div className="comment-user">
                        <Avatar
                          src={getAvatarUrl(comment.user_avatar, comment.user_name)}
                          name={comment.user_name}
                          size="sm"
                        />
                        <div className="user-info">
                          <span className="user-name">{comment.user_name}</span>
                          <span className="comment-date">{formatDate(comment.created_at)}</span>
                        </div>
                      </div>
                      
                      <div className="comment-actions">
                        {comment.rating && (
                          <div className="comment-rating">
                            {renderStars(comment.rating)}
                          </div>
                        )}
                        
                        {comment.is_owner && (
                          <Dropdown>
                            <DropdownTrigger>
                              <Button isIconOnly variant="light" size="sm">
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                              <DropdownItem
                                key="edit"
                                startContent={<Edit3 size={16} />}
                                onPress={() => startEdit(comment)}
                              >
                                Редагувати
                              </DropdownItem>
                              <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
                                startContent={<Trash2 size={16} />}
                                onPress={() => startDelete(comment)}
                              >
                                Видалити
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        )}
                      </div>
                    </div>
                    
                    {editingComment?.id === comment.id ? (
                      <div className="edit-form">
                        <div className="custom-textarea-wrapper">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            className="custom-textarea"
                            placeholder="Редагувати коментар..."
                          />
                        </div>
                        
                        <div className="edit-actions">
                          <div className="rating-section">
                            <span className="rating-label">Оцінка:</span>
                            {renderStars(editRating, true, setEditRating)}
                            {editRating && (
                              <Button
                                size="sm"
                                variant="light"
                                onClick={() => setEditRating(null)}
                              >
                                Скасувати оцінку
                              </Button>
                            )}
                          </div>
                          
                          <div className="action-buttons">
                            <Button
                              variant="light"
                              onClick={cancelEdit}
                              isDisabled={editSubmitting}
                            >
                              Скасувати
                            </Button>
                            <Button
                              color="primary"
                              onClick={handleEditComment}
                              isLoading={editSubmitting}
                              isDisabled={!editText.trim() || editText.length < 5}
                            >
                              Зберегти
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="comment-content">
                        <p>{comment.comment}</p>
                        {comment.updated_at !== comment.created_at && (
                          <Chip size="sm" variant="flat" color="default">
                            Відредаговано
                          </Chip>
                        )}
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="comments-pagination">
              <Pagination
                total={pagination.totalPages}
                initialPage={pagination.page}
                onChange={(page) => fetchComments(page)}
                showControls
                showShadow
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            <div className="modal-header">
              <AlertCircle size={24} className="warning-icon" />
              <span>Видалити коментар?</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <p>Ви впевнені, що хочете видалити цей коментар? Цю дію неможливо скасувати.</p>
            {deletingComment && (
              <Card className="comment-preview">
                <CardBody>
                  <p>"{deletingComment.comment}"</p>
                </CardBody>
              </Card>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Скасувати
            </Button>
            <Button color="danger" onPress={handleDeleteComment}>
              Видалити
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};