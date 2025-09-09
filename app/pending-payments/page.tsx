"use client"

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  IconWallet, 
  IconDownload, 
  IconCheck, 
  IconUsers, 
  IconCalendar, 
  IconCash,
  IconBuilding,
  IconLoader,
  IconFileText
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

export default function PendingPaymentsPage() {
  const [pendingRecords, setPendingRecords] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecords, setSelectedRecords] = useState<number[]>([])
  const [processModalOpen, setProcessModalOpen] = useState(false)
  const [processLoading, setProcessLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [selectedSite, setSelectedSite] = useState('all')
  const [sites, setSites] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [pendingResponse, sitesResponse] = await Promise.all([
        axios.get('/api/payroll?status=PENDING'),
        axios.get('/api/sites')
      ])

      if ((pendingResponse.data as any).success) {
        setPendingRecords((pendingResponse.data as any).data)
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

  const handleProcessPayments = async () => {
    if (selectedRecords.length === 0) {
      alert('Please select at least one payment to process')
      return
    }

    if (!paymentMethod) {
      alert('Please select a payment method')
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(pendingRecords.map(record => record.id))
    } else {
      setSelectedRecords([])
    }
  }

  const handleSelectRecord = (recordId: number, checked: boolean) => {
    if (checked) {
      setSelectedRecords([...selectedRecords, recordId])
    } else {
      setSelectedRecords(selectedRecords.filter(id => id !== recordId))
    }
  }

  const filteredRecords = pendingRecords.filter(record => 
    selectedSite === 'all' || record.siteId.toString() === selectedSite
  )

  const totalAmount = filteredRecords
    .filter(record => selectedRecords.includes(record.id))
    .reduce((sum, record) => sum + record.netPay, 0)

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
    const selectedPayments = filteredRecords.filter(record => selectedRecords.includes(record.id))
    
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
      'Bank Account',
      'Mobile Money',
      'Airtel Money'
    ]

    const rows = selectedPayments.map(record => [
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
      record.worker.preferredPaymentMethod || 'Not specified',
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
    link.setAttribute('download', `payroll-report-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Pending Payments</h1>
                <p className="text-gray-400">Process pending payroll payments and generate reports</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  onClick={downloadReport}
                  disabled={selectedRecords.length === 0}
                >
                  <IconFileText className="mr-2 h-4 w-4" />
                  Download Report ({selectedRecords.length})
                </Button>
                <Dialog open={processModalOpen} onOpenChange={setProcessModalOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      disabled={selectedRecords.length === 0} 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <IconWallet className="mr-2 h-4 w-4" />
                      Process Payments ({selectedRecords.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Process Payments</DialogTitle>
                      <DialogDescription>
                        Confirm payment processing for selected records
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Payment Method</label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
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
                          Total Amount: {formatCurrency(totalAmount)}
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
                            <IconCheck className="mr-2 h-4 w-4" />
                            Confirm & Process Payments
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
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
            </div>

            {/* Select All */}
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="select-all"
                checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium text-white">
                Select All ({filteredRecords.length} records)
              </label>
            </div>

            {/* Records List */}
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <IconLoader className="h-8 w-8 animate-spin" />
                  <span className="ml-2 text-white">Loading pending payments...</span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8">
                  <IconUsers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending payments found</p>
                </div>
              ) : (
                filteredRecords.map((record) => (
                  <Card key={record.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedRecords.includes(record.id)}
                            onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                          />
                          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
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
                          <Badge className="bg-yellow-100 text-yellow-800 font-medium">
                            PENDING
                          </Badge>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-yellow-800">{formatCurrency(record.netPay)}</p>
                            <p className="text-xs text-gray-500">Net Pay</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 px-4 pb-4">
                      {/* Pay Period */}
                      <div className="mb-3 p-2 bg-yellow-50 rounded-lg">
                        <div className="flex items-center text-sm text-yellow-700">
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

                      {/* Site Info */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <IconBuilding className="mr-1 h-4 w-4" />
                            <span>{record.site.siteName}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.worker.bankAccount && (
                            <div>Bank: {record.worker.bankAccount}</div>
                          )}
                          {record.worker.mobileMoneyNumber && (
                            <div>Mobile: {record.worker.mobileMoneyNumber}</div>
                          )}
                          {record.worker.airtelMoneyNumber && (
                            <div>Airtel: {record.worker.airtelMoneyNumber}</div>
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
