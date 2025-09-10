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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { IconFingerprint, IconSearch, IconPlus, IconEdit, IconTrash, IconEye, IconDeviceDesktop, IconUser, IconLoader, IconCheck, IconX, IconAlertTriangle } from "@tabler/icons-react"

interface FingerprintTemplate {
  id: number
  workerId: number
  fingerPosition: string
  hand: string
  qualityScore: number
  enrollmentDate: string
  enrolledBy: string | null
  deviceUsed: string | null
  isActive: boolean
  worker: {
    id: number
    employeeId: string
    firstName: string
    lastName: string
  }
}

interface FingerprintDevice {
  id: number
  deviceId: string
  deviceName: string
  siteId: number | null
  manufacturer: string | null
  model: string | null
  serialNumber: string | null
  firmwareVersion: string | null
  ipAddress: string | null
  macAddress: string | null
  isOnline: boolean
  isActive: boolean
  lastPing: string | null
  site: {
    id: number
    siteName: string
    siteCode: string
  } | null
}

interface FingerprintLog {
  id: number
  attendanceRecordId: number | null
  workerId: number | null
  deviceId: number | null
  matchScore: number | null
  matchedTemplateId: number | null
  scanTimestamp: string
  scanQuality: number | null
  matchResult: string
  errorMessage: string | null
  device: {
    id: number
    deviceName: string
    deviceId: string
  } | null
  matchedTemplate: {
    id: number
    fingerPosition: string
    hand: string
    qualityScore: number
  } | null
}

interface Worker {
  id: number
  employeeId: string
  firstName: string
  lastName: string
  status: string
}

interface Site {
  id: number
  siteName: string
  siteCode: string
}

export default function FingerprintPage() {
  const [templates, setTemplates] = useState<FingerprintTemplate[]>([])
  const [devices, setDevices] = useState<FingerprintDevice[]>([])
  const [logs, setLogs] = useState<FingerprintLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState("templates")
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [addTemplateModalOpen, setAddTemplateModalOpen] = useState(false)
  const [addDeviceModalOpen, setAddDeviceModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  // Add Template Form states
  const [newTemplateWorkerId, setNewTemplateWorkerId] = useState<string>('')
  const [newTemplateData, setNewTemplateData] = useState<string>('')
  const [newTemplateFingerPosition, setNewTemplateFingerPosition] = useState<string>('THUMB')
  const [newTemplateHand, setNewTemplateHand] = useState<string>('RIGHT')
  const [newTemplateQualityScore, setNewTemplateQualityScore] = useState<number>(85)
  const [addTemplateLoading, setAddTemplateLoading] = useState(false)
  const [workers, setWorkers] = useState<Worker[]>([])

  // Add Device Form states
  const [newDeviceDeviceId, setNewDeviceDeviceId] = useState<string>('')
  const [newDeviceName, setNewDeviceName] = useState<string>('')
  const [newDeviceSiteId, setNewDeviceSiteId] = useState<string>('')
  const [newDeviceManufacturer, setNewDeviceManufacturer] = useState<string>('')
  const [newDeviceModel, setNewDeviceModel] = useState<string>('')
  const [newDeviceSerialNumber, setNewDeviceSerialNumber] = useState<string>('')
  const [newDeviceFirmwareVersion, setNewDeviceFirmwareVersion] = useState<string>('')
  const [newDeviceIpAddress, setNewDeviceIpAddress] = useState<string>('')
  const [newDeviceMacAddress, setNewDeviceMacAddress] = useState<string>('')
  const [newDeviceIsOnline, setNewDeviceIsOnline] = useState<boolean>(false)
  const [addDeviceLoading, setAddDeviceLoading] = useState(false)
  const [sites, setSites] = useState<Site[]>([])

  useEffect(() => {
    fetchData()
    fetchWorkersAndSites()
  }, [])

  const fetchWorkersAndSites = async () => {
    try {
      const [workersRes, sitesRes] = await Promise.allSettled([
        axios.get('/api/workers'),
        axios.get('/api/sites')
      ])

      if (workersRes.status === 'fulfilled') {
        setWorkers(workersRes.value.data.data || [])
      } else {
        console.error('Failed to fetch workers:', workersRes.reason)
      }

      if (sitesRes.status === 'fulfilled') {
        setSites(sitesRes.value.data.data || [])
      } else {
        console.error('Failed to fetch sites:', sitesRes.reason)
      }
    } catch (err) {
      console.error('Error fetching workers and sites:', err)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [templatesRes, devicesRes, logsRes] = await Promise.allSettled([
        axios.get('/api/fingerprint'),
        axios.get('/api/fingerprint/devices'),
        axios.get('/api/fingerprint/logs')
      ])

      if (templatesRes.status === 'fulfilled') {
        setTemplates(templatesRes.value.data.data || [])
      } else {
        console.error('Error fetching templates:', templatesRes.reason)
      }

      if (devicesRes.status === 'fulfilled') {
        setDevices(devicesRes.value.data.data || [])
      } else {
        console.error('Error fetching devices:', devicesRes.reason)
      }

      if (logsRes.status === 'fulfilled') {
        setLogs(logsRes.value.data.data || [])
      } else {
        console.error('Error fetching logs:', logsRes.reason)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to fetch fingerprint data')
    } finally {
      setLoading(false)
    }
  }

  const getMatchResultColor = (result: string) => {
    switch (result) {
      case "SUCCESS":
        return "bg-green-100 text-green-800"
      case "NO_MATCH":
        return "bg-red-100 text-red-800"
      case "POOR_QUALITY":
        return "bg-yellow-100 text-yellow-800"
      case "DEVICE_ERROR":
        return "bg-orange-100 text-orange-800"
      case "MULTIPLE_MATCHES":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getDeviceStatusColor = (isOnline: boolean, isActive: boolean) => {
    if (!isActive) return "bg-gray-100 text-gray-800"
    if (isOnline) return "bg-green-100 text-green-800"
    return "bg-red-100 text-red-800"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // CRUD handlers
  const handleViewItem = (item: any, type: 'template' | 'device') => {
    setSelectedItem({ ...item, type })
    setViewModalOpen(true)
  }

  const handleEditItem = (item: any, type: 'template' | 'device') => {
    setSelectedItem({ ...item, type })
    setEditModalOpen(true)
  }

  const handleDeleteItem = (item: any, type: 'template' | 'device') => {
    setSelectedItem({ ...item, type })
    setDeleteModalOpen(true)
  }

  const confirmDeleteItem = async () => {
    if (!selectedItem) return

    try {
      setDeleting(true)
      const endpoint = selectedItem.type === 'template' 
        ? `/api/fingerprint/${selectedItem.id}`
        : `/api/fingerprint/devices/${selectedItem.id}`
      
      await axios.delete(endpoint)
      await fetchData() // Refresh the list
      setDeleteModalOpen(false)
      setSelectedItem(null)
    } catch (error: any) {
      console.error('Error deleting item:', error)
      
      // Check if it's the specific error about associated logs
      if (error.response?.data?.error?.includes('associated logs')) {
        setError(error.response.data.error + ' You can deactivate the item instead.')
      } else {
        setError(error.response?.data?.error || 'Failed to delete item')
      }
    } finally {
      setDeleting(false)
    }
  }

  const handleAddTemplate = async () => {
    try {
      setAddTemplateLoading(true)
      setError(null)
      
      await axios.post('/api/fingerprint', {
        workerId: parseInt(newTemplateWorkerId),
        fingerPosition: newTemplateFingerPosition,
        hand: newTemplateHand,
        templateData: newTemplateData,
        qualityScore: newTemplateQualityScore,
        enrolledBy: 'System Admin',
        deviceUsed: 'Manual Entry'
      })
      
      setAddTemplateModalOpen(false)
      setNewTemplateWorkerId('')
      setNewTemplateData('')
      setNewTemplateFingerPosition('THUMB')
      setNewTemplateHand('RIGHT')
      setNewTemplateQualityScore(85)
      await fetchData()
    } catch (error: any) {
      console.error('Error adding template:', error)
      setError(error.response?.data?.error || 'Failed to add fingerprint template.')
    } finally {
      setAddTemplateLoading(false)
    }
  }

  const handleAddDevice = async () => {
    try {
      setAddDeviceLoading(true)
      setError(null)
      
      await axios.post('/api/fingerprint/devices', {
        deviceId: newDeviceDeviceId,
        deviceName: newDeviceName,
        siteId: newDeviceSiteId ? parseInt(newDeviceSiteId) : null,
        manufacturer: newDeviceManufacturer || null,
        model: newDeviceModel || null,
        serialNumber: newDeviceSerialNumber || null,
        firmwareVersion: newDeviceFirmwareVersion || null,
        ipAddress: newDeviceIpAddress || null,
        macAddress: newDeviceMacAddress || null,
        isOnline: newDeviceIsOnline,
        isActive: true
      })
      
      setAddDeviceModalOpen(false)
      setNewDeviceDeviceId('')
      setNewDeviceName('')
      setNewDeviceSiteId('')
      setNewDeviceManufacturer('')
      setNewDeviceModel('')
      setNewDeviceSerialNumber('')
      setNewDeviceFirmwareVersion('')
      setNewDeviceIpAddress('')
      setNewDeviceMacAddress('')
      setNewDeviceIsOnline(false)
      await fetchData()
    } catch (error: any) {
      console.error('Error adding device:', error)
      setError(error.response?.data?.error || 'Failed to add fingerprint device.')
    } finally {
      setAddDeviceLoading(false)
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
                    <h1 className="text-3xl font-bold tracking-tight">Fingerprint Management</h1>
                    <p className="text-muted-foreground">Manage fingerprint templates, devices, and logs</p>
                  </div>
                  <div className="flex gap-2">
                    <Button>
                      <IconPlus className="mr-2 h-4 w-4" />
                      Add Template
                    </Button>
                    <Button variant="outline">
                      <IconDeviceDesktop className="mr-2 h-4 w-4" />
                      Add Device
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-6">
                  <div className="relative flex-1 max-w-sm">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search..." 
                      className="pl-8" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                    <TabsTrigger value="devices">Devices</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                  </TabsList>

                  <TabsContent value="templates" className="mt-6">
                    <div className="rounded-md border">
                      {loading ? (
                        <div className="p-8 text-center">
                          <IconLoader className="h-8 w-8 animate-spin mx-auto mb-4" />
                          <p className="text-muted-foreground">Loading templates...</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Worker</TableHead>
                              <TableHead>Finger Position</TableHead>
                              <TableHead>Quality Score</TableHead>
                              <TableHead>Enrollment Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {templates
                              .filter(template => 
                                !searchTerm || 
                                template.worker.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                template.worker.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                template.worker.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
                              )
                              .map((template) => (
                              <TableRow key={template.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {template.worker.firstName} {template.worker.lastName}
                                    </div>
                                    <div className="text-sm text-muted-foreground font-mono">
                                      {template.worker.employeeId}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <IconFingerprint className="h-4 w-4" />
                                    {template.hand} {template.fingerPosition}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-blue-600 h-2 rounded-full" 
                                        style={{ width: `${template.qualityScore}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-medium">{template.qualityScore}%</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">{formatDate(template.enrollmentDate)}</span>
                                </TableCell>
                                <TableCell>
                                  <Badge className={template.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                    {template.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleViewItem(template, 'template')}
                                    >
                                      <IconEye className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleEditItem(template, 'template')}
                                    >
                                      <IconEdit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleDeleteItem(template, 'template')}
                                    >
                                      <IconTrash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="devices" className="mt-6">
                    <div className="rounded-md border">
                      {loading ? (
                        <div className="p-8 text-center">
                          <IconLoader className="h-8 w-8 animate-spin mx-auto mb-4" />
                          <p className="text-muted-foreground">Loading devices...</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Device</TableHead>
                              <TableHead>Site</TableHead>
                              <TableHead>IP Address</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Last Ping</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {devices
                              .filter(device => 
                                !searchTerm || 
                                device.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                device.deviceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                device.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
                              )
                              .map((device) => (
                              <TableRow key={device.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{device.deviceName}</div>
                                    <div className="text-sm text-muted-foreground font-mono">
                                      {device.deviceId}
                                    </div>
                                    {device.manufacturer && (
                                      <div className="text-xs text-muted-foreground">
                                        {device.manufacturer} {device.model}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {device.site ? (
                                    <div>
                                      <div className="font-medium">{device.site.siteName}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {device.site.siteCode}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">Not assigned</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm font-mono">{device.ipAddress || "N/A"}</span>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getDeviceStatusColor(device.isOnline, device.isActive)}>
                                    {device.isActive ? (device.isOnline ? "Online" : "Offline") : "Inactive"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">
                                    {device.lastPing ? formatDate(device.lastPing) : "Never"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleViewItem(device, 'device')}
                                    >
                                      <IconEye className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleEditItem(device, 'device')}
                                    >
                                      <IconEdit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleDeleteItem(device, 'device')}
                                    >
                                      <IconTrash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="logs" className="mt-6">
                    <div className="rounded-md border">
                      {loading ? (
                        <div className="p-8 text-center">
                          <IconLoader className="h-8 w-8 animate-spin mx-auto mb-4" />
                          <p className="text-muted-foreground">Loading logs...</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Timestamp</TableHead>
                              <TableHead>Device</TableHead>
                              <TableHead>Match Result</TableHead>
                              <TableHead>Score</TableHead>
                              <TableHead>Quality</TableHead>
                              <TableHead>Error</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {logs
                              .filter(log => 
                                !searchTerm || 
                                log.device?.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                log.matchResult.toLowerCase().includes(searchTerm.toLowerCase())
                              )
                              .map((log) => (
                              <TableRow key={log.id}>
                                <TableCell>
                                  <span className="text-sm">{formatDate(log.scanTimestamp)}</span>
                                </TableCell>
                                <TableCell>
                                  {log.device ? (
                                    <div>
                                      <div className="font-medium">{log.device.deviceName}</div>
                                      <div className="text-sm text-muted-foreground font-mono">
                                        {log.device.deviceId}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">Unknown</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getMatchResultColor(log.matchResult)}>
                                    {log.matchResult}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm font-medium">
                                    {log.matchScore ? `${log.matchScore}%` : "N/A"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">
                                    {log.scanQuality ? `${log.scanQuality}%` : "N/A"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {log.errorMessage ? (
                                    <span className="text-sm text-red-600">{log.errorMessage}</span>
                                  ) : (
                                    <span className="text-muted-foreground">None</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedItem?.type === 'template' ? 'Template' : 'Device'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {selectedItem?.type}? 
              This action cannot be undone.
              <br /><br />
              <strong>Note:</strong> If this {selectedItem?.type} has associated logs, deletion will be prevented. 
              In that case, you can deactivate the {selectedItem?.type} instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteItem}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : `Delete ${selectedItem?.type === 'template' ? 'Template' : 'Device'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Template Modal */}
      <Dialog open={addTemplateModalOpen} onOpenChange={setAddTemplateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Fingerprint Template</DialogTitle>
            <DialogDescription>
              Enroll a new fingerprint template for a worker.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="workerId" className="text-right">Worker</Label>
              <Select
                value={newTemplateWorkerId}
                onValueChange={setNewTemplateWorkerId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a worker" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map(worker => (
                    <SelectItem key={worker.id} value={worker.id.toString()}>
                      {worker.firstName} {worker.lastName} ({worker.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hand" className="text-right">Hand</Label>
              <Select
                value={newTemplateHand}
                onValueChange={setNewTemplateHand}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select hand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEFT">Left</SelectItem>
                  <SelectItem value="RIGHT">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fingerPosition" className="text-right">Finger Position</Label>
              <Select
                value={newTemplateFingerPosition}
                onValueChange={setNewTemplateFingerPosition}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select finger position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="THUMB">Thumb</SelectItem>
                  <SelectItem value="INDEX">Index</SelectItem>
                  <SelectItem value="MIDDLE">Middle</SelectItem>
                  <SelectItem value="RING">Ring</SelectItem>
                  <SelectItem value="PINKY">Pinky</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="qualityScore" className="text-right">Quality Score</Label>
              <Input
                id="qualityScore"
                type="number"
                min="0"
                max="100"
                value={newTemplateQualityScore}
                onChange={(e) => setNewTemplateQualityScore(parseInt(e.target.value) || 85)}
                className="col-span-3"
                placeholder="85"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="templateData" className="text-right">Template Data</Label>
              <textarea
                id="templateData"
                value={newTemplateData}
                onChange={(e) => setNewTemplateData(e.target.value)}
                className="col-span-3 min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter fingerprint template data (e.g., base64 encoded string)"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            {error && <p className="text-red-500 text-sm mb-2"><IconAlertTriangle className="inline-block h-4 w-4 mr-1" /> {error}</p>}
            <Button variant="outline" onClick={() => setAddTemplateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTemplate} disabled={addTemplateLoading || !newTemplateWorkerId || !newTemplateData}>
              {addTemplateLoading ? "Adding..." : "Add Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Device Modal */}
      <Dialog open={addDeviceModalOpen} onOpenChange={setAddDeviceModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Fingerprint Device</DialogTitle>
            <DialogDescription>
              Register a new fingerprint scanning device.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deviceId" className="text-right">Device ID</Label>
              <Input
                id="deviceId"
                value={newDeviceDeviceId}
                onChange={(e) => setNewDeviceDeviceId(e.target.value)}
                className="col-span-3"
                placeholder="e.g., FP-SITE001-ENTRANCE"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deviceName" className="text-right">Device Name</Label>
              <Input
                id="deviceName"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Main Entrance Scanner"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="siteId" className="text-right">Assigned Site</Label>
              <Select
                value={newDeviceSiteId}
                onValueChange={setNewDeviceSiteId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(site => (
                    <SelectItem key={site.id} value={site.id.toString()}>
                      {site.siteName} ({site.siteCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manufacturer" className="text-right">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={newDeviceManufacturer}
                onChange={(e) => setNewDeviceManufacturer(e.target.value)}
                className="col-span-3"
                placeholder="e.g., ZKTeco"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model" className="text-right">Model</Label>
              <Input
                id="model"
                value={newDeviceModel}
                onChange={(e) => setNewDeviceModel(e.target.value)}
                className="col-span-3"
                placeholder="e.g., iClock 680"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="serialNumber" className="text-right">Serial Number</Label>
              <Input
                id="serialNumber"
                value={newDeviceSerialNumber}
                onChange={(e) => setNewDeviceSerialNumber(e.target.value)}
                className="col-span-3"
                placeholder="e.g., ZK123456789"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firmwareVersion" className="text-right">Firmware Version</Label>
              <Input
                id="firmwareVersion"
                value={newDeviceFirmwareVersion}
                onChange={(e) => setNewDeviceFirmwareVersion(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 6.60.1.0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ipAddress" className="text-right">IP Address</Label>
              <Input
                id="ipAddress"
                value={newDeviceIpAddress}
                onChange={(e) => setNewDeviceIpAddress(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 192.168.1.100"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="macAddress" className="text-right">MAC Address</Label>
              <Input
                id="macAddress"
                value={newDeviceMacAddress}
                onChange={(e) => setNewDeviceMacAddress(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 00:0A:95:9D:68:16"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isOnline" className="text-right">Is Online</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isOnline"
                  checked={newDeviceIsOnline}
                  onChange={(e) => setNewDeviceIsOnline(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="isOnline" className="text-sm">Device is currently online</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            {error && <p className="text-red-500 text-sm mb-2"><IconAlertTriangle className="inline-block h-4 w-4 mr-1" /> {error}</p>}
            <Button variant="outline" onClick={() => setAddDeviceModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDevice} disabled={addDeviceLoading || !newDeviceDeviceId || !newDeviceName}>
              {addDeviceLoading ? "Adding..." : "Add Device"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </SidebarProvider>
  )
}
