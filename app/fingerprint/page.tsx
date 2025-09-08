"use client"

import { useState, useEffect } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconFingerprint, IconSearch, IconPlus, IconEdit, IconTrash, IconEye, IconDeviceDesktop, IconUser, IconLoader, IconCheck, IconX } from "@tabler/icons-react"

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

export default function FingerprintPage() {
  const [templates, setTemplates] = useState<FingerprintTemplate[]>([])
  const [devices, setDevices] = useState<FingerprintDevice[]>([])
  const [logs, setLogs] = useState<FingerprintLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState("templates")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [templatesRes, devicesRes, logsRes] = await Promise.all([
        fetch('/api/fingerprint'),
        fetch('/api/fingerprint/devices'),
        fetch('/api/fingerprint/logs')
      ])

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json()
        setTemplates(templatesData.data || [])
      }

      if (devicesRes.ok) {
        const devicesData = await devicesRes.json()
        setDevices(devicesData.data || [])
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json()
        setLogs(logsData.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
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
                                    <Button variant="outline" size="sm">
                                      <IconEye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <IconEdit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm">
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
                                    <Button variant="outline" size="sm">
                                      <IconEye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <IconEdit className="h-4 w-4" />
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
    </SidebarProvider>
  )
}
