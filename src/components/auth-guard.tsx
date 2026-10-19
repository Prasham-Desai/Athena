'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

const PUBLIC_ROUTES = ['/login'];

/**
 * AuthGuard
 *
 * Wraps all application content and redirects unauthenticated visitors to /login.
 * The `returnTo` query parameter carries the originally requested path so the
 * user is returned there after a successful login.
 *
 * On public routes (e.g. /login), renders only `{children}` — without the
 * sidebar, DataSeeder, or other app-shell components — so the login page gets
 * a clean, full-screen canvas.
 *
 * On protected routes, renders `null` until authentication is confirmed,
 * preventing any flash of protected content.
 */
export function AuthGuard({ children, shell }: { children: React.ReactNode; shell: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  useEffect(() => {
    if (!isAuthenticated && !isPublic) {
      const encoded = encodeURIComponent(pathname);
      router.replace(`/login?returnTo=${encoded}`);
    }
  }, [isAuthenticated, isPublic, pathname, router]);

  // Public route (login): render the page without the app shell.
  if (isPublic) return <>{children}</>;

  // Protected route but not yet authenticated → show nothing (blank screen)
  // while the redirect is happening to prevent content flash.
  if (!isAuthenticated) return null;

  // Authenticated: render the full app shell + current page.
  return <>{shell}</>;
}
