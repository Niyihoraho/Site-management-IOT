"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { IconListCheck, IconSearch, IconCalendar, IconClock, IconUser, IconBuilding, IconEdit, IconEye, IconFingerprint, IconScan, IconCheck, IconX, IconLoader, IconFileText } from "@tabler/icons-react"

interface AttendanceRecord {
  id: number
  workerId: number
  siteId: number
  worker: {
    id: number
    employeeId: string
    firstName: string
    lastName: string
    status: string
    assignedSiteId: number
  }
  site: {
    id: number
    siteName: string
    siteCode: string
  }
  attendanceDate: string
  checkInTime: string | null
  checkOutTime: string | null
  totalHours: number | null
  regularHours: number | null
  overtimeHours: number
  breakTimeMinutes: number
  status: string
  checkOutMethod: string
  fingerprintVerified: boolean
  fingerprintLogs?: Array<{
    id: number
    matchResult: string
    matchScore: number | null
    scanQuality: number | null
    scanTimestamp: string
  }>
}

interface Worker {
  id: number
  employeeId: string
  firstName: string
  lastName: string
  status: string
  assignedSiteId: number
}

interface Site {
  id: number
  siteName: string
  siteCode: string
}

interface FingerprintDevice {
  id: number
  deviceName: string
  deviceId: string
  isOnline: boolean
  isActive: boolean
}

export default function AttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [devices, setDevices] = useState<FingerprintDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSite, setSelectedSite] = useState("all")
  const [selectedDate, setSelectedDate] = useState("")
  const [fingerprintModalOpen, setFingerprintModalOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [selectedDevice, setSelectedDevice] = useState<FingerprintDevice | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [selectedWorkerForManual, setSelectedWorkerForManual] = useState<Worker | null>(null)
  const [selectedSiteForManual, setSelectedSiteForManual] = useState<Site | null>(null)
  const [manualAction, setManualAction] = useState<'check-in' | 'check-out' | null>(null)
  const [manualLoading, setManualLoading] = useState(false)
  const [workerSearchTerm, setWorkerSearchTerm] = useState("")
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false)
  const [viewMode, setViewMode] = useState<'all' | 'manual'>('all')
  const [manualRecords, setManualRecords] = useState<AttendanceRecord[]>([])
  const [simpleModalOpen, setSimpleModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)

  // Fetch data on component mount
  useEffect(() => {
    fetchData()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.search-dropdown')) {
        setShowWorkerDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch data with individual error handling
      const results = await Promise.allSettled([
        axios.get('/api/attendance'),
        axios.get('/api/workers'),
        axios.get('/api/sites'),
        axios.get('/api/fingerprint/devices')
      ])

      const [attendanceResult, workersResult, sitesResult, devicesResult] = results

      // Handle attendance data
      if (attendanceResult.status === 'fulfilled') {
        const attendanceData = (attendanceResult.value.data as any).data || []
        setAttendanceRecords(attendanceData)
        console.log('✅ Attendance data loaded:', attendanceData.length, 'records')
        console.log('📊 Sample attendance record:', attendanceData[0])
        console.log('📊 Full API response:', attendanceResult.value.data)
      } else {
        console.error('❌ Failed to load attendance data:', attendanceResult.reason)
        setAttendanceRecords([])
      }

      // Handle workers data
      if (workersResult.status === 'fulfilled') {
        const workersData = (workersResult.value.data as any).data || []
        setWorkers(workersData)
        console.log('✅ Workers data loaded:', workersData.length, 'workers')
      } else {
        console.error('❌ Failed to load workers data:', workersResult.reason)
        setWorkers([])
      }

      // Handle sites data
      if (sitesResult.status === 'fulfilled') {
        const sitesData = (sitesResult.value.data as any).data || []
        setSites(sitesData)
        console.log('✅ Sites data loaded:', sitesData.length, 'sites')
      } else {
        console.error('❌ Failed to load sites data:', sitesResult.reason)
        setSites([])
      }

      // Handle devices data
      if (devicesResult.status === 'fulfilled') {
        const devicesData = (devicesResult.value.data as any).data || []
        setDevices(devicesData)
        console.log('✅ Devices data loaded:', devicesData.length, 'devices')
      } else {
        console.error('❌ Failed to load devices data:', devicesResult.reason)
        setDevices([])
      }

    } catch (error) {
      console.error('Error in fetchData:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchManualRecords = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/attendance/manual', {
        params: {
          page: 1,
          limit: 100,
          type: 'all'
        }
      })
      const manualData = (response.data as any).data || []
      console.log('Fetched manual records:', manualData.length)
      setManualRecords(manualData)
    } catch (error) {
      console.error('Error fetching manual records:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFingerprintScan = async () => {
    if (!selectedWorker || !selectedDevice) return

    setScanning(true)
    setScanResult(null)

    try {
      // Simulate fingerprint scan data
      const scanData = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const response = await fetch('/api/attendance/fingerprint-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workerId: selectedWorker.id,
          siteId: selectedWorker.assignedSiteId || 1, // Default to first site
          deviceId: selectedDevice.id,
          scanData,
          scanQuality: Math.floor(Math.random() * 31) + 70, // 70-100
          fingerPosition: 'INDEX',
          hand: 'RIGHT'
        })
      })

      const result = await response.json()
      setScanResult(result)

      if (result.success) {
        // Refresh attendance records
        await fetchData()
        // Close modal after successful scan
        setTimeout(() => {
          setFingerprintModalOpen(false)
          setSelectedWorker(null)
          setSelectedDevice(null)
          setScanResult(null)
        }, 2000)
      }
    } catch (error) {
      console.error('Error processing fingerprint scan:', error)
      setScanResult({
        success: false,
        error: 'Failed to process fingerprint scan'
      })
    } finally {
      setScanning(false)
    }
  }

  const handleManualCheckIn = async () => {
    if (!selectedWorkerForManual || !selectedSiteForManual) return

    setManualLoading(true)
    try {
      const response = await axios.post('/api/attendance/manual-check-in', {
        workerId: selectedWorkerForManual.id,
        siteId: selectedSiteForManual.id,
        checkInTime: new Date().toISOString()
      })

      if ((response.data as any).success) {
        // Refresh attendance records
        await fetchData()
        // Close modal and reset state
        setManualModalOpen(false)
        setSelectedWorkerForManual(null)
        setSelectedSiteForManual(null)
        setManualAction(null)
        setWorkerSearchTerm("")
        setShowWorkerDropdown(false)
      }
    } catch (error: any) {
      console.error('Error processing manual check-in:', error)
      const errorMessage = error.response?.data?.error || 'Failed to process manual check-in'
      alert(`Error: ${errorMessage}`)
    } finally {
      setManualLoading(false)
    }
  }

  const handleManualCheckOut = async () => {
    if (!selectedWorkerForManual || !selectedSiteForManual) return

    setManualLoading(true)
    try {
      const response = await axios.post('/api/attendance/manual-check-out', {
        workerId: selectedWorkerForManual.id,
        siteId: selectedSiteForManual.id,
        checkOutTime: new Date().toISOString(),
        checkOutMethod: 'MANUAL',
        fingerprintVerified: false
      })

      if ((response.data as any).success) {
        // Refresh attendance records
        await fetchData()
        // Close modal and reset state
        setManualModalOpen(false)
        setSelectedWorkerForManual(null)
        setSelectedSiteForManual(null)
        setManualAction(null)
        setWorkerSearchTerm("")
        setShowWorkerDropdown(false)
      }
    } catch (error: any) {
      console.error('Error processing manual check-out:', error)
      const errorMessage = error.response?.data?.error || 'Failed to process manual check-out'
      alert(`Error: ${errorMessage}`)
    } finally {
      setManualLoading(false)
    }
  }

  // Simple modal functions
  const handleSimpleCheckOut = async () => {
    if (!selectedRecord) return

    setManualLoading(true)
    try {
      const response = await axios.post('/api/attendance/manual-check-out', {
        workerId: selectedRecord.worker.id,
        siteId: selectedRecord.site.id,
        checkOutTime: new Date().toISOString(),
        checkOutMethod: 'MANUAL',
        fingerprintVerified: false
      })

      if ((response.data as any).success) {
        // Refresh attendance records
        await fetchData()
        // Close modal and reset state
        setSimpleModalOpen(false)
        setSelectedRecord(null)
      }
    } catch (error: any) {
      console.error('Error processing manual check-out:', error)
      const errorMessage = error.response?.data?.error || 'Failed to process manual check-out'
      alert(`Error: ${errorMessage}`)
    } finally {
      setManualLoading(false)
    }
  }

  const handleSimpleCheckIn = async () => {
    if (!selectedRecord) return

    setManualLoading(true)
    try {
      const response = await axios.post('/api/attendance/manual-check-in', {
        workerId: selectedRecord.worker.id,
        siteId: selectedRecord.site.id,
        checkInTime: new Date().toISOString()
      })

      if ((response.data as any).success) {
        // Refresh attendance records
        await fetchData()
        // Close modal and reset state
        setSimpleModalOpen(false)
        setSelectedRecord(null)
      }
    } catch (error: any) {
      console.error('Error processing manual check-in:', error)
      const errorMessage = error.response?.data?.error || 'Failed to process manual check-in'
      alert(`Error: ${errorMessage}`)
    } finally {
      setManualLoading(false)
    }
  }

  // Filter workers based on search term (prioritize names)
  const filteredWorkers = workers.filter(worker => 
    worker.status === 'ACTIVE' && (
      worker.firstName.toLowerCase().includes(workerSearchTerm.toLowerCase()) ||
      worker.lastName.toLowerCase().includes(workerSearchTerm.toLowerCase()) ||
      `${worker.firstName} ${worker.lastName}`.toLowerCase().includes(workerSearchTerm.toLowerCase()) ||
      worker.employeeId.toLowerCase().includes(workerSearchTerm.toLowerCase())
    )
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-100 text-green-800"
      case "LATE":
        return "bg-yellow-100 text-yellow-800"
      case "ABSENT":
        return "bg-red-100 text-red-800"
      case "HALF_DAY":
        return "bg-blue-100 text-blue-800"
      case "OVERTIME":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatTime = (dateTime: string | null) => {
    if (!dateTime) return "Not recorded"
    return new Date(dateTime).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
                    <h1 className="text-3xl font-bold tracking-tight">
                      {viewMode === 'manual' ? 'Manual Attendance Records' : 'Attendance List'}
                    </h1>
                    <p className="text-muted-foreground">
                      {viewMode === 'manual' 
                        ? 'View and manage manual check-in/check-out records' 
                        : 'Track daily attendance and working hours'
                      }
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={fingerprintModalOpen} onOpenChange={setFingerprintModalOpen}>
                      <DialogTrigger asChild>
                  <Button>
                          <IconScan className="mr-2 h-4 w-4" />
                          Fingerprint Check
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Fingerprint Attendance Check</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Select Worker</label>
                            <Select onValueChange={(value) => {
                              const worker = workers.find(w => w.id.toString() === value)
                              setSelectedWorker(worker || null)
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a worker" />
                              </SelectTrigger>
                              <SelectContent>
                                {workers.filter(w => w.status === 'ACTIVE').map((worker) => (
                                  <SelectItem key={worker.id} value={worker.id.toString()}>
                                    {worker.employeeId} - {worker.firstName} {worker.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Select Device</label>
                            <Select onValueChange={(value) => {
                              const device = devices.find(d => d.id.toString() === value)
                              setSelectedDevice(device || null)
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a device" />
                              </SelectTrigger>
                              <SelectContent>
                                {devices.filter(d => d.isActive && d.isOnline).map((device) => (
                                  <SelectItem key={device.id} value={device.id.toString()}>
                                    {device.deviceName} ({device.deviceId})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {selectedWorker && selectedDevice && (
                            <div className="space-y-4">
                              <div className="p-4 border rounded-lg bg-muted/50">
                                <h4 className="font-medium mb-2">Ready to Scan</h4>
                                <p className="text-sm text-muted-foreground">
                                  Worker: {selectedWorker.employeeId} - {selectedWorker.firstName} {selectedWorker.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Device: {selectedDevice.deviceName}
                                </p>
                              </div>

                              <Button 
                                onClick={handleFingerprintScan} 
                                disabled={scanning}
                                className="w-full"
                              >
                                {scanning ? (
                                  <>
                                    <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                                    Scanning...
                                  </>
                                ) : (
                                  <>
                                    <IconFingerprint className="mr-2 h-4 w-4" />
                                    Start Fingerprint Scan
                                  </>
                                )}
                              </Button>

                              {scanResult && (
                                <div className={`p-4 border rounded-lg ${
                                  scanResult.success 
                                    ? 'bg-green-50 border-green-200' 
                                    : 'bg-red-50 border-red-200'
                                }`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    {scanResult.success ? (
                                      <IconCheck className="h-5 w-5 text-green-600" />
                                    ) : (
                                      <IconX className="h-5 w-5 text-red-600" />
                                    )}
                                    <span className={`font-medium ${
                                      scanResult.success ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                      {scanResult.success ? 'Success' : 'Failed'}
                                    </span>
                                  </div>
                                  <p className={`text-sm ${
                                    scanResult.success ? 'text-green-700' : 'text-red-700'
                                  }`}>
                                    {scanResult.message || scanResult.error}
                                  </p>
                                  {scanResult.data?.fingerprintLog && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                      Match Score: {scanResult.data.fingerprintLog.matchScore}% | 
                                      Quality: {scanResult.data.fingerprintLog.scanQuality}%
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={manualModalOpen} onOpenChange={(open) => {
                      setManualModalOpen(open)
                      if (!open) {
                        setSelectedWorkerForManual(null)
                        setSelectedSiteForManual(null)
                        setManualAction(null)
                        setWorkerSearchTerm("")
                        setShowWorkerDropdown(false)
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <IconUser className="mr-2 h-4 w-4" />
                          Manual Check
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Manual Attendance Check</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="relative search-dropdown">
                            <label className="text-sm font-medium">Search Worker</label>
                            <div className="relative">
                              <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="Type worker name or employee ID..." 
                                className="pl-8 pr-8" 
                                value={workerSearchTerm}
                                onChange={(e) => {
                                  setWorkerSearchTerm(e.target.value)
                                  setShowWorkerDropdown(true)
                                }}
                                onFocus={() => setShowWorkerDropdown(true)}
                              />
                              {workerSearchTerm && (
                                <button
                                  onClick={() => {
                                    setWorkerSearchTerm("")
                                    setSelectedWorkerForManual(null)
                                    setShowWorkerDropdown(false)
                                  }}
                                  className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground"
                                >
                                  <IconX className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            {showWorkerDropdown && workerSearchTerm && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                {filteredWorkers.length > 0 ? (
                                  filteredWorkers.map((worker) => (
                                    <div
                                      key={worker.id}
                                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                      onClick={() => {
                                        setSelectedWorkerForManual(worker)
                                        setWorkerSearchTerm(`${worker.firstName} ${worker.lastName}`)
                                        setShowWorkerDropdown(false)
                                      }}
                                    >
                                      <div className="font-medium text-gray-900">{worker.firstName} {worker.lastName}</div>
                                      <div className="text-sm text-gray-500 font-mono">{worker.employeeId}</div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="px-4 py-3 text-gray-500">No workers found</div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Select Site</label>
                            <Select onValueChange={(value) => {
                              const site = sites.find(s => s.id.toString() === value)
                              setSelectedSiteForManual(site || null)
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a site" />
                              </SelectTrigger>
                              <SelectContent>
                                {sites.map((site) => (
                                  <SelectItem key={site.id} value={site.id.toString()}>
                                    {site.siteName} ({site.siteCode})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {selectedWorkerForManual && selectedSiteForManual && (
                            <div className="space-y-4">
                              <div className="p-4 border rounded-lg bg-muted/50">
                                <h4 className="font-medium mb-2">Ready for Manual Check</h4>
                                <p className="text-sm text-muted-foreground">
                                  Worker: {selectedWorkerForManual.employeeId} - {selectedWorkerForManual.firstName} {selectedWorkerForManual.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Site: {selectedSiteForManual.siteName} ({selectedSiteForManual.siteCode})
                                </p>
                              </div>

                              <div className="flex gap-2">
                                {manualAction === 'check-in' ? (
                                  <Button 
                                    onClick={handleManualCheckIn}
                                    disabled={manualLoading}
                                    className="flex-1"
                                  >
                                    {manualLoading ? (
                                      <>
                                        <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                                        Checking In...
                                      </>
                                    ) : (
                                      <>
                                        <IconCheck className="mr-2 h-4 w-4" />
                                        Check In
                                      </>
                                    )}
                                  </Button>
                                ) : manualAction === 'check-out' ? (
                                  <Button 
                                    onClick={handleManualCheckOut}
                                    disabled={manualLoading}
                                    variant="outline"
                                    className="flex-1"
                                  >
                                    {manualLoading ? (
                                      <>
                                        <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                                        Checking Out...
                                      </>
                                    ) : (
                                      <>
                                        <IconX className="mr-2 h-4 w-4" />
                                        Check Out
                                      </>
                                    )}
                                  </Button>
                                ) : (
                                  <>
                                    <Button 
                                      onClick={() => {
                                        setManualAction('check-in')
                                      }}
                                      className="flex-1"
                                    >
                                      <IconCheck className="mr-2 h-4 w-4" />
                                      Check In
                                    </Button>
                                    
                                    <Button 
                                      onClick={() => {
                                        setManualAction('check-out')
                                      }}
                                      variant="outline"
                                      className="flex-1"
                                    >
                                      <IconX className="mr-2 h-4 w-4" />
                                      Check Out
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Simple Modal for Single Worker Actions */}
                    <Dialog open={simpleModalOpen} onOpenChange={setSimpleModalOpen}>
                      <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                          <DialogTitle>
                            {selectedRecord?.checkInTime && !selectedRecord?.checkOutTime 
                              ? 'Manual Check-out' 
                              : 'Manual Check-in'
                            }
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {selectedRecord && (
                            <div className="p-4 border rounded-lg bg-muted/50">
                              <h4 className="font-medium mb-2">Ready for Manual Check</h4>
                              <p className="text-sm text-muted-foreground">
                                Worker: {selectedRecord.worker.employeeId} - {selectedRecord.worker.firstName} {selectedRecord.worker.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Site: {selectedRecord.site.siteName} ({selectedRecord.site.siteCode})
                              </p>
                              {selectedRecord.checkInTime && (
                                <p className="text-sm text-muted-foreground">
                                  Check-in Time: {formatTime(selectedRecord.checkInTime)}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2">
                            {selectedRecord?.checkInTime && !selectedRecord?.checkOutTime ? (
                              <Button 
                                onClick={handleSimpleCheckOut}
                                disabled={manualLoading}
                                className="flex-1 bg-red-600 hover:bg-red-700"
                              >
                                {manualLoading ? (
                                  <>
                                    <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                                    Checking Out...
                                  </>
                                ) : (
                                  <>
                                    <IconX className="mr-2 h-4 w-4" />
                                    Check Out
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button 
                                onClick={handleSimpleCheckIn}
                                disabled={manualLoading}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                {manualLoading ? (
                                  <>
                                    <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                                    Checking In...
                                  </>
                                ) : (
                                  <>
                                    <IconCheck className="mr-2 h-4 w-4" />
                                    Check In
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        if (viewMode === 'manual') {
                          setViewMode('all')
                          fetchData()
                        } else {
                          setViewMode('manual')
                          fetchManualRecords()
                        }
                      }}
                    >
                      <IconFileText className="mr-2 h-4 w-4" />
                      {viewMode === 'manual' ? 'View All Records' : 'View Manual Records'}
                    </Button>
                    
                    <Button variant="outline">
                    <IconFingerprint className="mr-2 h-4 w-4" />
                      View Logs
                  </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-6">
                  <div className="relative flex-1 max-w-sm">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search workers..." 
                      className="pl-8" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={selectedSite} onValueChange={setSelectedSite}>
                    <SelectTrigger className="w-[180px]">
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
                  <Input 
                    type="date" 
                    className="w-[180px]" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    placeholder="All dates"
                  />
                </div>

                <div className="rounded-md border">
                  {loading ? (
                    <div className="p-8 text-center">
                      <IconLoader className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading attendance records...</p>
                    </div>
                  ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Worker</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Fingerprint</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(() => {
                          const filteredRecords = (viewMode === 'manual' ? manualRecords : attendanceRecords)
                            .filter(record => {
                              const matchesSearch = !searchTerm || 
                                record.worker.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                record.worker.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                record.worker.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
                              
                              const matchesSite = selectedSite === "all" || 
                                record.site.id.toString() === selectedSite
                              
                              const matchesDate = !selectedDate || record.attendanceDate.startsWith(selectedDate)
                              
                              return matchesSearch && matchesSite && matchesDate
                            })

                          if (filteredRecords.length === 0) {
                            return (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">
                                  <div className="text-muted-foreground">
                                    <IconListCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No {viewMode === 'manual' ? 'manual ' : ''}attendance records found</p>
                                    <p className="text-sm">Try adjusting your search or date filters</p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          }

                          return filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div>
                                  <div className="font-medium">
                                    {record.worker.firstName} {record.worker.lastName}
                                  </div>
                                  <div className="text-sm text-muted-foreground font-mono">
                                    {record.worker.employeeId}
                                  </div>
                              <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <IconBuilding className="mr-1 h-3 w-3" />
                                    {record.site.siteName}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{formatDate(record.attendanceDate)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <IconClock className="mr-1 h-3 w-3 text-muted-foreground" />
                              {formatTime(record.checkInTime)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <IconClock className="mr-1 h-3 w-3 text-muted-foreground" />
                              {formatTime(record.checkOutTime)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                                  <div className="text-sm font-medium">
                                    {record.totalHours ? `${record.totalHours}h` : '0h'} total
                                  </div>
                              <div className="text-xs text-muted-foreground">
                                    Regular: {record.regularHours ? `${record.regularHours}h` : '0h'}
                                {record.overtimeHours > 0 && ` | Overtime: ${record.overtimeHours}h`}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center text-xs">
                                    {record.checkOutMethod === 'MANUAL' ? (
                                      <>
                                        <IconUser className="mr-1 h-3 w-3" />
                                        <span className="text-blue-600">Manual</span>
                                      </>
                                    ) : (
                                      <>
                                <IconFingerprint className="mr-1 h-3 w-3" />
                                {record.fingerprintVerified ? (
                                  <span className="text-green-600">Verified</span>
                                ) : (
                                  <span className="text-red-600">Not verified</span>
                                        )}
                                      </>
                                )}
                              </div>
                                  {record.fingerprintLogs && record.fingerprintLogs.length > 0 && record.checkOutMethod !== 'MANUAL' && (
                                <div className="text-xs text-muted-foreground">
                                      Score: {record.fingerprintLogs[0].matchScore}%
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                                  {/* Check-in only - show check-out button */}
                                  {record.checkInTime && !record.checkOutTime && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        setSelectedRecord(record)
                                        setSimpleModalOpen(true)
                                      }}
                                      className="text-red-600 hover:text-red-700 border-red-600 hover:border-red-700"
                                      title="Manual Check-out"
                                    >
                                      <IconX className="h-4 w-4" />
                              </Button>
                                  )}
                                  
                                  {/* Both check-in and check-out completed - show done icon */}
                                  {record.checkInTime && record.checkOutTime && (
                                    <div className="flex items-center justify-center">
                                      <IconCheck className="h-5 w-5 text-green-600" title="Attendance Complete" />
                                    </div>
                                  )}
                                  
                                  {/* No check-in yet - show check-in button */}
                                  {!record.checkInTime && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        setSelectedRecord(record)
                                        setSimpleModalOpen(true)
                                      }}
                                      className="text-green-600 hover:text-green-700 border-green-600 hover:border-green-700"
                                      title="Manual Check-in"
                                    >
                                      <IconCheck className="h-4 w-4" />
                              </Button>
                                  )}
                            </div>
                          </TableCell>
                        </TableRow>
                          ))
                        })()}
                    </TableBody>
                  </Table>
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
