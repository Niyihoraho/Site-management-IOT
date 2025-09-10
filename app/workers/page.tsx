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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { IconUsers, IconSearch, IconPlus, IconPhone, IconMail, IconBuilding, IconEdit, IconEye, IconRefresh, IconTrash, IconWallet, IconId, IconUser, IconCreditCard, IconDeviceMobile, IconAlertTriangle } from "@tabler/icons-react"
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
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

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

  const handleViewWorker = (worker: Worker) => {
    setSelectedWorker(worker)
    setViewModalOpen(true)
  }

  const handleEditWorker = (worker: Worker) => {
    setSelectedWorker(worker)
    setEditModalOpen(true)
  }

  const handleDeleteWorker = (worker: Worker) => {
    setSelectedWorker(worker)
    setDeleteModalOpen(true)
  }

  const confirmDeleteWorker = async () => {
    if (!selectedWorker) return

    try {
      setDeleting(true)
      await axios.delete(`/api/workers/${selectedWorker.id}`)
      await fetchWorkers() // Refresh the list
      setDeleteModalOpen(false)
      setSelectedWorker(null)
    } catch (error: any) {
      console.error('Error deleting worker:', error)
      
      // Check if it's the specific error about attendance/payroll records
      if (error.response?.data?.error?.includes('attendance records') || 
          error.response?.data?.error?.includes('payroll records')) {
        setError(error.response.data.error + ' You can deactivate the worker instead.')
      } else {
        setError(error.response?.data?.error || 'Failed to delete worker')
      }
    } finally {
      setDeleting(false)
    }
  }

  const deactivateWorker = async () => {
    if (!selectedWorker) return

    try {
      setDeactivating(true)
      await axios.put(`/api/workers/${selectedWorker.id}`, {
        status: 'INACTIVE'
      })
      await fetchWorkers() // Refresh the list
      setDeleteModalOpen(false)
      setSelectedWorker(null)
    } catch (error: any) {
      console.error('Error deactivating worker:', error)
      setError(error.response?.data?.error || 'Failed to deactivate worker')
    } finally {
      setDeactivating(false)
    }
  }

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

  const getPaymentMethodDisplay = (worker: Worker) => {
    switch (worker.preferredPaymentMethod) {
      case "BANK_TRANSFER":
        return { icon: IconCreditCard, text: "Bank Transfer", details: worker.bankAccount ? `${worker.bankName} - ${worker.bankAccount}` : "No bank details" }
      case "MOBILE_MONEY":
        return { icon: IconDeviceMobile, text: "Mobile Money", details: worker.mobileMoneyNumber ? `${worker.mobileMoneyProvider} - ${worker.mobileMoneyNumber}` : "No mobile money details" }
      case "AIRTEL_MONEY":
        return { icon: IconDeviceMobile, text: "Airtel Money", details: worker.airtelMoneyNumber ? `${worker.airtelMoneyProvider} - ${worker.airtelMoneyNumber}` : "No Airtel money details" }
      case "CASH":
        return { icon: IconWallet, text: "Cash", details: "Cash payment" }
      default:
        return { icon: IconWallet, text: "Unknown", details: "No payment method set" }
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
                          <TableHead>Rates</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Site</TableHead>
                          <TableHead>Payment Method</TableHead>
                          <TableHead>National ID</TableHead>
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
                          <TableHead>Rates</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Site</TableHead>
                          <TableHead>Payment Method</TableHead>
                          <TableHead>National ID</TableHead>
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
                              <div className="space-y-1">
                                <div className="font-medium">
                                  RWF {worker.dailyRate ? worker.dailyRate.toLocaleString() : '0'}/day
                                </div>
                                {worker.overtimeRate && (
                                  <div className="text-xs text-muted-foreground">
                                    OT: RWF {worker.overtimeRate.toLocaleString()}/hr
                                  </div>
                                )}
                                {worker.siteSpecificRate && (
                                  <div className="text-xs text-blue-600">
                                    Site: RWF {worker.siteSpecificRate.toLocaleString()}/day
                                  </div>
                                )}
                              </div>
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
                            <TableCell>
                              <div className="flex items-center text-sm">
                                {(() => {
                                  const paymentMethod = getPaymentMethodDisplay(worker)
                                  const IconComponent = paymentMethod.icon
                                  return (
                                    <>
                                      <IconComponent className="mr-1 h-3 w-3" />
                                      <span className="truncate max-w-[120px]" title={paymentMethod.details}>
                                        {paymentMethod.text}
                                      </span>
                                    </>
                                  )
                                })()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center text-sm">
                                <IconId className="mr-1 h-3 w-3" />
                                {worker.nationalId || "Not provided"}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewWorker(worker)}
                                  title="View Details"
                                >
                                  <IconEye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditWorker(worker)}
                                  title="Edit Worker"
                                >
                                  <IconEdit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteWorker(worker)}
                                  title="Delete Worker"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <IconTrash className="h-4 w-4" />
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

      {/* View Worker Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Worker Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedWorker?.firstName} {selectedWorker?.lastName}
            </DialogDescription>
          </DialogHeader>
          {selectedWorker && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Employee ID</label>
                  <p className="text-sm font-mono">{selectedWorker.employeeId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-sm">{selectedWorker.firstName} {selectedWorker.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">National ID</label>
                  <p className="text-sm">{selectedWorker.nationalId || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge className={getStatusColor(selectedWorker.status)}>
                    {selectedWorker.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {/* Job Information */}
              <div>
                <h3 className="text-lg font-medium mb-3">Job Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Job Type</label>
                    <Badge className={getJobTypeColor(selectedWorker.jobType)}>
                      {selectedWorker.jobType}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Assigned Site</label>
                    <p className="text-sm">{selectedWorker.site?.siteName || "No site assigned"}</p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="text-lg font-medium mb-3">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Daily Rate</label>
                    <p className="text-sm font-medium">RWF {selectedWorker.dailyRate?.toLocaleString() || '0'}/day</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Overtime Rate</label>
                    <p className="text-sm">RWF {selectedWorker.overtimeRate?.toLocaleString() || '0'}/hr</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Site Specific Rate</label>
                    <p className="text-sm">RWF {selectedWorker.siteSpecificRate?.toLocaleString() || '0'}/day</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Preferred Payment Method</label>
                    <div className="flex items-center">
                      {(() => {
                        const paymentMethod = getPaymentMethodDisplay(selectedWorker)
                        const IconComponent = paymentMethod.icon
                        return (
                          <>
                            <IconComponent className="mr-2 h-4 w-4" />
                            <span className="text-sm">{paymentMethod.text}</span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-sm">{selectedWorker.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm">{selectedWorker.email || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                    <p className="text-sm">{selectedWorker.emergencyContactName || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Emergency Phone</label>
                    <p className="text-sm">{selectedWorker.emergencyContactPhone || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Worker</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedWorker?.firstName} {selectedWorker?.lastName}? 
              This action cannot be undone.
              <br /><br />
              <strong>Note:</strong> If this worker has attendance or payroll records, deletion will be prevented. 
              In that case, you can deactivate the worker instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="secondary" 
              onClick={deactivateWorker}
              disabled={deactivating || deleting}
            >
              {deactivating ? "Deactivating..." : "Deactivate Instead"}
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteWorker}
              disabled={deleting || deactivating}
            >
              {deleting ? "Deleting..." : "Delete Worker"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
