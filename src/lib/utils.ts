import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from 'firebase/firestore';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const toIsoString = (date: any): string => {
  if (!date) return new Date().toISOString();
  if (date instanceof Timestamp) return date.toDate().toISOString();
  if (date.seconds) return new Date(date.seconds * 1000).toISOString();
  return new Date(date).toISOString();
};

export const toTimestamp = (dateString: string): Timestamp => {
  return Timestamp.fromDate(new Date(dateString));
};
