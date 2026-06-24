import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { UserRepository } from "@/repositories/user.repository"

/**
 * Map Clerk organization roles to app roles
 */
function mapRoleToAppRole(role?: string | null): string {
  const roleMap: { [key: string]: string } = {
    "org:admin": "admin",
    "org:requester": "requester",
    "org:procurement_manager": "procurement_manager",
    "org:approver": "approver",
    "org:vendor": "vendor",
    "org:buyer": "buyer",
  }
  return roleMap[role!] || "member"
}

export async function UserStatusGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId, orgRole } = await auth()

  if (!userId) {
    return children
  }

  // Redirect vendor users to vendor portal
  const mappedRole = mapRoleToAppRole(orgRole)
  if (mappedRole === "vendor") {
    redirect("/vendor")
  }

  try {
    const userRepo = new UserRepository()
    const appUser = await userRepo.findByClerkId(userId)

    if (appUser) {
      // Disabled users cannot access app
      if (appUser.status === "disabled") {
        redirect("/access-denied")
      }

      // Pending users cannot access app
      if (appUser.status === "pending") {
        redirect("/awaiting-approval")
      }
    }
  } catch (error) {
    console.error("[UserStatusGuard] Error checking user status:", error)
    // Continue if check fails, don't block user
  }

  return children
}
