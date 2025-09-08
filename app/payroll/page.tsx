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
import { IconWallet, IconDownload, IconCalendar, IconUsers, IconCash, IconBuilding } from "@tabler/icons-react"

export default function PayrollPage() {
  // Mock data for payroll records
  const payrollRecords = [
    {
      id: 1,
      workerName: "Jean Mukamana",
      employeeId: "EMP001",
      site: "Downtown Office Complex",
      payPeriod: "2024-01-01 to 2024-01-15",
      totalDays: 12,
      totalHours: 96,
      regularHours: 96,
      overtimeHours: 0,
      dailyRate: 15000,
      regularPay: 180000,
      overtimePay: 0,
      grossPay: 180000,
      netPay: 180000,
      status: "PAID",
      paymentDate: "2024-01-16",
      paymentMethod: "BANK_TRANSFER"
    },
    {
      id: 2,
      workerName: "Paul Nkurunziza",
      employeeId: "EMP002",
      site: "Residential Tower A",
      payPeriod: "2024-01-01 to 2024-01-15",
      totalDays: 12,
      totalHours: 99,
      regularHours: 96,
      overtimeHours: 3,
      dailyRate: 18000,
      regularPay: 216000,
      overtimePay: 8100,
      grossPay: 224100,
      netPay: 224100,
      status: "PENDING",
      paymentDate: null,
      paymentMethod: "MOBILE_MONEY"
    },
    {
      id: 3,
      workerName: "Marie Uwimana",
      employeeId: "EMP003",
      site: "Downtown Office Complex",
      payPeriod: "2024-01-01 to 2024-01-15",
      totalDays: 10,
      totalHours: 80,
      regularHours: 80,
      overtimeHours: 0,
      dailyRate: 25000,
      regularPay: 250000,
      overtimePay: 0,
      grossPay: 250000,
      netPay: 250000,
      status: "APPROVED",
      paymentDate: null,
      paymentMethod: "BANK_TRANSFER"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800"
      case "APPROVED":
        return "bg-blue-100 text-blue-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "CALCULATED":
        return "bg-purple-100 text-purple-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "BANK_TRANSFER":
        return "bg-blue-100 text-blue-800"
      case "MOBILE_MONEY":
        return "bg-green-100 text-green-800"
      case "CASH":
        return "bg-gray-100 text-gray-800"
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
                    <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
                    <p className="text-muted-foreground">Manage worker payments and payroll records</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <IconDownload className="mr-2 h-4 w-4" />
                      Export Payroll
                    </Button>
                    <Button>
                      <IconWallet className="mr-2 h-4 w-4" />
                      Process Payments
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="date" className="px-3 py-2 border rounded-md" defaultValue="2024-01-15" />
                </div>

                <div className="space-y-4">
                  {payrollRecords.map((record) => (
                    <Card key={record.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{record.workerName}</CardTitle>
                            <CardDescription className="flex items-center">
                              <IconCalendar className="mr-1 h-4 w-4" />
                              {record.payPeriod}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                            <Badge className={getPaymentMethodColor(record.paymentMethod)}>
                              {record.paymentMethod.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                              <IconUsers className="h-4 w-4 text-muted-foreground mr-1" />
                              <span className="text-sm text-muted-foreground">Days Worked</span>
                            </div>
                            <p className="text-2xl font-bold">{record.totalDays}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                              <IconCalendar className="h-4 w-4 text-muted-foreground mr-1" />
                              <span className="text-sm text-muted-foreground">Total Hours</span>
                            </div>
                            <p className="text-2xl font-bold">{record.totalHours}h</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                              <IconCash className="h-4 w-4 text-muted-foreground mr-1" />
                              <span className="text-sm text-muted-foreground">Daily Rate</span>
                            </div>
                            <p className="text-2xl font-bold">RWF {record.dailyRate.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                              <IconWallet className="h-4 w-4 text-green-600 mr-1" />
                              <span className="text-sm text-muted-foreground">Net Pay</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600">RWF {record.netPay.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm text-muted-foreground">Regular Pay</p>
                            <p className="font-semibold">RWF {record.regularPay.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Overtime Pay</p>
                            <p className="font-semibold">RWF {record.overtimePay.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Gross Pay</p>
                            <p className="font-semibold">RWF {record.grossPay.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            <div className="flex items-center mb-1">
                              <IconBuilding className="mr-1 h-4 w-4" />
                              {record.site}
                            </div>
                            {record.paymentDate && (
                              <div>Paid on: {record.paymentDate}</div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                            <Button variant="outline" size="sm">
                              <IconDownload className="mr-1 h-4 w-4" />
                              Payslip
                            </Button>
                            {record.status === "APPROVED" && (
                              <Button size="sm">
                                Process Payment
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
