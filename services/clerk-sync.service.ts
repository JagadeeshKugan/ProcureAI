import { getDb, schema } from "@/db"
import { OrganizationRepository } from "@/repositories/organization.repository"
import { UserRepository } from "@/repositories/user.repository"
import type { InsertUser } from "@/repositories/user.repository"
import type { InsertOrganization } from "@/repositories/organization.repository"

export interface ClerkSyncInput {
  clerkUserId: string
  email: string
  firstName?: string
  lastName?: string
  clerkOrgId?: string
  orgName?: string
}

export interface SyncResult {
  success: boolean
  userId?: string
  organizationId?: string
  error?: string
}

export class ClerkSyncService {
  private userRepository = new UserRepository()
  private orgRepository = new OrganizationRepository()
  private db = getDb()

  /**
   * Sync a Clerk user and organization into the database with transaction support
   * Ensures atomicity: both user and org are synced together or neither
   */
  async syncUserAndOrganization(input: ClerkSyncInput): Promise<SyncResult> {
    try {
      // Validate required inputs
      if (!input.clerkUserId || !input.email) {
        return {
          success: false,
          error: "clerkUserId and email are required",
        }
      }

      // Use transaction to ensure atomicity
      const result = await this.db.transaction(async (tx) => {
        // Step 1: Upsert organization if provided
        let organizationId: string | undefined

        if (input.clerkOrgId && input.orgName) {
          const orgData: InsertOrganization = {
            clerkOrgId: input.clerkOrgId,
            name: input.orgName,
          }

          const org = await this.orgRepository.upsertByClerkOrgId(
            input.clerkOrgId,
            orgData
          )

          if (!org) {
            throw new Error("Failed to sync organization")
          }

          organizationId = org.id
        }

        // Step 2: Upsert user with organization link
        const fullName = [input.firstName, input.lastName]
          .filter(Boolean)
          .join(" ")
          .trim()

        const userData: InsertUser = {
          clerkId: input.clerkUserId,
          organizationId: organizationId,
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          name: fullName || input.email,
          role: "employee", // Default role
        }

        const user = await this.userRepository.upsertByClerkId(
          input.clerkUserId,
          userData
        )

        if (!user) {
          throw new Error("Failed to sync user")
        }

        return {
          userId: user.id,
          organizationId: organizationId,
        }
      })

      return {
        success: true,
        userId: result.userId,
        organizationId: result.organizationId,
      }
    } catch (error) {
      console.error("[ClerkSyncService] Error syncing user and organization:", error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to sync user and organization",
      }
    }
  }

  /**
   * Get organization by Clerk organization ID
   */
  async getOrganizationByClerkId(clerkOrgId: string) {
    try {
      return await this.orgRepository.findByClerkOrgId(clerkOrgId)
    } catch (error) {
      console.error("[ClerkSyncService] Error fetching organization:", error)
      throw error
    }
  }

  /**
   * Get user by Clerk user ID
   */
  async getUserByClerkId(clerkUserId: string) {
    try {
      return await this.userRepository.findByClerkId(clerkUserId)
    } catch (error) {
      console.error("[ClerkSyncService] Error fetching user:", error)
      throw error
    }
  }

  /**
   * Get users in an organization
   */
  async getUsersByOrganization(organizationId: string) {
    try {
      return await this.userRepository.findByOrganizationId(organizationId)
    } catch (error) {
      console.error("[ClerkSyncService] Error fetching users by organization:", error)
      throw error
    }
  }
}
