"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { IconPlus, IconBuilding, IconMapPin, IconUsers, IconCalendar, IconUser } from "@tabler/icons-react"
import { createSiteSchema, CreateSiteInput } from "@/app/api/validation/site"

// Function to generate site code with format KIG-YYYYMMDD-001
const generateSiteCode = (): string => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  
  return `KIG-${year}${month}${day}-001`
}

interface AddSiteModalProps {
  children: React.ReactNode
  onSiteAdded?: () => void
}

export function AddSiteModal({ children, onSiteAdded }: AddSiteModalProps) {
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [formData, setFormData] = React.useState<CreateSiteInput>({
    siteCode: generateSiteCode(),
    siteName: "",
    province: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
    projectManager: "",
    contactPhone: "",
    workingHoursStart: "08:00",
    workingHoursEnd: "17:00",
    standardHoursPerDay: 8.0,
    overtimeRateMultiplier: 1.5,
    status: "ACTIVE",
    isActive: true
  })

  const handleInputChange = (field: keyof CreateSiteInput, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }))
    }
  }

  const validateForm = (): boolean => {
    try {
      createSiteSchema.parse(formData)
      setErrors({})
      return true
    } catch (error: any) {
      const newErrors: Record<string, string> = {}
      if (error.errors) {
        error.errors.forEach((err: any) => {
          newErrors[err.path[0]] = err.message
        })
      }
      setErrors(newErrors)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      const data = await response.json()
      
      if (data.success) {
        // Reset form and close modal
        setFormData({
          siteCode: generateSiteCode(),
          siteName: "",
          province: "",
          district: "",
          sector: "",
          cell: "",
          village: "",
          projectManager: "",
          contactPhone: "",
          workingHoursStart: "08:00",
          workingHoursEnd: "17:00",
          standardHoursPerDay: 8.0,
          overtimeRateMultiplier: 1.5,
          status: "ACTIVE",
          isActive: true
        })
        setErrors({})
        setOpen(false)
        
        // Call the callback to refresh the sites list
        if (onSiteAdded) {
          onSiteAdded()
        }
      } else {
        // Handle API errors
        if (data.details) {
          setErrors({ general: data.details })
        } else {
          setErrors({ general: data.error || "Failed to create site" })
        }
      }
    } catch (error) {
      console.error("Error creating site:", error)
      setErrors({ general: "An unexpected error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="top" className="h-full w-full max-w-none overflow-y-auto">
        <div className="container mx-auto max-w-2xl py-8">
          <SheetHeader className="pb-8 text-center">
            <SheetTitle className="flex items-center justify-center gap-3 text-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <IconBuilding className="h-6 w-6 text-primary" />
              </div>
              Add New Site
            </SheetTitle>
            <SheetDescription className="text-lg text-muted-foreground">
              Add a new construction site to the management system.
            </SheetDescription>
          </SheetHeader>
          
          <Card className="shadow-lg">
            <CardHeader className="pb-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Site Information</h3>
                <p className="text-sm text-muted-foreground">Fill in the details below to add a new construction site</p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {errors.general && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {errors.general}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteCode" className="text-sm font-medium">Site Code *</Label>
                    <Input
                      id="siteCode"
                      placeholder="KIG-20241201-001"
                      className="h-11 font-mono bg-muted"
                      value={formData.siteCode}
                      onChange={(e) => handleInputChange("siteCode", e.target.value)}
                      required
                      readOnly
                    />
                    <p className="text-xs text-muted-foreground">Auto-generated based on today's date</p>
                    {errors.siteCode && <p className="text-sm text-red-600">{errors.siteCode}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteName" className="text-sm font-medium">Site Name *</Label>
                    <div className="relative">
                      <IconBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="siteName"
                        placeholder="Enter site name"
                        className="pl-10 h-11"
                        value={formData.siteName}
                        onChange={(e) => handleInputChange("siteName", e.target.value)}
                        required
                      />
                    </div>
                    {errors.siteName && <p className="text-sm text-red-600">{errors.siteName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="province" className="text-sm font-medium">Province *</Label>
                    <Input
                      id="province"
                      placeholder="Kigali"
                      className="h-11"
                      value={formData.province}
                      onChange={(e) => handleInputChange("province", e.target.value)}
                      required
                    />
                    {errors.province && <p className="text-sm text-red-600">{errors.province}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district" className="text-sm font-medium">District *</Label>
                    <Input
                      id="district"
                      placeholder="Nyarugenge"
                      className="h-11"
                      value={formData.district}
                      onChange={(e) => handleInputChange("district", e.target.value)}
                      required
                    />
                    {errors.district && <p className="text-sm text-red-600">{errors.district}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sector" className="text-sm font-medium">Sector *</Label>
                    <Input
                      id="sector"
                      placeholder="Kacyiru"
                      className="h-11"
                      value={formData.sector}
                      onChange={(e) => handleInputChange("sector", e.target.value)}
                      required
                    />
                    {errors.sector && <p className="text-sm text-red-600">{errors.sector}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cell" className="text-sm font-medium">Cell *</Label>
                    <Input
                      id="cell"
                      placeholder="Kacyiru"
                      className="h-11"
                      value={formData.cell}
                      onChange={(e) => handleInputChange("cell", e.target.value)}
                      required
                    />
                    {errors.cell && <p className="text-sm text-red-600">{errors.cell}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="village" className="text-sm font-medium">Village *</Label>
                  <div className="relative">
                    <IconMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="village"
                      placeholder="Enter village name"
                      className="pl-10 h-11"
                      value={formData.village}
                      onChange={(e) => handleInputChange("village", e.target.value)}
                      required
                    />
                  </div>
                  {errors.village && <p className="text-sm text-red-600">{errors.village}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectManager" className="text-sm font-medium">Project Manager</Label>
                    <div className="relative">
                      <IconUser className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="projectManager"
                        placeholder="Enter manager name"
                        className="pl-10 h-11"
                        value={formData.projectManager || ""}
                        onChange={(e) => handleInputChange("projectManager", e.target.value)}
                      />
                    </div>
                    {errors.projectManager && <p className="text-sm text-red-600">{errors.projectManager}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone" className="text-sm font-medium">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      placeholder="+250 788 123 456"
                      className="h-11"
                      value={formData.contactPhone || ""}
                      onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                    />
                    {errors.contactPhone && <p className="text-sm text-red-600">{errors.contactPhone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workingHoursStart" className="text-sm font-medium">Working Hours Start</Label>
                    <div className="relative">
                      <IconCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="workingHoursStart"
                        type="time"
                        className="pl-10 h-11"
                        value={formData.workingHoursStart}
                        onChange={(e) => handleInputChange("workingHoursStart", e.target.value)}
                      />
                    </div>
                    {errors.workingHoursStart && <p className="text-sm text-red-600">{errors.workingHoursStart}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workingHoursEnd" className="text-sm font-medium">Working Hours End</Label>
                    <div className="relative">
                      <IconCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="workingHoursEnd"
                        type="time"
                        className="pl-10 h-11"
                        value={formData.workingHoursEnd}
                        onChange={(e) => handleInputChange("workingHoursEnd", e.target.value)}
                      />
                    </div>
                    {errors.workingHoursEnd && <p className="text-sm text-red-600">{errors.workingHoursEnd}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="standardHoursPerDay" className="text-sm font-medium">Standard Hours Per Day</Label>
                    <Input
                      id="standardHoursPerDay"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="24"
                      placeholder="8.0"
                      className="h-11"
                      value={formData.standardHoursPerDay}
                      onChange={(e) => handleInputChange("standardHoursPerDay", parseFloat(e.target.value) || 0)}
                    />
                    {errors.standardHoursPerDay && <p className="text-sm text-red-600">{errors.standardHoursPerDay}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overtimeRateMultiplier" className="text-sm font-medium">Overtime Rate Multiplier</Label>
                    <Input
                      id="overtimeRateMultiplier"
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="5.0"
                      placeholder="1.5"
                      className="h-11"
                      value={formData.overtimeRateMultiplier}
                      onChange={(e) => handleInputChange("overtimeRateMultiplier", parseFloat(e.target.value) || 0)}
                    />
                    {errors.overtimeRateMultiplier && <p className="text-sm text-red-600">{errors.overtimeRateMultiplier}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-sm text-red-600">{errors.status}</p>}
                </div>

                <div className="flex gap-3 pt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 h-11" 
                    onClick={() => setOpen(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 h-11" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Creating..."
                    ) : (
                      <>
                        <IconPlus className="mr-2 h-4 w-4" />
                        Add Site
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
}
