"use client"

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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { IconWallet, IconDownload, IconCalendar, IconUsers, IconCash, IconBuilding, IconCalculator, IconLoader, IconCheck, IconX, IconEye, IconEdit, IconReport } from "@tabler/icons-react"
import { useState, useEffect } from "react"
import axios from "axios"

// Types
interface PayrollRecord {
  id: number
  workerId: number
  siteId: number
  payPeriodStart: string
  payPeriodEnd: string
  payPeriodType: string
  totalDaysWorked: number
  totalHours: number
  regularHours: number
  overtimeHours: number
  dailyRate: number
  regularPay: number
  overtimePay: number
  grossPay: number
  netPay: number
  paymentStatus: string
  paymentMethod?: string
  paymentDate?: string
  paymentReference?: string
  worker: {
    id: number
    employeeId: string
    firstName: string
    lastName: string
    status: string
    preferredPaymentMethod: string
  }
  site: {
    id: number
    siteCode: string
    siteName: string
  }
}

interface Site {
  id: number
  siteCode: string
  siteName: string
}

export default function PayrollPage() {
  // State management
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [calculateModalOpen, setCalculateModalOpen] = useState(false)
  const [processModalOpen, setProcessModalOpen] = useState(false)
  const [selectedRecords, setSelectedRecords] = useState<number[]>([])
  const [calculateLoading, setCalculateLoading] = useState(false)
  const [processLoading, setProcessLoading] = useState(false)
  const [payPeriodStart, setPayPeriodStart] = useState('')
  const [payPeriodEnd, setPayPeriodEnd] = useState('')
  const [payPeriodType, setPayPeriodType] = useState<'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY'>('MONTHLY')
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CASH' | 'MOBILE_MONEY' | 'AIRTEL_MONEY' | 'CHECK'>('BANK_TRANSFER')

  // Fetch data on component mount
  useEffect(() => {
    fetchData()
  }, [])

  // Fetch payroll records and sites
  const fetchData = async () => {
    try {
      setLoading(true)
      const [payrollResponse, sitesResponse] = await Promise.all([
        axios.get('/api/payroll'),
        axios.get('/api/sites')
      ])

      if ((payrollResponse.data as any).success) {
        setPayrollRecords((payrollResponse.data as any).data)
        console.log('✅ Payroll data loaded:', (payrollResponse.data as any).data.length, 'records')
      }

      if ((sitesResponse.data as any).success) {
        setSites((sitesResponse.data as any).data)
        console.log('✅ Sites data loaded:', (sitesResponse.data as any).data.length, 'sites')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate payroll for selected period
  const handleCalculatePayroll = async () => {
    if (!payPeriodStart || !payPeriodEnd) {
      alert('Please select pay period dates')
      return
    }

    setCalculateLoading(true)
    try {
      const response = await axios.post('/api/payroll/calculate', {
        siteId: selectedSite === 'all' ? undefined : parseInt(selectedSite),
        payPeriodStart,
        payPeriodEnd,
        payPeriodType,
        calculatedBy: 'ADMIN'
      })

      if ((response.data as any).success) {
        console.log('✅ Payroll calculation completed:', (response.data as any).data.summary)
        setCalculateModalOpen(false)
        await fetchData() // Refresh data
        alert(`Payroll calculation completed. ${(response.data as any).data.summary.successfulCalculations} records created.`)
      }
    } catch (error: any) {
      console.error('Error calculating payroll:', error)
      const errorMessage = error.response?.data?.error || 'Failed to calculate payroll'
      alert(`Error: ${errorMessage}`)
    } finally {
      setCalculateLoading(false)
    }
  }

  // Process payments for selected records
  const handleProcessPayments = async () => {
    if (selectedRecords.length === 0) {
      alert('Please select payroll records to process')
      return
    }

    setProcessLoading(true)
    try {
      const response = await axios.post('/api/payroll/process', {
        payrollRecordIds: selectedRecords,
        paymentMethod,
        paymentReference: `PAY-${Date.now()}`,
        processedBy: 'ADMIN'
      })

      if ((response.data as any).success) {
        console.log('✅ Payment processing completed:', (response.data as any).data.summary)
        setProcessModalOpen(false)
        setSelectedRecords([])
        await fetchData() // Refresh data
        alert(`Payment processing completed. ${(response.data as any).data.summary.successfulPayments} payments processed.`)
      }
    } catch (error: any) {
      console.error('Error processing payments:', error)
      const errorMessage = error.response?.data?.error || 'Failed to process payments'
      alert(`Error: ${errorMessage}`)
    } finally {
      setProcessLoading(false)
    }
  }

  // Filter payroll records based on selected filters
  const filteredRecords = payrollRecords.filter(record => {
    const siteMatch = selectedSite === 'all' || record.siteId.toString() === selectedSite
    const statusMatch = selectedStatus === 'all' || record.paymentStatus === selectedStatus
    const dateMatch = !selectedDate || record.payPeriodStart.startsWith(selectedDate)
    return siteMatch && statusMatch && dateMatch
  })

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return `RWF ${amount.toLocaleString()}`
  }

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
                    <h1 className="text-3xl font-bold tracking-tight text-white">Payroll</h1>
                    <p className="text-gray-400">Manage worker payments and payroll records</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                      <IconDownload className="mr-2 h-4 w-4" />
                      Export Payroll
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-yellow-800 border-yellow-700 text-white hover:bg-yellow-700"
                      onClick={() => window.location.href = '/pending-payments'}
                    >
                      <IconUsers className="mr-2 h-4 w-4" />
                      Pending Payments
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-green-800 border-green-700 text-white hover:bg-green-700"
                      onClick={() => window.location.href = '/payroll-reports'}
                    >
                      <IconReport className="mr-2 h-4 w-4" />
                      Reports
                    </Button>
                    <Dialog open={calculateModalOpen} onOpenChange={setCalculateModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                          <IconCalculator className="mr-2 h-4 w-4" />
                          Calculate Payroll
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Calculate Payroll</DialogTitle>
                          <DialogDescription>
                            Calculate payroll for workers based on attendance records
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Pay Period Start</label>
                            <input
                              type="date"
                              className="w-full px-3 py-2 border rounded-md"
                              value={payPeriodStart}
                              onChange={(e) => setPayPeriodStart(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Pay Period End</label>
                            <input
                              type="date"
                              className="w-full px-3 py-2 border rounded-md"
                              value={payPeriodEnd}
                              onChange={(e) => setPayPeriodEnd(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Pay Period Type</label>
                            <Select value={payPeriodType} onValueChange={(value: any) => setPayPeriodType(value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="WEEKLY">Weekly</SelectItem>
                                <SelectItem value="BI_WEEKLY">Bi-weekly</SelectItem>
                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Site (Optional)</label>
                            <Select value={selectedSite} onValueChange={setSelectedSite}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Sites</SelectItem>
                                {sites.map((site) => (
                                  <SelectItem key={site.id} value={site.id.toString()}>
                                    {site.siteName} ({site.siteCode})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            onClick={handleCalculatePayroll}
                            disabled={calculateLoading}
                            className="w-full"
                          >
                            {calculateLoading ? (
                              <>
                                <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                                Calculating...
                              </>
                            ) : (
                              <>
                                <IconCalculator className="mr-2 h-4 w-4" />
                                Calculate Payroll
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={processModalOpen} onOpenChange={setProcessModalOpen}>
                      <DialogTrigger asChild>
                        <Button disabled={selectedRecords.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white">
                          <IconWallet className="mr-2 h-4 w-4" />
                          Process Payments ({selectedRecords.length})
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Process Payments</DialogTitle>
                          <DialogDescription>
                            Process payments for selected payroll records
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Payment Method</label>
                            <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                <SelectItem value="CASH">Cash</SelectItem>
                                <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                                <SelectItem value="AIRTEL_MONEY">Airtel Money</SelectItem>
                                <SelectItem value="CHECK">Check</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="p-4 border rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground">
                              Selected Records: {selectedRecords.length}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Total Amount: {formatCurrency(
                                filteredRecords
                                  .filter(record => selectedRecords.includes(record.id))
                                  .reduce((sum, record) => sum + record.netPay, 0)
                              )}
                            </p>
                          </div>
                          <Button 
                            onClick={handleProcessPayments}
                            disabled={processLoading}
                            className="w-full"
                          >
                            {processLoading ? (
                              <>
                                <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                      <IconWallet className="mr-2 h-4 w-4" />
                      Process Payments
                              </>
                            )}
                    </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-6">
                  <Select value={selectedSite} onValueChange={setSelectedSite}>
                    <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select Site" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sites</SelectItem>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id.toString()}>
                          {site.siteName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CALCULATED">Calculated</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <input 
                    type="date" 
                    className="px-3 py-2 border rounded-md bg-gray-800 border-gray-700 text-white" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    placeholder="mm/dd/yyyy"
                  />
                </div>

                <div className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <IconLoader className="h-8 w-8 animate-spin" />
                      <span className="ml-2">Loading payroll records...</span>
                    </div>
                  ) : filteredRecords.length === 0 ? (
                    <div className="text-center py-8">
                      <IconUsers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No payroll records found</p>
                    </div>
                  ) : (
                    filteredRecords.map((record) => (
                    <Card key={record.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                      <CardHeader className="pb-2 pt-4 px-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {record.worker.firstName.charAt(0)}{record.worker.lastName.charAt(0)}
                              </span>
                            </div>
                          <div>
                              <CardTitle className="text-lg font-medium text-white">
                                {record.worker.firstName} {record.worker.lastName}
                              </CardTitle>
                              <CardDescription className="flex items-center text-sm text-gray-600">
                                <IconUsers className="mr-1 h-3 w-3" />
                                {record.worker.employeeId}
                            </CardDescription>
                              {record.worker.preferredPaymentMethod && (
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                  <IconWallet className="mr-1 h-3 w-3" />
                                  {record.worker.preferredPaymentMethod.replace('_', ' ')}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                          <div className="flex gap-2">
                              <Badge className={`${getStatusColor(record.paymentStatus)} font-medium`}>
                                {record.paymentStatus}
                            </Badge>
                              {record.paymentMethod && (
                                <Badge className={`${getPaymentMethodColor(record.paymentMethod)} font-medium`}>
                              {record.paymentMethod.replace('_', ' ')}
                            </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">{formatCurrency(record.netPay)}</p>
                              <p className="text-xs text-gray-500">Net Pay</p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0 px-4 pb-4">
                        {/* Pay Period */}
                        <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                          <div className="flex items-center text-sm text-blue-700">
                            <IconCalendar className="mr-2 h-4 w-4" />
                            <span className="font-medium">Pay Period:</span>
                            <span className="ml-2">{formatDate(record.payPeriodStart)} - {formatDate(record.payPeriodEnd)}</span>
                          </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-center mb-2">
                              <IconUsers className="h-5 w-5 text-blue-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{record.totalDaysWorked}</p>
                            <p className="text-xs text-gray-600">Days Worked</p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-center mb-2">
                              <IconCalendar className="h-5 w-5 text-green-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{record.totalHours}h</p>
                            <p className="text-xs text-gray-600">Total Hours</p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-center mb-2">
                              <IconCash className="h-5 w-5 text-orange-600" />
                            </div>
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(record.dailyRate)}</p>
                            <p className="text-xs text-gray-600">Daily Rate</p>
                          </div>
                        </div>
                        
                        {/* Pay Breakdown */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-xs text-green-700 font-medium">Regular Pay</p>
                            <p className="text-lg font-bold text-green-800">{formatCurrency(record.regularPay)}</p>
                          </div>
                          <div className="p-2 bg-orange-50 rounded-lg border border-orange-200">
                            <p className="text-xs text-orange-700 font-medium">Overtime Pay</p>
                            <p className="text-lg font-bold text-orange-800">{formatCurrency(record.overtimePay)}</p>
                          </div>
                          <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-700 font-medium">Gross Pay</p>
                            <p className="text-lg font-bold text-blue-800">{formatCurrency(record.grossPay)}</p>
                          </div>
                        </div>
                        
                        {/* Site Info and Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <IconBuilding className="mr-1 h-4 w-4" />
                              <span>{record.site.siteName}</span>
                            </div>
                            {record.paymentDate && (
                              <div className="flex items-center text-green-600">
                                <IconCheck className="mr-1 h-4 w-4" />
                                <span>Paid on {formatDate(record.paymentDate)}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedRecords.includes(record.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRecords([...selectedRecords, record.id])
                                } else {
                                  setSelectedRecords(selectedRecords.filter(id => id !== record.id))
                                }
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <Button variant="outline" size="sm" className="h-8">
                              <IconEye className="mr-1 h-3 w-3" />
                              View
                            </Button>
                            <Button variant="outline" size="sm" className="h-8">
                              <IconDownload className="mr-1 h-3 w-3" />
                              Payslip
                            </Button>
                            {record.paymentStatus === "APPROVED" && (
                              <Button 
                                size="sm"
                                className="h-8 bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  setSelectedRecords([record.id])
                                  setProcessModalOpen(true)
                                }}
                              >
                                <IconWallet className="mr-1 h-3 w-3" />
                                Pay
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
