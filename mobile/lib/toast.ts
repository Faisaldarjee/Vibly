// Global toast event bus — callable from anywhere (including Api.ts)
// without needing React context

import type { ToastType } from '@/types';

type ToastHandler = (message: string, type: ToastType) => void;

let _handler: ToastHandler | null = null;

export function registerToastHandler(handler: ToastHandler) {
  _handler = handler;
}

export function showToast(message: string, type: ToastType = 'error') {
  _handler?.(message, type);
}
