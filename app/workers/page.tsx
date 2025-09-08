"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { AddWorkerModal } from "@/components/add-worker-modal"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { IconUsers, IconSearch, IconPlus, IconPhone, IconMail, IconBuilding, IconEdit, IconEye, IconRefresh } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import axios from "axios"

// Worker interface
interface Worker {
  id: number
  employeeId: string
  firstName: string
  lastName: string
  phone: string | null
  email: string | null
  nationalId: string | null
  jobType: string
  jobTypeId: number
  dailyRate: number
  overtimeRate: number | null
  siteSpecificRate: number | null
  status: string
  bankAccount: string | null
  bankName: string | null
  mobileMoneyNumber: string | null
  mobileMoneyProvider: string | null
  airtelMoneyNumber: string | null
  airtelMoneyProvider: string | null
  preferredPaymentMethod: string
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  assignedSiteId: number
  site: {
    id: number
    siteName: string
    siteCode: string
  } | null
  createdAt: string
  updatedAt: string
}

// API Response interfaces
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchWorkers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await axios.get<ApiResponse<Worker[]>>('/api/workers?page=1&limit=50')
      
      if (response.data.success && response.data.data) {
        setWorkers(response.data.data)
      } else {
        setError(response.data.error || "Failed to fetch workers")
      }
    } catch (err: any) {
      console.error("Error fetching workers:", err)
      if (err.response) {
        const errorData = err.response.data as ApiResponse<any>
        setError(errorData?.error || err.message || "Failed to fetch workers")
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkers()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800"
      case "ON_LEAVE":
        return "bg-yellow-100 text-yellow-800"
      case "INACTIVE":
        return "bg-gray-100 text-gray-800"
      case "TERMINATED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getJobTypeColor = (jobType: string) => {
    switch (jobType) {
      case "SUPERVISOR":
        return "bg-purple-100 text-purple-800"
      case "MASON":
        return "bg-blue-100 text-blue-800"
      case "CARPENTER":
        return "bg-orange-100 text-orange-800"
      case "ELECTRICIAN":
        return "bg-yellow-100 text-yellow-800"
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
                    <h1 className="text-3xl font-bold tracking-tight">Workers</h1>
                    <p className="text-muted-foreground">Manage all construction workers and their information</p>
                  </div>
                  <AddWorkerModal onWorkerAdded={fetchWorkers}>
                    <Button>
                      <IconPlus className="mr-2 h-4 w-4" />
                      Add New Worker
                    </Button>
                  </AddWorkerModal>
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
                  <Button variant="outline" onClick={fetchWorkers}>
                    <IconRefresh className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>

                {error && (
                  <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}

                {isLoading ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Job Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Daily Rate</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Site</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...Array(3)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : workers.length === 0 ? (
                  <div className="text-center py-12">
                    <IconUsers className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No workers found</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by adding a new worker.</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Job Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Daily Rate</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Site</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workers.map((worker) => (
                          <TableRow key={worker.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {worker.firstName} {worker.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground font-mono">
                                  {worker.employeeId}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getJobTypeColor(worker.jobType)}>
                                {worker.jobType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(worker.status)}>
                                {worker.status.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                RWF {worker.dailyRate ? worker.dailyRate.toLocaleString() : '0'}/day
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {worker.phone && (
                                  <div className="flex items-center text-sm">
                                    <IconPhone className="mr-1 h-3 w-3" />
                                    {worker.phone}
                                  </div>
                                )}
                                {worker.email && (
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <IconMail className="mr-1 h-3 w-3" />
                                    {worker.email}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center text-sm">
                                <IconBuilding className="mr-1 h-3 w-3" />
                                {worker.site?.siteName || "No site assigned"}
                              </div>
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
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
