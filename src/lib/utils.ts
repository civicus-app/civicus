import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import type { PolicyStatus, SentimentType } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getStatusColor(status: PolicyStatus): string {
  const colors: Record<PolicyStatus, string> = {
    active: 'bg-blue-100 text-blue-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-gray-100 text-gray-800',
    draft: 'bg-gray-100 text-gray-500',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getSentimentColor(sentiment: SentimentType): string {
  const colors: Record<SentimentType, string> = {
    positive: 'text-green-600',
    neutral: 'text-yellow-600',
    negative: 'text-red-600',
  };
  return colors[sentiment] || 'text-gray-600';
}

export function getSentimentBgColor(sentiment: SentimentType): string {
  const colors: Record<SentimentType, string> = {
    positive: 'bg-green-100 text-green-800',
    neutral: 'bg-yellow-100 text-yellow-800',
    negative: 'bg-red-100 text-red-800',
  };
  return colors[sentiment] || 'bg-gray-100 text-gray-800';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
