import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { VendorSidebar } from "@/components/vendor-sidebar"
import { VendorTopbar } from "@/components/vendor-topbar"

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <VendorSidebar />
      <SidebarInset>
        <VendorTopbar />
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
