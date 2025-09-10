"use client"

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  IconDownload, 
  IconUsers, 
  IconCalendar, 
  IconCash,
  IconBuilding,
  IconLoader,
  IconFileText,
  IconWallet,
  IconClock,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconArrowRight,
  IconTrendingUp,
  IconTrendingDown
} from '@tabler/icons-react'

interface FlowData {
  workerId: number
  employeeId: string
  firstName: string
  lastName: string
  siteName: string
  attendance: {
    totalDays: number
    presentDays: number
    lateDays: number
    absentDays: number
    totalHours: number
    averageHours: number
    attendanceRate: number
  }
  payroll: {
    status: string
    amount: number
    payPeriod: string
    paymentMethod: string | null
    paymentDate: string | null
  }
  performance: {
    efficiency: number
    trend: 'up' | 'down' | 'stable'
  }
}

interface FlowSummary {
  totalWorkers: number
  totalAttendance: number
  totalPayroll: number
  averageEfficiency: number
  completionRate: number
}

export default function AttendancePayrollFlowPage() {
  const [flowData, setFlowData] = useState<FlowData[]>([])
  const [summary, setSummary] = useState<FlowSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSite, setSelectedSite] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sites, setSites] = useState<any[]>([])
  const [generatingReport, setGeneratingReport] = useState(false)

  useEffect(() => {
    fetchData()
  }, [selectedSite, selectedStatus])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [attendanceResponse, payrollResponse, workersResponse, sitesResponse] = await Promise.all([
        axios.get('/api/attendance'),
        axios.get('/api/payroll'),
        axios.get('/api/workers'),
        axios.get('/api/sites')
      ])

      const attendanceData = (attendanceResponse.data as any).data || []
      const payrollData = (payrollResponse.data as any).data || []
      const workersData = (workersResponse.data as any).data || []
      const sitesData = (sitesResponse.data as any).data || []

      // Debug: Log real data counts
      console.log('🔄 Flow Data Counts:', {
        workers: workersData.length,
        attendance: attendanceData.length,
        payroll: payrollData.length,
        sites: sitesData.length
      })

      setSites(sitesData)

      // Create flow data
      const flow: FlowData[] = workersData.map((worker: any) => {
        const workerAttendance = attendanceData.filter((record: any) => 
          record.workerId === worker.id
        )
        const workerPayroll = payrollData.filter((record: any) => 
          record.workerId === worker.id
        )

        const totalDays = workerAttendance.length
        const presentDays = workerAttendance.filter((record: any) => 
          record.status === 'PRESENT' || record.status === 'LATE' || record.status === 'OVERTIME'
        ).length
        const lateDays = workerAttendance.filter((record: any) => 
          record.status === 'LATE'
        ).length
        const absentDays = totalDays - presentDays

        const totalHours = workerAttendance.reduce((sum: number, record: any) => 
          sum + validateNumber(record.totalHours), 0
        )

        const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0

        const latestPayroll = workerPayroll.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]

        const site = sitesData.find((s: any) => s.id === worker.assignedSiteId)

        const efficiency = attendanceRate * (totalHours / Math.max(presentDays, 1)) / 10

        return {
          workerId: worker.id,
          employeeId: worker.employeeId,
          firstName: worker.firstName,
          lastName: worker.lastName,
          siteName: site?.siteName || 'Unassigned',
          attendance: {
            totalDays,
            presentDays,
            lateDays,
            absentDays,
            totalHours,
            averageHours: presentDays > 0 ? totalHours / presentDays : 0,
            attendanceRate
          },
          payroll: {
            status: latestPayroll?.paymentStatus || 'NO_PAYROLL',
            amount: latestPayroll?.netPay || 0,
            payPeriod: latestPayroll ? 
              `${new Date(latestPayroll.payPeriodStart).toLocaleDateString()} - ${new Date(latestPayroll.payPeriodEnd).toLocaleDateString()}` : 
              'N/A',
            paymentMethod: latestPayroll?.paymentMethod || null,
            paymentDate: latestPayroll?.paymentDate || null
          },
          performance: {
            efficiency,
            trend: efficiency > 80 ? 'up' : efficiency < 60 ? 'down' : 'stable'
          }
        }
      })

      // Filter data
      let filteredFlow = flow
      if (selectedSite !== 'all') {
        filteredFlow = filteredFlow.filter(item => 
          sitesData.find(s => s.id.toString() === selectedSite)?.siteName === item.siteName
        )
      }
      if (selectedStatus !== 'all') {
        filteredFlow = filteredFlow.filter(item => item.payroll.status === selectedStatus)
      }

      setFlowData(filteredFlow)

      // Calculate summary
      const totalWorkers = filteredFlow.length
      const totalAttendance = filteredFlow.reduce((sum, item) => sum + item.attendance.presentDays, 0)
      const totalPayroll = filteredFlow.reduce((sum, item) => sum + Number(item.payroll.amount || 0), 0)
      const averageEfficiency = totalWorkers > 0 ? 
        filteredFlow.reduce((sum, item) => sum + item.performance.efficiency, 0) / totalWorkers : 0
      const completionRate = totalWorkers > 0 ? 
        (filteredFlow.filter(item => item.payroll.status === 'PAID').length / totalWorkers) * 100 : 0

      // Debug: Log calculated flow summary
      console.log('📊 Flow Summary:', {
        totalWorkers,
        totalAttendance,
        totalPayroll,
        averageEfficiency,
        completionRate
      })

      setSummary({
        totalWorkers,
        totalAttendance,
        totalPayroll,
        averageEfficiency,
        completionRate
      })

    } catch (error) {
      console.error('Error fetching flow data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    // Ensure we have a valid number
    const validAmount = isNaN(amount) ? 0 : amount
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(validAmount)
  }

  const validateNumber = (value: any, defaultValue: number = 0): number => {
    const num = Number(value)
    return isNaN(num) ? defaultValue : num
  }

  const generatePDFReport = async () => {
    try {
      setGeneratingReport(true)
      
      const response = await axios.get('/api/reports/management', {
        responseType: 'blob',
        params: {
          type: 'comprehensive',
          siteId: selectedSite !== 'all' ? selectedSite : undefined
        }
      })

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `attendance-payroll-flow-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Error generating PDF report:', error)
      alert('Failed to generate PDF report. Please try again.')
    } finally {
      setGeneratingReport(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CALCULATED':
        return 'bg-blue-100 text-blue-800'
      case 'APPROVED':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <IconTrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <IconTrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <IconClock className="h-4 w-4 text-blue-600" />
    }
  }

  const downloadFlowReport = () => {
    const headers = [
      'Employee ID',
      'Full Name',
      'Site',
      'Total Days',
      'Present Days',
      'Late Days',
      'Absent Days',
      'Total Hours',
      'Average Hours',
      'Attendance Rate %',
      'Payroll Status',
      'Payroll Amount',
      'Pay Period',
      'Payment Method',
      'Payment Date',
      'Efficiency Score',
      'Performance Trend'
    ]

    const rows = flowData.map(item => [
      item.employeeId,
      `${item.firstName} ${item.lastName}`,
      item.siteName,
      item.attendance.totalDays,
      item.attendance.presentDays,
      item.attendance.lateDays,
      item.attendance.absentDays,
      item.attendance.totalHours.toFixed(1),
      item.attendance.averageHours.toFixed(1),
      item.attendance.attendanceRate.toFixed(1),
      item.payroll.status,
      item.payroll.amount,
      item.payroll.payPeriod,
      item.payroll.paymentMethod || 'N/A',
      item.payroll.paymentDate || 'N/A',
      item.performance.efficiency.toFixed(1),
      item.performance.trend
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `attendance-payroll-flow-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <IconLoader className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-white">Loading attendance-payroll flow...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Attendance → Payroll Flow</h1>
                <p className="text-gray-400">Complete journey from attendance tracking to payroll processing</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  onClick={generatePDFReport}
                  disabled={generatingReport}
                >
                  {generatingReport ? (
                    <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <IconFileText className="mr-2 h-4 w-4" />
                  )}
                  {generatingReport ? 'Generating PDF...' : 'Download PDF Report'}
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800">Total Workers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900">{summary.totalWorkers}</div>
                    <p className="text-xs text-blue-700">In system</p>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-800">Total Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900">{summary.totalAttendance}</div>
                    <p className="text-xs text-green-700">Days worked</p>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-purple-800">Total Payroll</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-900">{formatCurrency(summary.totalPayroll)}</div>
                    <p className="text-xs text-purple-700">Amount processed</p>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border-orange-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-orange-800">Completion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-900">{summary.completionRate.toFixed(1)}%</div>
                    <p className="text-xs text-orange-700">Payroll completed</p>
                  </CardContent>
                </Card>
              </div>
            )}

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
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Payroll Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CALCULATED">Calculated</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="NO_PAYROLL">No Payroll</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Flow Data */}
            <div className="space-y-4">
              {flowData.length === 0 ? (
                <div className="text-center py-8">
                  <IconUsers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No flow data found</p>
                </div>
              ) : (
                flowData.map((item) => (
                  <Card key={item.workerId} className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        {/* Worker Info */}
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {item.firstName.charAt(0)}{item.lastName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {item.firstName} {item.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">{item.employeeId}</p>
                            <p className="text-xs text-gray-500">{item.siteName}</p>
                          </div>
                        </div>

                        {/* Flow Arrow */}
                        <div className="flex items-center space-x-4">
                          <IconArrowRight className="h-6 w-6 text-gray-400" />
                        </div>

                        {/* Attendance Summary */}
                        <div className="flex-1 max-w-xs">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-800 mb-2">Attendance</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-blue-600">Present:</span>
                                <span className="ml-1 font-medium text-blue-900">{item.attendance.presentDays}</span>
                              </div>
                              <div>
                                <span className="text-blue-600">Hours:</span>
                                <span className="ml-1 font-medium text-blue-900">{item.attendance.totalHours.toFixed(1)}h</span>
                              </div>
                              <div>
                                <span className="text-blue-600">Rate:</span>
                                <span className="ml-1 font-medium text-blue-900">{item.attendance.attendanceRate.toFixed(1)}%</span>
                              </div>
                              <div>
                                <span className="text-blue-600">Avg:</span>
                                <span className="ml-1 font-medium text-blue-900">{item.attendance.averageHours.toFixed(1)}h</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Flow Arrow */}
                        <div className="flex items-center space-x-4">
                          <IconArrowRight className="h-6 w-6 text-gray-400" />
                        </div>

                        {/* Payroll Summary */}
                        <div className="flex-1 max-w-xs">
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-green-800 mb-2">Payroll</h4>
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-green-600">Status:</span>
                                <Badge className={`${getStatusColor(item.payroll.status)} text-xs`}>
                                  {item.payroll.status}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-green-600">Amount:</span>
                                <span className="font-medium text-green-900">{formatCurrency(item.payroll.amount)}</span>
                              </div>
                              {item.payroll.paymentDate && (
                                <div className="flex items-center justify-between">
                                  <span className="text-green-600">Paid:</span>
                                  <span className="font-medium text-green-900">
                                    {new Date(item.payroll.paymentDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Performance Indicator */}
                        <div className="flex flex-col items-center space-y-2">
                          <div className="flex items-center space-x-1">
                            {getTrendIcon(item.performance.trend)}
                            <span className="text-sm font-bold text-gray-900">
                              {item.performance.efficiency.toFixed(1)}
                            </span>
                          </div>
                          <Badge 
                            className={
                              item.performance.efficiency >= 80 ? 'bg-green-100 text-green-800' :
                              item.performance.efficiency >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {item.performance.trend}
                          </Badge>
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
