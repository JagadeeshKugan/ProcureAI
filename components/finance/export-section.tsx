"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function ExportSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Export Reports</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button variant="outline" size="sm" disabled>
          <Download className="h-4 w-4 mr-2" />
          CSV
        </Button>
        <Button variant="outline" size="sm" disabled>
          <Download className="h-4 w-4 mr-2" />
          PDF
        </Button>
      </CardContent>
    </Card>
  )
}
