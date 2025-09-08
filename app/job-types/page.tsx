"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { AddJobTypeModal } from "@/components/add-job-type-modal"
import { EditJobTypeModal } from "@/components/edit-job-type-modal"
import { ConfirmationModal } from "@/components/confirmation-modal"
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
import { IconBriefcase, IconRefresh, IconSearch, IconCurrencyDollar, IconClock, IconUsers, IconEdit, IconTrash } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import axios from "axios"

// JobType interface
interface JobType {
  id: number
  jobCode: string
  jobName: string
  description: string | null
  category: string | null
  baseDailyRate: number
  overtimeMultiplier: number
  isActive: boolean
  workers?: number
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

export default function JobTypesPage() {
  const [jobTypes, setJobTypes] = useState<JobType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [jobTypeToDelete, setJobTypeToDelete] = useState<JobType | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchJobTypes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await axios.get<ApiResponse<JobType[]>>('/api/job-types?page=1&limit=50')
      
      if (response.data.success && response.data.data) {
        setJobTypes(response.data.data)
      } else {
        setError(response.data.error || "Failed to fetch job types")
      }
    } catch (err: any) {
      console.error("Error fetching job types:", err)
      if (err.response) {
        const errorData = err.response.data as ApiResponse<any>
        setError(errorData?.error || err.message || "Failed to fetch job types")
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (jobType: JobType) => {
    setJobTypeToDelete(jobType)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!jobTypeToDelete) return

    setIsDeleting(true)
    
    try {
      const response = await axios.delete<ApiResponse<any>>(`/api/job-types/${jobTypeToDelete.id}`)
      
      if (response.data.success) {
        // Remove the job type from the local state
        setJobTypes(prev => prev.filter(jobType => jobType.id !== jobTypeToDelete.id))
        setDeleteModalOpen(false)
        setJobTypeToDelete(null)
      } else {
        alert(response.data.error || "Failed to delete job type")
      }
    } catch (err: any) {
      console.error("Error deleting job type:", err)
      if (err.response) {
        const errorData = err.response.data as ApiResponse<any>
        alert(errorData?.error || err.message || "Failed to delete job type")
      } else {
        alert("An unexpected error occurred")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = (jobType: JobType) => {
    // Edit functionality is now handled by EditJobTypeModal
    console.log("Edit job type:", jobType)
  }

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case "SKILLED":
        return "bg-blue-100 text-blue-800"
      case "UNSKILLED":
        return "bg-gray-100 text-gray-800"
      case "SUPERVISORY":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800"
  }

  // Filter job types based on search term
  const filteredJobTypes = jobTypes.filter(jobType =>
    jobType.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jobType.jobCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (jobType.description && jobType.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  useEffect(() => {
    fetchJobTypes()
  }, [])

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
                    <h1 className="text-3xl font-bold tracking-tight">Job Types</h1>
                    <p className="text-muted-foreground">Manage job types and their salary rates</p>
                  </div>
                  <AddJobTypeModal onJobTypeAdded={fetchJobTypes}>
                    <Button>
                      <IconBriefcase className="mr-2 h-4 w-4" />
                      Add New Job Type
                    </Button>
                  </AddJobTypeModal>
                </div>

                <div className="flex items-center space-x-2 mb-6">
                  <div className="relative flex-1 max-w-sm">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search job types..." 
                      className="pl-8" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" onClick={fetchJobTypes}>
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
                          <TableHead>Job Type</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Daily Rate</TableHead>
                          <TableHead>Overtime</TableHead>
                          <TableHead>Workers</TableHead>
                          <TableHead>Status</TableHead>
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
                ) : filteredJobTypes.length === 0 ? (
                  <div className="text-center py-12">
                    <IconBriefcase className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {searchTerm ? "No job types found matching your search" : "No job types found"}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm ? "Try adjusting your search terms" : "Get started by adding a new job type."}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job Type</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Daily Rate</TableHead>
                          <TableHead>Overtime</TableHead>
                          <TableHead>Workers</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredJobTypes.map((jobType) => (
                          <TableRow key={jobType.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{jobType.jobName}</div>
                                <div className="text-sm text-muted-foreground font-mono">
                                  {jobType.jobCode}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {jobType.category ? (
                                <Badge className={getCategoryColor(jobType.category)}>
                                  {jobType.category}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <IconCurrencyDollar className="mr-1 h-4 w-4" />
                                <span className="font-medium">
                                  RWF {jobType.baseDailyRate.toLocaleString()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <IconClock className="mr-1 h-4 w-4" />
                                <span>{jobType.overtimeMultiplier}x</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <IconUsers className="mr-1 h-4 w-4" />
                                <span>{jobType.workers || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(jobType.isActive)}>
                                {jobType.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <EditJobTypeModal jobType={jobType} onJobTypeUpdated={fetchJobTypes}>
                                  <Button variant="outline" size="sm">
                                    <IconEdit className="h-4 w-4" />
                                  </Button>
                                </EditJobTypeModal>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteClick(jobType)}
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
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete Job Type"
        description={`Are you sure you want to delete "${jobTypeToDelete?.jobName}"? This action cannot be undone.`}
        confirmText="Delete Job Type"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </SidebarProvider>
  )
}

