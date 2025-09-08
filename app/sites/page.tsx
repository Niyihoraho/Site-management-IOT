"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { AddSiteModal } from "@/components/add-site-modal"
import { EditSiteModal } from "@/components/edit-site-modal"
import { ConfirmationModal } from "@/components/confirmation-modal"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconBuilding, IconMapPin, IconUsers, IconCalendar, IconEdit, IconEye, IconTrash, IconRefresh } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import axios from "axios"

// Site interface
interface Site {
  id: number
  siteCode: string
  siteName: string
  location: string
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'ON_HOLD'
  workers: number
  projectManager?: string
  contactPhone?: string
  workingHoursStart: string
  workingHoursEnd: string
  standardHoursPerDay: number
  overtimeRateMultiplier: number
  isActive: boolean
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

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchSites = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await axios.get<ApiResponse<Site[]>>('/api/sites?page=1&limit=50')
      
      if (response.data.success && response.data.data) {
        setSites(response.data.data)
      } else {
        setError(response.data.error || "Failed to fetch sites")
      }
    } catch (err: any) {
      console.error("Error fetching sites:", err)
      if (err.response) {
        const errorData = err.response.data as ApiResponse<any>
        setError(errorData?.error || err.message || "Failed to fetch sites")
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (site: Site) => {
    setSiteToDelete(site)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!siteToDelete) return

    setIsDeleting(true)
    
    try {
      const response = await axios.delete<ApiResponse<any>>(`/api/sites/${siteToDelete.id}`)
      
      if (response.data.success) {
        // Remove the site from the local state
        setSites(prev => prev.filter(site => site.id !== siteToDelete.id))
        setDeleteModalOpen(false)
        setSiteToDelete(null)
      } else {
        alert(response.data.error || "Failed to delete site")
      }
    } catch (err: any) {
      console.error("Error deleting site:", err)
      if (err.response) {
        const errorData = err.response.data as ApiResponse<any>
        alert(errorData?.error || err.message || "Failed to delete site")
      } else {
        alert("An unexpected error occurred")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    fetchSites()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800"
      case "ON_HOLD":
        return "bg-yellow-100 text-yellow-800"
      case "COMPLETED":
        return "bg-blue-100 text-blue-800"
      case "INACTIVE":
        return "bg-gray-100 text-gray-800"
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
                    <h1 className="text-3xl font-bold tracking-tight">Construction Sites</h1>
                    <p className="text-muted-foreground">Manage all construction sites and their details</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchSites} disabled={isLoading}>
                      <IconRefresh className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <AddSiteModal onSiteAdded={fetchSites}>
                      <Button>
                        <IconBuilding className="mr-2 h-4 w-4" />
                        Add New Site
                      </Button>
                    </AddSiteModal>
                  </div>
                </div>

                {error && (
                  <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md mb-6">
                    {error}
                  </div>
                )}

                {isLoading ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardHeader className="pb-3">
                          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : sites.length === 0 ? (
                  <div className="text-center py-12">
                    <IconBuilding className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No sites found</h3>
                    <p className="text-gray-500 mb-4">Get started by creating your first construction site.</p>
                    <AddSiteModal onSiteAdded={fetchSites}>
                      <Button>
                        <IconBuilding className="mr-2 h-4 w-4" />
                        Add New Site
                      </Button>
                    </AddSiteModal>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sites.map((site) => (
                      <Card key={site.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{site.siteName}</CardTitle>
                            <Badge className={getStatusColor(site.status)}>
                              {site.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <CardDescription className="text-sm font-mono">
                            {site.siteCode}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <IconMapPin className="mr-2 h-4 w-4" />
                            {site.location}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <IconUsers className="mr-2 h-4 w-4" />
                            {site.workers} workers assigned
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <IconCalendar className="mr-2 h-4 w-4" />
                            Created: {new Date(site.createdAt).toLocaleDateString()}
                          </div>
                          {site.projectManager && (
                            <div className="pt-2">
                              <p className="text-sm text-muted-foreground">
                                Manager: <span className="font-medium">{site.projectManager}</span>
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <IconEye className="mr-1 h-3 w-3" />
                              View
                            </Button>
                            <EditSiteModal site={site} onSiteUpdated={fetchSites}>
                              <Button variant="outline" size="sm" className="flex-1">
                                <IconEdit className="mr-1 h-3 w-3" />
                                Edit
                              </Button>
                            </EditSiteModal>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteClick(site)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <IconTrash className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
        title="Delete Site"
        description={`Are you sure you want to delete "${siteToDelete?.siteName}"? This action cannot be undone.`}
        confirmText="Delete Site"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </SidebarProvider>
  )
}
