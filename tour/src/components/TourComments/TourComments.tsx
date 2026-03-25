import { useState } from 'react';
import { Spinner, Avatar, Pagination } from '@heroui/react';
import {
  Star, Send, Edit2, Trash2, MessageCircle, Clock,
  Check, X, ShieldCheck, ThumbsUp, ThumbsDown, CornerDownRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  useTourComments, useCreateComment, useUpdateComment,
  useDeleteComment, useToggleReaction, Comment, Reply,
} from '../../hooks/useComments';
import './TourComments.scss';

interface Props { tourId: number; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const Stars = ({ value, onChange, readonly = false, size = 16 }:
  { value: number; onChange?: (v: number) => void; readonly?: boolean; size?: number }) => {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="tc__stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <button key={i} type="button"
          className={`tc__star${readonly ? ' tc__star--ro' : ''}`}
          onClick={() => !readonly && onChange?.(i + 1)}
          onMouseEnter={() => !readonly && setHover(i + 1)}
          onMouseLeave={() => !readonly && setHover(0)}
          disabled={readonly}
        >
          <Star size={size}
            fill={i < active ? '#f59e0b' : 'none'}
            color={i < active ? '#f59e0b' : '#d1d5db'}
            strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
};

const timeAgo = (s: string) => {
  const n = /Z|[+-]\d{2}:\d{2}$/.test(s) ? s : s + 'Z';
  const d = (Date.now() - new Date(n).getTime()) / 1000;
  if (d < 60) return 'Щойно';
  if (d < 3600) return `${Math.floor(d / 60)} хв тому`;
  if (d < 86400) return `${Math.floor(d / 3600)} год тому`;
  if (d < 604800) return `${Math.floor(d / 86400)} дн тому`;
  return new Date(n).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
};

const Badge = ({ isGuest, isVerifiedBuyer, isOwner }: { isGuest: boolean; isVerifiedBuyer: boolean; isOwner: boolean }) => (
  <>
    {isGuest
      ? <span className="tc__badge tc__badge--guest">Гість</span>
      : isVerifiedBuyer
        ? <span className="tc__badge tc__badge--verified"><ShieldCheck size={9} /> Учасник туру</span>
        : <span className="tc__badge tc__badge--user">Користувач</span>
    }
    {isOwner && <span className="tc__badge tc__badge--you">Ви</span>}
  </>
);

// ─── Reactions ────────────────────────────────────────────────────────────────

const Reactions = ({ commentId, tourId, likes, dislikes, likedByMe, dislikedByMe }:
  { commentId: number; tourId: number; likes: number; dislikes: number; likedByMe: boolean; dislikedByMe: boolean }) => {
  const mut = useToggleReaction();
  const fire = (type: 'like' | 'dislike') => mut.mutate({ commentId, tourId, type });
  return (
    <div className="tc__reactions">
      <button className={`tc__react tc__react--like${likedByMe ? ' active' : ''}`}
        onClick={() => fire('like')} disabled={mut.isPending}>
        <ThumbsUp size={12} />
        {likes > 0 && <span>{likes}</span>}
      </button>
      <div className="tc__react-div" />
      <button className={`tc__react tc__react--dislike${dislikedByMe ? ' active' : ''}`}
        onClick={() => fire('dislike')} disabled={mut.isPending}>
        <ThumbsDown size={12} />
        {dislikes > 0 && <span>{dislikes}</span>}
      </button>
    </div>
  );
};

// ─── Comment form ─────────────────────────────────────────────────────────────

interface FormProps {
  tourId: number; parentId?: number;
  isAuthenticated: boolean; userName?: string; userAvatar?: string;
  onCancel?: () => void; isReply?: boolean;
}

const CommentForm = ({ tourId, parentId, isAuthenticated, userName, userAvatar, onCancel, isReply }: FormProps) => {
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);
  const [guestName, setGuestName] = useState('');
  const mut = useCreateComment();

  const canSubmit = text.trim().length > 0 && (isAuthenticated || guestName.trim().length > 0);

  const submit = async () => {
    if (!canSubmit) return;
    await mut.mutateAsync({
      tour_id: tourId, parent_id: parentId, comment: text.trim(),
      rating: !isReply && rating > 0 ? rating : undefined,
      guest_name: !isAuthenticated ? guestName.trim() : undefined,
    });
    setText(''); setRating(0); setGuestName('');
    onCancel?.();
  };

  return (
    <div className={`tc__form${isReply ? ' tc__form--reply' : ''}`}>
      <Avatar name={isAuthenticated ? userName : (guestName || 'Г')}
        src={isAuthenticated ? userAvatar : undefined} size="sm" className="tc__form-av" />
      <div className="tc__form-body">
        <div className="tc__form-top">
          {isAuthenticated
            ? <span className="tc__form-name">{userName}</span>
            : <input className="tc__guest-input" placeholder="Ваше ім'я"
                value={guestName} onChange={e => setGuestName(e.target.value)} maxLength={40} />
          }
          {!isReply && (
            <>
              <Stars value={rating} onChange={setRating} />
              {rating > 0 && <button className="tc__clear-star" onClick={() => setRating(0)}><X size={10} /></button>}
            </>
          )}
        </div>
        <textarea className="tc__ta"
          placeholder={isReply ? 'Написати відповідь...' : 'Поділіться враженнями від туру...'}
          value={text} onChange={e => setText(e.target.value)}
          rows={isReply ? 2 : 3} autoFocus={isReply}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) submit(); }}
        />
        <div className="tc__form-foot">
          <span className="tc__hint">{!isAuthenticated && 'Як гість · '}Ctrl+Enter</span>
          <div className="tc__form-actions">
            {onCancel && (
              <button className="tc__btn tc__btn--ghost" onClick={onCancel}>
                <X size={12} /> Скасувати
              </button>
            )}
            <button className="tc__btn tc__btn--primary" onClick={submit}
              disabled={!canSubmit || mut.isPending}>
              {mut.isPending ? <Spinner size="sm" color="white" />
                : <><Send size={12} /> {isReply ? 'Відповісти' : 'Опублікувати'}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Edit inline ──────────────────────────────────────────────────────────────

const EditBox = ({ initial, onSave, onCancel, loading }:
  { initial: string; onSave: (t: string) => void; onCancel: () => void; loading: boolean }) => {
  const [val, setVal] = useState(initial);
  return (
    <div className="tc__edit">
      <textarea className="tc__ta" value={val} onChange={e => setVal(e.target.value)} rows={2} autoFocus />
      <div className="tc__edit-btns">
        <button className="tc__btn tc__btn--ghost" onClick={onCancel}><X size={12} /> Скасувати</button>
        <button className="tc__btn tc__btn--primary" onClick={() => onSave(val)}
          disabled={!val.trim() || loading}>
          {loading ? <Spinner size="sm" color="white" /> : <><Check size={12} /> Зберегти</>}
        </button>
      </div>
    </div>
  );
};

// ─── Delete confirm ───────────────────────────────────────────────────────────

const DelConfirm = ({ onConfirm, onCancel, loading }:
  { onConfirm: () => void; onCancel: () => void; loading: boolean }) => (
  <div className="tc__del">
    <span>Видалити?</span>
    <button className="tc__del-no" onClick={onCancel}><X size={11} /> Ні</button>
    <button className="tc__del-yes" onClick={onConfirm} disabled={loading}>
      {loading ? <Spinner size="sm" color="white" /> : <><Trash2 size={11} /> Так</>}
    </button>
  </div>
);

// ─── Reply card ───────────────────────────────────────────────────────────────

interface ReplyCardProps {
  r: Reply; tourId: number;
  // для кнопки "Відповісти" на відповідь — шлемо parent_id батьківського коментаря
  parentCommentId: number;
  onReply: (id: number) => void;
  replyingToId: number | null;
  isAuthenticated: boolean;
  userName?: string;
  userAvatar?: string;
}

const ReplyCard = ({ r, tourId, parentCommentId, onReply, replyingToId, isAuthenticated, userName, userAvatar }: ReplyCardProps) => {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const updateMut = useUpdateComment();
  const deleteMut = useDeleteComment();

  return (
    <>
      <div className="tc__reply">
        <Avatar name={r.user_name} src={r.user_avatar} size="sm"
          className="tc__av tc__av--sm" />
        <div className="tc__body">
          <div className="tc__top">
            <div className="tc__meta">
              <span className="tc__name">{r.user_name}</span>
              <Badge isGuest={r.is_guest} isVerifiedBuyer={r.is_verified_buyer} isOwner={r.is_owner} />
              <span className="tc__time"><Clock size={10} />{timeAgo(r.created_at)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Reactions commentId={r.id} tourId={tourId}
                likes={r.likes_count} dislikes={r.dislikes_count}
                likedByMe={r.liked_by_me} dislikedByMe={r.disliked_by_me} />
              {r.is_owner && !r.is_guest && !editing && !deleting && (
                <div className="tc__acts">
                  <button className="tc__act" onClick={() => setEditing(true)}><Edit2 size={12} /></button>
                  <button className="tc__act tc__act--del" onClick={() => setDeleting(true)}><Trash2 size={12} /></button>
                </div>
              )}
            </div>
          </div>

          {deleting && (
            <DelConfirm loading={deleteMut.isPending}
              onCancel={() => setDeleting(false)}
              onConfirm={async () => { await deleteMut.mutateAsync({ commentId: r.id, tourId }); setDeleting(false); }} />
          )}
          {editing
            ? <EditBox initial={r.comment} loading={updateMut.isPending} onCancel={() => setEditing(false)}
                onSave={async t => { await updateMut.mutateAsync({ commentId: r.id, tourId, data: { comment: t } }); setEditing(false); }} />
            : !deleting && <p className="tc__text">{r.comment}</p>
          }

          {!editing && !deleting && (
            <div className="tc__bottom">
              <button className="tc__reply-btn" onClick={() => onReply(r.id)}>
                <CornerDownRight size={11} /> Відповісти
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reply form under this reply — but parent_id points to the top-level comment */}
      {replyingToId === r.id && (
        <div style={{ paddingLeft: 40 }}>
          <CommentForm tourId={tourId} parentId={parentCommentId}
            isAuthenticated={isAuthenticated} userName={userName} userAvatar={userAvatar}
            onCancel={() => onReply(0)} isReply />
        </div>
      )}
    </>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export const TourComments = ({ tourId }: Props) => {
  const { isAuthenticated, user } = useAuth();
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  // replyingTo: id of the comment/reply we're replying to (for UI toggle)
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const { data, isLoading } = useTourComments(tourId, page);
  const updateMut = useUpdateComment();
  const deleteMut = useDeleteComment();

  const comments: Comment[] = data?.comments ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;

  const toggleReply = (id: number) => setReplyingTo(prev => prev === id ? null : id);

  return (
    <section className="tc">

      <div className="tc__hd">
        <MessageCircle size={18} className="tc__hd-icon" />
        <h2 className="tc__hd-title">Відгуки</h2>
        {total > 0 && <span className="tc__hd-count">{total}</span>}
      </div>

      <CommentForm tourId={tourId} isAuthenticated={isAuthenticated}
        userName={user?.name} userAvatar={user?.avatar_url} />

      <div className="tc__list">
        {isLoading ? (
          <div className="tc__loader"><Spinner /></div>
        ) : comments.length === 0 ? (
          <div className="tc__empty">
            <span className="tc__empty-ico">💬</span>
            <strong>Поки що немає відгуків</strong>
            <span>Будьте першим!</span>
          </div>
        ) : comments.map(c => (
          <div key={c.id}>
            <article className="tc__card">
              <Avatar name={c.user_name} src={c.user_avatar} size="sm" className="tc__av" />
              <div className="tc__body">

                <div className="tc__top">
                  <div className="tc__meta">
                    <span className="tc__name">{c.user_name}</span>
                    <Badge isGuest={c.is_guest} isVerifiedBuyer={c.is_verified_buyer} isOwner={c.is_owner} />
                    <span className="tc__time">
                      <Clock size={10} />{timeAgo(c.created_at)}
                      {c.updated_at !== c.created_at && <em> · ред.</em>}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Reactions commentId={c.id} tourId={tourId}
                      likes={c.likes_count} dislikes={c.dislikes_count}
                      likedByMe={c.liked_by_me} dislikedByMe={c.disliked_by_me} />
                    {c.is_owner && !c.is_guest && editId !== c.id && deleteId !== c.id && (
                      <div className="tc__acts">
                        <button className="tc__act" onClick={() => setEditId(c.id)}><Edit2 size={12} /></button>
                        <button className="tc__act tc__act--del" onClick={() => setDeleteId(c.id)}><Trash2 size={12} /></button>
                      </div>
                    )}
                  </div>
                </div>

                {c.rating && c.rating > 0 && <Stars value={c.rating} readonly size={13} />}

                {deleteId === c.id && (
                  <DelConfirm loading={deleteMut.isPending}
                    onCancel={() => setDeleteId(null)}
                    onConfirm={async () => { await deleteMut.mutateAsync({ commentId: c.id, tourId }); setDeleteId(null); }} />
                )}

                {editId === c.id
                  ? <EditBox initial={c.comment} loading={updateMut.isPending}
                      onCancel={() => setEditId(null)}
                      onSave={async t => { await updateMut.mutateAsync({ commentId: c.id, tourId, data: { comment: t } }); setEditId(null); }} />
                  : deleteId !== c.id && <p className="tc__text">{c.comment}</p>
                }

                {editId !== c.id && deleteId !== c.id && (
                  <div className="tc__bottom">
                    <button className="tc__reply-btn" onClick={() => toggleReply(c.id)}>
                      <CornerDownRight size={11} />
                      {replyingTo === c.id ? 'Скасувати' : 'Відповісти'}
                    </button>
                  </div>
                )}

                {/* Reply form under the top-level comment */}
                {replyingTo === c.id && (
                  <CommentForm tourId={tourId} parentId={c.id}
                    isAuthenticated={isAuthenticated} userName={user?.name} userAvatar={user?.avatar_url}
                    onCancel={() => setReplyingTo(null)} isReply />
                )}

                {/* Replies */}
                {c.replies.length > 0 && (
                  <div className="tc__replies">
                    {c.replies.map(r => (
                      <ReplyCard key={r.id} r={r} tourId={tourId}
                        parentCommentId={c.id}
                        onReply={id => setReplyingTo(prev => prev === id ? null : id)}
                        replyingToId={replyingTo}
                        isAuthenticated={isAuthenticated}
                        userName={user?.name}
                        userAvatar={user?.avatar_url}
                      />
                    ))}
                  </div>
                )}

              </div>
            </article>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="tc__pages">
          <Pagination total={totalPages} page={page} onChange={setPage} showControls size="sm" color="primary" />
        </div>
      )}
    </section>
  );
};