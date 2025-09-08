import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconReport, IconDownload, IconCalendar, IconUsers, IconClock, IconBuilding } from "@tabler/icons-react"

export default function AttendanceReportsPage() {
  // Mock data for attendance reports
  const reports = [
    {
      id: 1,
      site: "Downtown Office Complex",
      reportDate: "2024-01-15",
      totalWorkers: 45,
      presentWorkers: 42,
      absentWorkers: 3,
      totalHours: 336,
      overtimeHours: 12,
      status: "APPROVED",
      generatedBy: "Admin User"
    },
    {
      id: 2,
      site: "Residential Tower A",
      reportDate: "2024-01-15",
      totalWorkers: 32,
      presentWorkers: 30,
      absentWorkers: 2,
      totalHours: 240,
      overtimeHours: 8,
      status: "PENDING_APPROVAL",
      generatedBy: "Site Manager"
    },
    {
      id: 3,
      site: "Downtown Office Complex",
      reportDate: "2024-01-14",
      totalWorkers: 45,
      presentWorkers: 44,
      absentWorkers: 1,
      totalHours: 352,
      overtimeHours: 16,
      status: "DRAFT",
      generatedBy: "Admin User"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "PENDING_APPROVAL":
        return "bg-yellow-100 text-yellow-800"
      case "DRAFT":
        return "bg-gray-100 text-gray-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Attendance Reports</h1>
                    <p className="text-muted-foreground">View and manage attendance reports for all sites</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <IconDownload className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                    <Button>
                      <IconReport className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-6">
                  <Select>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select Site" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sites</SelectItem>
                      <SelectItem value="downtown">Downtown Office Complex</SelectItem>
                      <SelectItem value="residential">Residential Tower A</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="date" className="px-3 py-2 border rounded-md" defaultValue="2024-01-15" />
                </div>

                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{report.site}</CardTitle>
                            <CardDescription className="flex items-center">
                              <IconCalendar className="mr-1 h-4 w-4" />
                              {report.reportDate}
                            </CardDescription>
                          </div>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                              <IconUsers className="h-4 w-4 text-muted-foreground mr-1" />
                              <span className="text-sm text-muted-foreground">Total Workers</span>
                            </div>
                            <p className="text-2xl font-bold">{report.totalWorkers}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                              <IconUsers className="h-4 w-4 text-green-600 mr-1" />
                              <span className="text-sm text-muted-foreground">Present</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600">{report.presentWorkers}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                              <IconUsers className="h-4 w-4 text-red-600 mr-1" />
                              <span className="text-sm text-muted-foreground">Absent</span>
                            </div>
                            <p className="text-2xl font-bold text-red-600">{report.absentWorkers}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                              <IconClock className="h-4 w-4 text-muted-foreground mr-1" />
                              <span className="text-sm text-muted-foreground">Total Hours</span>
                            </div>
                            <p className="text-2xl font-bold">{report.totalHours}h</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            Generated by: <span className="font-medium">{report.generatedBy}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                            <Button variant="outline" size="sm">
                              <IconDownload className="mr-1 h-4 w-4" />
                              Download
                            </Button>
                            {report.status === "DRAFT" && (
                              <Button size="sm">
                                Submit for Approval
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
