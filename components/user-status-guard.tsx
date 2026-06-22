import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { UserRepository } from "@/repositories/user.repository"

export async function UserStatusGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    return children
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
