import Link from "next/link"
import { Clock } from "lucide-react"

export default function AwaitingApprovalPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <Clock className="mx-auto h-16 w-16 text-yellow-500 mb-4 animate-spin" />
        <h1 className="text-2xl font-bold mb-2">Awaiting Approval</h1>
        <p className="text-muted-foreground mb-6">
          Your account is pending approval. An administrator will review your account soon.
        </p>
        <Link 
          href="/sign-out"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Sign Out
        </Link>
      </div>
    </div>
  )
}
