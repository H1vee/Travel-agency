export interface ToastStateProps {
    /** The maximum number of toasts to display at a time. */
    maxVisibleToasts?: number;
    /**
     * Whether toasts have an exit animation. If true, toasts are not
     * removed immediately but transition into an "exiting" state instead.
     * Once the animation is complete, call the `remove` function.
     */
    hasExitAnimation?: boolean;
}
export interface ToastOptions {
    /** Handler that is called when the toast is closed, either by the user or after a timeout. */
    onClose?: () => void;
    /** A timeout to automatically close the toast after, in milliseconds. */
    timeout?: number;
    /** The priority of the toast relative to other toasts. Larger numbers indicate higher priority. */
    priority?: number;
}
export interface QueuedToast<T> extends ToastOptions {
    /** The content of the toast. */
    content: T;
    /** A unique key for the toast. */
    key: string;
    /** A timer for the toast, if a timeout was set. */
    timer?: Timer;
    /** The current animation state for the toast. */
    animation?: 'entering' | 'queued' | 'exiting' | null;
}
export interface ToastState<T> {
    /** Adds a new toast to the queue. */
    add(content: T, options?: ToastOptions): string;
    /**
     * Closes a toast. If `hasExitAnimation` is true, the toast
     * transitions to an "exiting" state instead of being removed immediately.
     */
    close(key: string): void;
    /** Removes a toast from the visible toasts after an exiting animation. */
    remove(key: string): void;
    /** Pauses the timers for all visible toasts. */
    pauseAll(): void;
    /** Resumes the timers for all visible toasts. */
    resumeAll(): void;
    /** The visible toasts. */
    visibleToasts: QueuedToast<T>[];
}
/**
 * Provides state management for a toast queue. Toasts display brief, temporary notifications
 * of actions, errors, or other events in an application.
 */
export function useToastState<T>(props?: ToastStateProps): ToastState<T>;
/**
 * Subscribes to a provided toast queue and provides methods to update it.
 */
export function useToastQueue<T>(queue: ToastQueue<T>): ToastState<T>;
/**
 * A ToastQueue is a priority queue of toasts.
 */
export class ToastQueue<T> {
    /** The currently visible toasts. */
    visibleToasts: QueuedToast<T>[];
    constructor(options?: ToastStateProps);
    /** Subscribes to updates to the visible toasts. */
    subscribe(fn: () => void): () => boolean;
    /** Adds a new toast to the queue. */
    add(content: T, options?: ToastOptions): string;
    /**
     * Closes a toast. If `hasExitAnimation` is true, the toast
     * transitions to an "exiting" state instead of being removed immediately.
     */
    close(key: string): void;
    /** Removes a toast from the visible toasts after an exiting animation. */
    remove(key: string): void;
    /** Pauses the timers for all visible toasts. */
    pauseAll(): void;
    /** Resumes the timers for all visible toasts. */
    resumeAll(): void;
}
declare class Timer {
    constructor(callback: () => void, delay: number);
    reset(delay: number): void;
    pause(): void;
    resume(): void;
}

//# sourceMappingURL=types.d.ts.map
