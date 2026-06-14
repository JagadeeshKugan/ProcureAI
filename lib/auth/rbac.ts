/**
 * Role-based access control utilities
 */

export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

export function canAccessRoute(userRole: string, routePath: string): boolean {
  const roleRoutes: Record<string, string[]> = {
    buyer: ["dashboard", "requests", "vendors", "rfq", "orders", "profile", "copilot"],
    supplier: ["supplier"],
    admin: ["admin", "dashboard", "requests", "vendors", "rfq", "orders", "profile"],
  };

  const allowedRoutes = roleRoutes[userRole] || [];
  return allowedRoutes.some((route) => routePath.includes(route));
}
