export declare function useDebouncedCallback<T extends (...args: any[]) => any>(callback: T, delay: number): (...args: Parameters<T>) => void;
