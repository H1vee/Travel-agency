import { useState } from 'react';
import { Card, CardBody, Textarea, Button, Avatar, Chip, Pagination, Divider, Spinner } from '@heroui/react';
import { Star, Send, Edit2, Trash2, MessageCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  useTourComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  Comment
} from '../../hooks/useComments';
import './TourComments.scss';

interface TourCommentsProps {
  tourId: number;
}

export const TourComments = ({ tourId }: TourCommentsProps) => {
  const { isAuthenticated, user } = useAuth();
  const [page, setPage] = useState(1);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const { data, isLoading } = useTourComments(tourId, page);
  const createMutation = useCreateComment();
  const updateMutation = useUpdateComment();
  const deleteMutation = useDeleteComment();

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    if (!isAuthenticated) {
      alert('Увійдіть, щоб залишити коментар');
      return;
    }

    try {
      await createMutation.mutateAsync({
        tour_id: tourId,
        comment: newComment,
        rating: rating || undefined
      });
      setNewComment('');
      setRating(0);
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const handleUpdate = async (commentId: number) => {
    if (!editText.trim()) return;
    try {
      await updateMutation.mutateAsync({
        commentId,
        tourId,
        data: { comment: editText }
      });
      setEditingId(null);
      setEditText('');
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цей коментар?')) return;
    try {
      await deleteMutation.mutateAsync({ commentId, tourId });
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="stars">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            fill={i < rating ? '#fbbf24' : 'none'}
            stroke={i < rating ? '#fbbf24' : '#d1d5db'}
            strokeWidth={2}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return 'Щойно';
    if (diffMins < 60) return `${diffMins} хв тому`;
    if (diffHours < 24) return `${diffHours} год тому`;
    if (diffDays === 1) return 'Вчора';
    if (diffDays < 7) return `${diffDays} дн тому`;
    if (diffWeeks < 4) return `${diffWeeks} тиж тому`;
    
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="tour-comments">
      <div className="comments-header">
        <MessageCircle size={28} />
        <h3>Відгуки туристів</h3>
        {data && data.pagination.total > 0 && (
          <span className="count">{data.pagination.total}</span>
        )}
      </div>

      {isAuthenticated ? (
        <Card className="comment-form-card">
          <CardBody>
            <div className="form-user">
              <Avatar src={user?.avatar_url} name={user?.name} size="md" />
              <span className="username">{user?.name}</span>
            </div>

            <Divider className="my-4" />

            <div className="rating-box">
              <span className="rating-label">Ваша оцінка:</span>
              <div className="rating-stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i + 1)}
                    onMouseEnter={() => setHoverRating(i + 1)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="star-btn"
                  >
                    <Star
                      size={24}
                      fill={i < displayRating ? '#fbbf24' : 'none'}
                      stroke={i < displayRating ? '#fbbf24' : '#d1d5db'}
                      strokeWidth={2}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setRating(0);
                    setHoverRating(0);
                  }}
                  className="rating-clear"
                >
                  Скинути
                </button>
              )}
            </div>

            <Textarea
              placeholder="Розкажіть про ваші враження від туру..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              minRows={4}
              variant="bordered"
              classNames={{
                inputWrapper: "textarea-input"
              }}
            />

            <div className="form-footer">
              <Button
                color="primary"
                startContent={<Send size={18} />}
                onClick={handleSubmit}
                isLoading={createMutation.isPending}
                isDisabled={!newComment.trim()}
              >
                Опублікувати
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card className="auth-card">
          <CardBody>
            <MessageCircle size={48} />
            <p>Увійдіть, щоб залишити відгук</p>
          </CardBody>
        </Card>
      )}

      <div className="comments-list">
        {isLoading && (
          <div className="loading">
            <Spinner size="lg" />
          </div>
        )}

        {data?.comments?.map((comment: Comment) => (
          <Card key={comment.id} className="comment-item">
            <CardBody>
              <div className="comment-header">
                <div className="user-info">
                  <Avatar
                    src={comment.user_avatar}
                    name={comment.user_name}
                    size="sm"
                  />
                  <div className="user-details">
                    <div className="user-row">
                      <span className="username">{comment.user_name}</span>
                      {comment.is_owner && (
                        <Chip size="sm" color="primary" variant="flat">Ваш</Chip>
                      )}
                    </div>
                    <div className="meta">
                      <Clock size={12} />
                      <span>{formatDate(comment.created_at)}</span>
                      {comment.updated_at !== comment.created_at && (
                        <span className="edited">• ред.</span>
                      )}
                    </div>
                  </div>
                </div>

                {comment.is_owner && (
                  <div className="actions">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditText(comment.comment);
                      }}
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onClick={() => handleDelete(comment.id)}
                      isLoading={deleteMutation.isPending}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                )}
              </div>

              {comment.rating && (
                <div className="comment-rating">
                  {renderStars(comment.rating)}
                  <span className="rating-num">{comment.rating}.0</span>
                </div>
              )}

              {editingId === comment.id ? (
                <div className="edit-box">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    minRows={3}
                    variant="bordered"
                  />
                  <div className="edit-btns">
                    <Button
                      size="sm"
                      variant="flat"
                      onClick={() => {
                        setEditingId(null);
                        setEditText('');
                      }}
                    >
                      Скасувати
                    </Button>
                    <Button
                      size="sm"
                      color="primary"
                      onClick={() => handleUpdate(comment.id)}
                      isLoading={updateMutation.isPending}
                      isDisabled={!editText.trim()}
                    >
                      Зберегти
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="comment-text">{comment.comment}</p>
              )}
            </CardBody>
          </Card>
        ))}

        {data && data.pagination && data.pagination.totalPages > 1 && (
          <Pagination
            total={data.pagination.totalPages}
            page={page}
            onChange={setPage}
            showControls
            className="pagination"
          />
        )}

        {data && data.comments && data.comments.length === 0 && !isLoading && (
          <Card className="empty-card">
            <CardBody>
              <MessageCircle size={56} />
              <h4>Поки що немає відгуків</h4>
              <p>Будьте першим!</p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
};