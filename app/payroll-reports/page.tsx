"use client"

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  IconDownload, 
  IconCheck, 
  IconUsers, 
  IconCalendar, 
  IconCash,
  IconBuilding,
  IconLoader,
  IconFileText,
  IconWallet
} from '@tabler/icons-react'

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
  paymentMethod: string | null
  paymentDate: string | null
  paymentReference: string | null
  worker: {
    id: number
    employeeId: string
    firstName: string
    lastName: string
    status: string
    preferredPaymentMethod: string | null
    bankAccount: string | null
    mobileMoneyNumber: string | null
    airtelMoneyNumber: string | null
  }
  site: {
    id: number
    siteCode: string
    siteName: string
  }
}

export default function PayrollReportsPage() {
  const [paidRecords, setPaidRecords] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSite, setSelectedSite] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [sites, setSites] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [paidResponse, sitesResponse] = await Promise.all([
        axios.get('/api/payroll?status=PAID'),
        axios.get('/api/sites')
      ])

      if ((paidResponse.data as any).success) {
        setPaidRecords((paidResponse.data as any).data)
      }

      if ((sitesResponse.data as any).success) {
        setSites((sitesResponse.data as any).data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecords = paidRecords.filter(record => {
    const siteMatch = selectedSite === 'all' || record.siteId.toString() === selectedSite
    const periodMatch = selectedPeriod === 'all' || record.payPeriodType === selectedPeriod
    return siteMatch && periodMatch
  })

  const totalAmount = filteredRecords.reduce((sum, record) => sum + record.netPay, 0)
  const totalRecords = filteredRecords.length

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const downloadReport = () => {
    // Create CSV content
    const headers = [
      'Employee ID',
      'Full Name',
      'Site',
      'Pay Period',
      'Days Worked',
      'Total Hours',
      'Daily Rate',
      'Regular Pay',
      'Overtime Pay',
      'Gross Pay',
      'Net Pay',
      'Payment Method',
      'Payment Date',
      'Payment Reference',
      'Bank Account',
      'Mobile Money',
      'Airtel Money'
    ]

    const rows = filteredRecords.map(record => [
      record.worker.employeeId,
      `${record.worker.firstName} ${record.worker.lastName}`,
      record.site.siteName,
      `${formatDate(record.payPeriodStart)} - ${formatDate(record.payPeriodEnd)}`,
      record.totalDaysWorked,
      record.totalHours,
      record.dailyRate,
      record.regularPay,
      record.overtimePay,
      record.grossPay,
      record.netPay,
      record.paymentMethod || 'Not specified',
      record.paymentDate ? formatDate(record.paymentDate) : 'N/A',
      record.paymentReference || 'N/A',
      record.worker.bankAccount || 'N/A',
      record.worker.mobileMoneyNumber || 'N/A',
      record.worker.airtelMoneyNumber || 'N/A'
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `payroll-reports-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "BANK_TRANSFER":
        return "bg-blue-100 text-blue-800"
      case "MOBILE_MONEY":
        return "bg-green-100 text-green-800"
      case "CASH":
        return "bg-gray-100 text-gray-800"
      case "AIRTEL_MONEY":
        return "bg-red-100 text-red-800"
      case "CHECK":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Payroll Reports</h1>
                <p className="text-gray-400">View completed payroll payments and generate reports</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  onClick={downloadReport}
                  disabled={filteredRecords.length === 0}
                >
                  <IconFileText className="mr-2 h-4 w-4" />
                  Download Report ({filteredRecords.length})
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">Total Paid Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">{totalRecords}</div>
                  <p className="text-xs text-green-700">Completed payments</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">Total Amount Paid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalAmount)}</div>
                  <p className="text-xs text-blue-700">All processed payments</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800">Average Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">
                    {totalRecords > 0 ? formatCurrency(totalAmount / totalRecords) : formatCurrency(0)}
                  </div>
                  <p className="text-xs text-purple-700">Per worker</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
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
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Period Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="BI_WEEKLY">Bi-weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Records List */}
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <IconLoader className="h-8 w-8 animate-spin" />
                  <span className="ml-2 text-white">Loading payroll reports...</span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8">
                  <IconUsers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No completed payments found</p>
                </div>
              ) : (
                filteredRecords.map((record) => (
                  <Card key={record.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
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
                            <Badge className="bg-green-100 text-green-800 font-medium">
                              PAID
                            </Badge>
                            {record.paymentMethod && (
                              <Badge className={`${getPaymentMethodColor(record.paymentMethod)} font-medium`}>
                                {record.paymentMethod.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-800">{formatCurrency(record.netPay)}</p>
                            <p className="text-xs text-gray-500">Net Pay</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 px-4 pb-4">
                      {/* Pay Period */}
                      <div className="mb-3 p-2 bg-green-50 rounded-lg">
                        <div className="flex items-center text-sm text-green-700">
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
                            <p className="text-2xl font-bold text-blue-900">{record.totalDaysWorked}</p>
                            <p className="text-xs text-gray-600">Days Worked</p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-center mb-2">
                              <IconCalendar className="h-5 w-5 text-green-600" />
                            </div>
                            <p className="text-2xl font-bold text-green-900">{record.totalHours}h</p>
                            <p className="text-xs text-gray-600">Total Hours</p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-center mb-2">
                              <IconCash className="h-5 w-5 text-orange-600" />
                            </div>
                            <p className="text-lg font-bold text-orange-900">{formatCurrency(record.dailyRate)}</p>
                            <p className="text-xs text-gray-600">Daily Rate</p>
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-xs text-green-700 font-medium">Regular Pay</p>
                            <p className="text-lg font-bold text-green-900">{formatCurrency(record.regularPay)}</p>
                          </div>
                          <div className="p-2 bg-orange-50 rounded-lg border border-orange-200">
                            <p className="text-xs text-orange-700 font-medium">Overtime Pay</p>
                            <p className="text-lg font-bold text-orange-900">{formatCurrency(record.overtimePay)}</p>
                        </div>
                      </div>

                      {/* Payment Info */}
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
                        <div className="text-sm text-gray-500">
                          {record.paymentReference && (
                            <div>Ref: {record.paymentReference}</div>
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
  )
}
