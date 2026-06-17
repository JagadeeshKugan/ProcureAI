import { UserRepository } from "@/repositories/user.repository"
import type { InsertUser } from "@/repositories/user.repository"

export interface SyncUserInput {
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  publicMetadata?: Record<string, any>
}

export class UserService {
  private userRepository = new UserRepository()

  async syncUserFromClerk(input: SyncUserInput) {
    try {
      const fullName = [input.firstName, input.lastName]
        .filter(Boolean)
        .join(" ")
        .trim()

      const role = (input.publicMetadata?.role as string) || "employee"
      const companyName = (input.publicMetadata?.companyName as string) || undefined

      const userData: InsertUser = {
        clerkId: input.clerkId,
        email: input.email,
        name: fullName || input.email,
        role,
        companyName,
      }

      // Upsert user - create if doesn't exist, update if does
      const user = await this.userRepository.upsertByClerkId(
        input.clerkId,
        userData
      )

      return {
        success: true,
        data: user,
      }
    } catch (error) {
      console.error("[UserService] Error syncing user from Clerk:", error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to sync user from Clerk",
      }
    }
  }

  async getUserByClerkId(clerkId: string) {
    try {
      return await this.userRepository.findByClerkId(clerkId)
    } catch (error) {
      console.error("[UserService] Error fetching user by Clerk ID:", error)
      throw error
    }
  }

  async getUserById(userId: string) {
    try {
      return await this.userRepository.findById(userId)
    } catch (error) {
      console.error("[UserService] Error fetching user by ID:", error)
      throw error
    }
  }
}
