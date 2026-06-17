import { useAuth, useUser } from "@clerk/nextjs";

/**
 * Hook to check if user has required role
 */
export function useUserRole() {
  const { user, isLoaded } = useUser();

  const role = (user?.unsafeMetadata?.role as string) || "buyer";
  const company = user?.unsafeMetadata?.company as string | undefined;
  const companyId = user?.unsafeMetadata?.companyId as string | undefined;

  return { role, company, companyId, isLoaded };
}

/**
 * Hook to check if user can access a resource
 */
export function useCanAccess(requiredRoles: string[]) {
  const { role } = useUserRole();
  return requiredRoles.includes(role);
}

/**
 * Hook to get user email safely
 */
export function useUserEmail() {
  const { user } = useUser();
  return user?.emailAddresses[0]?.emailAddress || "";
}

/**
 * Hook to get user display name
 */
export function useUserName() {
  const { user } = useUser();
  return user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.username || "User";
}
