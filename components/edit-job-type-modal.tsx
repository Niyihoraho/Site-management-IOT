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
import { IconEdit, IconBriefcase, IconCurrencyDollar, IconClock, IconTag } from "@tabler/icons-react"
import { updateJobTypeSchema, UpdateJobTypeInput } from "@/app/api/validation/job-type"
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

interface EditJobTypeModalProps {
  children: React.ReactNode
  jobType: JobType
  onJobTypeUpdated?: () => void
}

export function EditJobTypeModal({ children, jobType, onJobTypeUpdated }: EditJobTypeModalProps) {
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [formData, setFormData] = React.useState<UpdateJobTypeInput>({
    id: 0,
    jobCode: '',
    jobName: '',
    description: '',
    category: '',
    baseDailyRate: 0,
    overtimeMultiplier: 1.5,
    isActive: true
  })

  // Update form data when jobType prop changes or modal opens
  React.useEffect(() => {
    if (open && jobType) {
      console.log("Updating form data with jobType:", jobType)
      const newFormData = {
        id: jobType.id,
        jobCode: jobType.jobCode,
        jobName: jobType.jobName,
        description: jobType.description || '',
        category: jobType.category || '',
        baseDailyRate: jobType.baseDailyRate,
        overtimeMultiplier: jobType.overtimeMultiplier,
        isActive: jobType.isActive
      }
      console.log("Setting form data to:", newFormData)
      setFormData(newFormData)
      setErrors({}) // Clear any previous errors
    }
  }, [jobType, open])

  const handleInputChange = (field: keyof UpdateJobTypeInput, value: string | number | boolean) => {
    console.log(`Input change - Field: ${field}, Value: ${value}`)
    
    // Convert string numbers to actual numbers for specific fields
    let processedValue = value
    if (field === 'baseDailyRate' || field === 'overtimeMultiplier') {
      if (typeof value === 'string') {
        processedValue = parseFloat(value) || 0
      }
    }
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: processedValue
      }
      console.log("Updated form data:", newData)
      return newData
    })
    
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
      updateJobTypeSchema.parse(formData)
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
    
    console.log("Form submitted with data:", formData)
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      console.log("Sending PUT request to:", `/api/job-types/${jobType.id}`)
      console.log("Request payload:", formData)
      const response = await axios.put(`/api/job-types/${jobType.id}`, formData)
      
      if (response.data.success) {
        // Clear errors and close modal
        setErrors({})
        setOpen(false)
        
        // Call the callback to refresh the job types list
        if (onJobTypeUpdated) {
          onJobTypeUpdated()
        }
      } else {
        // Handle API errors
        if (response.data.details) {
          setErrors({ general: response.data.details })
        } else {
          setErrors({ general: response.data.error || "Failed to update job type" })
        }
      }
    } catch (error: any) {
      console.error("Error updating job type:", error)
      if (error.response) {
        const errorData = error.response.data
        setErrors({ general: errorData?.error || error.message || "Failed to update job type" })
      } else {
        setErrors({ general: "An unexpected error occurred" })
      }
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
                <IconEdit className="h-6 w-6 text-primary" />
              </div>
              Edit Job Type
            </SheetTitle>
            <SheetDescription className="text-lg text-muted-foreground">
              Update the job type information and salary rates.
            </SheetDescription>
          </SheetHeader>
          
          <Card className="shadow-lg">
            <CardHeader className="pb-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Job Type Information</h3>
                <p className="text-sm text-muted-foreground">Update the details below to modify the job type</p>
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
                    <Label htmlFor="jobCode" className="text-sm font-medium">Job Code *</Label>
                    <Input
                      id="jobCode"
                      placeholder="MASON-001"
                      className="h-11 font-mono"
                      value={formData.jobCode}
                      onChange={(e) => handleInputChange("jobCode", e.target.value)}
                      required
                    />
                    {errors.jobCode && <p className="text-sm text-red-600">{errors.jobCode}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobName" className="text-sm font-medium">Job Name *</Label>
                    <div className="relative">
                      <IconBriefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="jobName"
                        placeholder="Enter job name"
                        className="pl-10 h-11"
                        value={formData.jobName}
                        onChange={(e) => handleInputChange("jobName", e.target.value)}
                        required
                      />
                    </div>
                    {errors.jobName && <p className="text-sm text-red-600">{errors.jobName}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Input
                    id="description"
                    placeholder="Enter job description"
                    className="h-11"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                  />
                  {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                  <div className="relative">
                    <IconTag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger className="pl-10 h-11">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SKILLED">Skilled</SelectItem>
                        <SelectItem value="UNSKILLED">Unskilled</SelectItem>
                        <SelectItem value="SUPERVISORY">Supervisory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.category && <p className="text-sm text-red-600">{errors.category}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="baseDailyRate" className="text-sm font-medium">Base Daily Rate *</Label>
                    <div className="relative">
                      <IconCurrencyDollar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="baseDailyRate"
                        type="number"
                        step="100"
                        min="0"
                        placeholder="15000"
                        className="pl-10 h-11"
                        value={formData.baseDailyRate}
                        onChange={(e) => handleInputChange("baseDailyRate", parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    {errors.baseDailyRate && <p className="text-sm text-red-600">{errors.baseDailyRate}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overtimeMultiplier" className="text-sm font-medium">Overtime Multiplier</Label>
                    <div className="relative">
                      <IconClock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="overtimeMultiplier"
                        type="number"
                        step="0.1"
                        min="1.0"
                        max="5.0"
                        placeholder="1.5"
                        className="pl-10 h-11"
                        value={formData.overtimeMultiplier}
                        onChange={(e) => handleInputChange("overtimeMultiplier", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    {errors.overtimeMultiplier && <p className="text-sm text-red-600">{errors.overtimeMultiplier}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isActive" className="text-sm font-medium">Status</Label>
                  <Select value={formData.isActive ? "true" : "false"} onValueChange={(value) => handleInputChange("isActive", value === "true")}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.isActive && <p className="text-sm text-red-600">{errors.isActive}</p>}
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
                      "Updating..."
                    ) : (
                      <>
                        <IconEdit className="mr-2 h-4 w-4" />
                        Update Job Type
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
