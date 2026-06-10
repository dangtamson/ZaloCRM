const AUTH_ROUTE_NAMES = new Set(['/login', '/setup']);

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTE_NAMES.has(pathname);
}
