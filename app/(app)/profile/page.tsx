"use client"

import * as React from "react"
import { Mail, Phone, MapPin, Building2, Calendar, Award, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/page-header"

export default function ProfilePage() {
  const userProfile = {
    name: "Alex Carter",
    role: "Head of Procurement",
    email: "alex.carter@company.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    department: "Procurement",
    joinDate: "January 15, 2022",
    avatar: "AC",
  }

  const procurementStats = [
    {
      label: "Total POs",
      value: "847",
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Active RFQs",
      value: "23",
      color: "bg-accent/10 text-accent-foreground",
    },
    {
      label: "Vendors Managed",
      value: "142",
      color: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300",
    },
    {
      label: "Avg. Approval Time",
      value: "2.3d",
      color: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-300",
    },
  ]

  const permissions = [
    { name: "View Dashboard", status: "Enabled" },
    { name: "Create Purchase Requests", status: "Enabled" },
    { name: "Approve POs (Under $50k)", status: "Enabled" },
    { name: "Manage Vendors", status: "Enabled" },
    { name: "Create RFQs", status: "Enabled" },
    { name: "Access Procurement Copilot", status: "Enabled" },
    { name: "Export Reports", status: "Enabled" },
    { name: "Approve POs (All)", status: "Disabled" },
  ]

  const recentActivity = [
    { action: "Approved PO-2026-8934", time: "2 hours ago", icon: "✓" },
    { action: "Created RFQ for Office Supplies", time: "5 hours ago", icon: "+" },
    { action: "Reviewed vendor performance report", time: "1 day ago", icon: "📊" },
    { action: "Logged in", time: "1 day ago", icon: "🔐" },
  ]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="User Profile"
        description="Manage your account settings and preferences"
      />

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
              <Avatar className="size-20">
                <AvatarFallback className="bg-primary text-lg text-primary-foreground">
                  {userProfile.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold">{userProfile.name}</h1>
                <Badge className="w-fit">{userProfile.role}</Badge>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4" />
                    {userProfile.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-4" />
                    {userProfile.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    {userProfile.location}
                  </div>
                </div>
              </div>
            </div>
            <Button className="w-fit gap-2 cursor-pointer">
              <Edit2 className="size-4" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Department</p>
              <p className="mt-1 text-sm font-medium">{userProfile.department}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Member Since</p>
              <div className="mt-1 flex items-center gap-2 text-sm font-medium">
                <Calendar className="size-4" />
                {userProfile.joinDate}
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Account Status</p>
              <p className="mt-1">
                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                  Active
                </Badge>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Company</p>
              <div className="mt-1 flex items-center gap-2 text-sm font-medium">
                <Building2 className="size-4" />
                ACME Corporation
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Organization Role</p>
              <p className="mt-1 text-sm font-medium">Team Lead</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Direct Reports</p>
              <p className="mt-1 text-sm font-medium">3 members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Procurement Statistics */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Your Procurement Activity</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {procurementStats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className={`mt-2 text-2xl font-bold ${stat.color} rounded px-2 py-1 w-fit`}>
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>Your role grants these permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {permissions.map((perm) => (
              <div key={perm.name} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <span className="text-sm font-medium">{perm.name}</span>
                <Badge variant={perm.status === "Enabled" ? "default" : "secondary"}>
                  {perm.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest actions in the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3 pb-3 last:pb-0">
                <div className="mt-1 flex size-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="text-base">Security & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start gap-2 cursor-pointer">
            Change Password
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 cursor-pointer">
            Two-Factor Authentication
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 cursor-pointer">
            Active Sessions
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 cursor-pointer">
            Privacy Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
