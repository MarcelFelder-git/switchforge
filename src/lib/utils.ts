import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Klassen zusammenführen, Tailwind-Konflikte auflösen (Shadcn-Konvention) */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// --- Typ-Helfer, die die Shadcn-Svelte-Komponenten erwarten ---

export type WithoutChild<T> = T extends { child?: unknown } ? Omit<T, 'child'> : T;
export type WithoutChildren<T> = T extends { children?: unknown } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
