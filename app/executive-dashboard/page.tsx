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
  IconTrendingUp,
  IconTrendingDown,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconChartBar
} from '@tabler/icons-react'

interface ExecutiveSummary {
  attendance: {
    totalWorkers: number
    presentToday: number
    lateToday: number
    absentToday: number
    totalHoursWorked: number
    averageHoursPerWorker: number
    totalAttendanceDays: number
  }
  payroll: {
    totalPending: number
    totalPaid: number
    totalAmountPending: number
    totalAmountPaid: number
    averagePayment: number
  }
  sites: {
    totalSites: number
    activeSites: number
    totalWorkers: number
  }
  trends: {
    attendanceTrend: 'up' | 'down' | 'stable'
    payrollTrend: 'up' | 'down' | 'stable'
    costTrend: 'up' | 'down' | 'stable'
  }
}

interface SitePerformance {
  siteId: number
  siteName: string
  siteCode: string
  totalWorkers: number
  presentWorkers: number
  totalHours: number
  totalPayroll: number
  averageHours: number
  efficiency: number
}

interface WorkerPerformance {
  workerId: number
  employeeId: string
  firstName: string
  lastName: string
  siteName: string
  daysWorked: number
  totalHours: number
  attendanceRate: number
  payrollAmount: number
  status: string
}

export default function ExecutiveDashboardPage() {
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null)
  const [sitePerformance, setSitePerformance] = useState<SitePerformance[]>([])
  const [workerPerformance, setWorkerPerformance] = useState<WorkerPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const [selectedSite, setSelectedSite] = useState('all')
  const [sites, setSites] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [selectedPeriod, selectedSite])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [attendanceResponse, payrollResponse, sitesResponse, workersResponse] = await Promise.all([
        axios.get('/api/attendance'),
        axios.get('/api/payroll'),
        axios.get('/api/sites'),
        axios.get('/api/workers')
      ])

      const attendanceData = (attendanceResponse.data as any).data || []
      const payrollData = (payrollResponse.data as any).data || []
      const sitesData = (sitesResponse.data as any).data || []
      const workersData = (workersResponse.data as any).data || []

      // Debug: Log real data counts
      console.log('📊 Real Data Counts:', {
        workers: workersData.length,
        attendance: attendanceData.length,
        payroll: payrollData.length,
        sites: sitesData.length
      })

      setSites(sitesData)

      // Calculate executive summary - use all data, not just today
      const today = new Date().toISOString().split('T')[0]
      const todayAttendance = attendanceData.filter((record: any) => 
        record.attendanceDate.startsWith(today)
      )

      // For comprehensive view, also calculate all-time stats
      const allAttendance = attendanceData.filter((record: any) => 
        record.status === 'PRESENT' || record.status === 'LATE' || record.status === 'OVERTIME'
      )

      const presentToday = todayAttendance.filter((record: any) => 
        record.status === 'PRESENT' || record.status === 'LATE' || record.status === 'OVERTIME'
      ).length

      const lateToday = todayAttendance.filter((record: any) => 
        record.status === 'LATE'
      ).length

      const absentToday = workersData.length - presentToday

      const totalHoursWorked = todayAttendance.reduce((sum: number, record: any) => 
        sum + validateNumber(record.totalHours), 0
      )

      // Calculate total attendance days across all time
      const totalAttendanceDays = allAttendance.length

      const pendingPayroll = payrollData.filter((record: any) => 
        record.paymentStatus === 'PENDING'
      )

      const paidPayroll = payrollData.filter((record: any) => 
        record.paymentStatus === 'PAID'
      )

      const totalAmountPending = pendingPayroll.reduce((sum: number, record: any) => 
        sum + Number(record.netPay || 0), 0
      )

      const totalAmountPaid = paidPayroll.reduce((sum: number, record: any) => 
        sum + Number(record.netPay || 0), 0
      )

      const executiveSummary: ExecutiveSummary = {
        attendance: {
          totalWorkers: workersData.length,
          presentToday,
          lateToday,
          absentToday,
          totalHoursWorked,
          averageHoursPerWorker: presentToday > 0 ? totalHoursWorked / presentToday : 0,
          totalAttendanceDays
        },
        payroll: {
          totalPending: pendingPayroll.length,
          totalPaid: paidPayroll.length,
          totalAmountPending,
          totalAmountPaid,
          averagePayment: paidPayroll.length > 0 ? totalAmountPaid / paidPayroll.length : 0
        },
        sites: {
          totalSites: sitesData.length,
          activeSites: sitesData.filter((site: any) => site.status === 'ACTIVE').length,
          totalWorkers: workersData.length
        },
        trends: {
          attendanceTrend: presentToday > workersData.length * 0.8 ? 'up' : presentToday < workersData.length * 0.6 ? 'down' : 'stable',
          payrollTrend: pendingPayroll.length < 5 ? 'up' : 'stable',
          costTrend: totalAmountPaid > 0 ? 'up' : 'stable'
        }
      }

      // Debug: Log calculated summary
      console.log('📈 Calculated Summary:', {
        totalWorkers: executiveSummary.attendance.totalWorkers,
        presentToday: executiveSummary.attendance.presentToday,
        totalAttendanceDays: executiveSummary.attendance.totalAttendanceDays,
        totalPending: executiveSummary.payroll.totalPending,
        totalPaid: executiveSummary.payroll.totalPaid,
        totalAmountPending: executiveSummary.payroll.totalAmountPending,
        totalAmountPaid: executiveSummary.payroll.totalAmountPaid
      })

      setSummary(executiveSummary)

      // Calculate site performance
      const sitePerf: SitePerformance[] = sitesData.map((site: any) => {
        const siteWorkers = workersData.filter((worker: any) => worker.assignedSiteId === site.id)
        const siteAttendance = attendanceData.filter((record: any) => 
          record.siteId === site.id && record.attendanceDate.startsWith(today)
        )
        const sitePayroll = payrollData.filter((record: any) => record.siteId === site.id)

        const presentWorkers = siteAttendance.filter((record: any) => 
          record.status === 'PRESENT' || record.status === 'LATE' || record.status === 'OVERTIME'
        ).length

        const totalHours = siteAttendance.reduce((sum: number, record: any) => 
          sum + Number(record.totalHours || 0), 0
        )

        const totalPayroll = sitePayroll.reduce((sum: number, record: any) => 
          sum + record.netPay, 0
        )

        const efficiency = siteWorkers.length > 0 ? (presentWorkers / siteWorkers.length) * 100 : 0

        return {
          siteId: site.id,
          siteName: site.siteName,
          siteCode: site.siteCode,
          totalWorkers: siteWorkers.length,
          presentWorkers,
          totalHours,
          totalPayroll,
          averageHours: presentWorkers > 0 ? totalHours / presentWorkers : 0,
          efficiency
        }
      })

      setSitePerformance(sitePerf)

      // Calculate worker performance
      const workerPerf: WorkerPerformance[] = workersData.map((worker: any) => {
        const workerAttendance = attendanceData.filter((record: any) => 
          record.workerId === worker.id
        )
        const workerPayroll = payrollData.filter((record: any) => record.workerId === worker.id)

        const daysWorked = workerAttendance.filter((record: any) => 
          record.status === 'PRESENT' || record.status === 'LATE' || record.status === 'OVERTIME'
        ).length

        const totalHours = workerAttendance.reduce((sum: number, record: any) => 
          sum + Number(record.totalHours || 0), 0
        )

        const attendanceRate = workerAttendance.length > 0 ? (daysWorked / workerAttendance.length) * 100 : 0

        const payrollAmount = workerPayroll.reduce((sum: number, record: any) => 
          sum + record.netPay, 0
        )

        const site = sitesData.find((s: any) => s.id === worker.assignedSiteId)

        return {
          workerId: worker.id,
          employeeId: worker.employeeId,
          firstName: worker.firstName,
          lastName: worker.lastName,
          siteName: site?.siteName || 'Unassigned',
          daysWorked,
          totalHours,
          attendanceRate,
          payrollAmount,
          status: worker.status
        }
      })

      setWorkerPerformance(workerPerf)

    } catch (error) {
      console.error('Error fetching executive data:', error)
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <IconTrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <IconTrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <IconChartBar className="h-4 w-4 text-blue-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-blue-600'
    }
  }

  const downloadExecutiveReport = () => {
    if (!summary) return

    const reportData = {
      'Executive Summary': {
        'Total Workers': summary.attendance.totalWorkers,
        'Present Today': summary.attendance.presentToday,
        'Late Today': summary.attendance.lateToday,
        'Absent Today': summary.attendance.absentToday,
        'Total Hours Worked': summary.attendance.totalHoursWorked,
        'Average Hours per Worker': summary.attendance.averageHoursPerWorker.toFixed(2),
        'Pending Payments': summary.payroll.totalPending,
        'Completed Payments': summary.payroll.totalPaid,
        'Amount Pending': formatCurrency(summary.payroll.totalAmountPending),
        'Amount Paid': formatCurrency(summary.payroll.totalAmountPaid),
        'Average Payment': formatCurrency(summary.payroll.averagePayment),
        'Total Sites': summary.sites.totalSites,
        'Active Sites': summary.sites.activeSites
      },
      'Site Performance': sitePerformance.map(site => ({
        'Site Name': site.siteName,
        'Site Code': site.siteCode,
        'Total Workers': site.totalWorkers,
        'Present Workers': site.presentWorkers,
        'Total Hours': site.totalHours,
        'Total Payroll': formatCurrency(site.totalPayroll),
        'Average Hours': site.averageHours.toFixed(2),
        'Efficiency %': site.efficiency.toFixed(1)
      })),
      'Worker Performance': workerPerformance.map(worker => ({
        'Employee ID': worker.employeeId,
        'Full Name': `${worker.firstName} ${worker.lastName}`,
        'Site': worker.siteName,
        'Days Worked': worker.daysWorked,
        'Total Hours': worker.totalHours,
        'Attendance Rate %': worker.attendanceRate.toFixed(1),
        'Payroll Amount': formatCurrency(worker.payrollAmount),
        'Status': worker.status
      }))
    }

    const csvContent = Object.entries(reportData).map(([section, data]) => {
      if (Array.isArray(data)) {
        const headers = Object.keys(data[0] || {})
        const rows = data.map(item => Object.values(item))
        return [section, '', ...headers, ...rows.map(row => row.join(','))].join('\n')
      } else {
        const rows = Object.entries(data).map(([key, value]) => `${key},${value}`)
        return [section, '', ...rows].join('\n')
      }
    }).join('\n\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `executive-report-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <IconLoader className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-white">Loading executive dashboard...</span>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <IconAlertCircle className="h-8 w-8 text-red-500" />
        <span className="ml-2 text-white">Failed to load executive data</span>
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
                <h1 className="text-3xl font-bold tracking-tight text-white">Executive Dashboard</h1>
                <p className="text-gray-400">Complete overview from attendance to payroll</p>
              </div>
              <div className="flex gap-2">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  onClick={downloadExecutiveReport}
                >
                  <IconFileText className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              </div>
            </div>

            {/* Executive Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Attendance Overview */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
                    <IconUsers className="mr-2 h-4 w-4" />
                    Attendance Today
                    {getTrendIcon(summary.trends.attendanceTrend)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">{summary.attendance.presentToday}</div>
                  <p className="text-xs text-blue-700">
                    of {summary.attendance.totalWorkers} workers present
                  </p>
                  <div className="flex items-center mt-2 text-xs">
                    <IconClock className="mr-1 h-3 w-3" />
                    <span className="text-blue-800 font-medium">{summary.attendance.totalHoursWorked}h total</span>
                  </div>
                </CardContent>
              </Card>

              {/* Payroll Overview */}
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-800 flex items-center">
                    <IconWallet className="mr-2 h-4 w-4" />
                    Payroll Status
                    {getTrendIcon(summary.trends.payrollTrend)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">{summary.payroll.totalPaid}</div>
                  <p className="text-xs text-green-700">
                    payments completed
                  </p>
                  <div className="flex items-center mt-2 text-xs">
                    <IconCash className="mr-1 h-3 w-3" />
                    <span className="text-green-800 font-medium">{formatCurrency(summary.payroll.totalAmountPaid)} paid</span>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Payments */}
              <Card className="bg-yellow-50 border-yellow-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-800 flex items-center">
                    <IconAlertCircle className="mr-2 h-4 w-4" />
                    Pending Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-900">{summary.payroll.totalPending}</div>
                  <p className="text-xs text-yellow-700">
                    payments pending
                  </p>
                  <div className="flex items-center mt-2 text-xs">
                    <IconCash className="mr-1 h-3 w-3" />
                    <span className="text-yellow-800 font-medium">{formatCurrency(summary.payroll.totalAmountPending)} pending</span>
                  </div>
                </CardContent>
              </Card>

              {/* Site Overview */}
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800 flex items-center">
                    <IconBuilding className="mr-2 h-4 w-4" />
                    Sites Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">{summary.sites.activeSites}</div>
                  <p className="text-xs text-purple-700">
                    of {summary.sites.totalSites} sites active
                  </p>
                  <div className="flex items-center mt-2 text-xs">
                    <IconUsers className="mr-1 h-3 w-3" />
                    <span className="text-purple-800 font-medium">{summary.sites.totalWorkers} total workers</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Site Performance Table */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-white">Site Performance</CardTitle>
                <CardDescription className="text-gray-400">
                  Performance metrics by construction site
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-white">Site</th>
                        <th className="text-left py-2 text-white">Workers</th>
                        <th className="text-left py-2 text-white">Present</th>
                        <th className="text-left py-2 text-white">Hours</th>
                        <th className="text-left py-2 text-white">Payroll</th>
                        <th className="text-left py-2 text-white">Efficiency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sitePerformance.map((site) => (
                        <tr key={site.siteId} className="border-b border-gray-100">
                          <td className="py-2 text-gray-700">
                            <div>
                              <div className="font-medium">{site.siteName}</div>
                              <div className="text-xs text-gray-500">{site.siteCode}</div>
                            </div>
                          </td>
                          <td className="py-2 text-gray-700">{site.totalWorkers}</td>
                          <td className="py-2 text-gray-700">{site.presentWorkers}</td>
                          <td className="py-2 text-gray-700">{site.totalHours.toFixed(1)}h</td>
                          <td className="py-2 text-gray-700">{formatCurrency(site.totalPayroll)}</td>
                          <td className="py-2">
                            <Badge 
                              className={
                                site.efficiency >= 80 ? 'bg-green-100 text-green-800' :
                                site.efficiency >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {site.efficiency.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Worker Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-white">Top Performing Workers</CardTitle>
                <CardDescription className="text-gray-400">
                  Workers with highest attendance and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-white">Employee</th>
                        <th className="text-left py-2 text-white">Site</th>
                        <th className="text-left py-2 text-white">Days Worked</th>
                        <th className="text-left py-2 text-white">Hours</th>
                        <th className="text-left py-2 text-white">Attendance</th>
                        <th className="text-left py-2 text-white">Payroll</th>
                        <th className="text-left py-2 text-white">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workerPerformance
                        .sort((a, b) => b.attendanceRate - a.attendanceRate)
                        .slice(0, 10)
                        .map((worker) => (
                        <tr key={worker.workerId} className="border-b border-gray-100">
                          <td className="py-2 text-gray-700">
                            <div>
                              <div className="font-medium">{worker.firstName} {worker.lastName}</div>
                              <div className="text-xs text-gray-500">{worker.employeeId}</div>
                            </div>
                          </td>
                          <td className="py-2 text-gray-700">{worker.siteName}</td>
                          <td className="py-2 text-gray-700">{worker.daysWorked}</td>
                          <td className="py-2 text-gray-700">{worker.totalHours.toFixed(1)}h</td>
                          <td className="py-2">
                            <Badge 
                              className={
                                worker.attendanceRate >= 90 ? 'bg-green-100 text-green-800' :
                                worker.attendanceRate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {worker.attendanceRate.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="py-2 text-gray-700">{formatCurrency(worker.payrollAmount)}</td>
                          <td className="py-2">
                            <Badge 
                              className={
                                worker.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {worker.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
