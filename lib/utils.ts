import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function padId(id: number): string {
  return String(id).padStart(4, '0');
}

export function formatHeight(decimetres: number): string {
  const m = decimetres / 10;
  return `${m.toFixed(1)} m`;
}

export function formatWeight(hectograms: number): string {
  const kg = hectograms / 10;
  return `${kg.toFixed(1)} kg`;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
}
