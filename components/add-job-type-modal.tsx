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
import { IconPlus, IconBriefcase, IconCurrencyDollar, IconClock, IconRefresh } from "@tabler/icons-react"
import { createJobTypeSchema, CreateJobTypeInput } from "@/app/api/validation/job-type"

interface AddJobTypeModalProps {
  children: React.ReactNode
  onJobTypeAdded?: () => void
}

// Function to generate job code with format JT-YYYYMMDD-001
const generateJobCode = (): string => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  
  return `JT-${year}${month}${day}-001`
}

export function AddJobTypeModal({ children, onJobTypeAdded }: AddJobTypeModalProps) {
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [formData, setFormData] = React.useState<CreateJobTypeInput>({
    jobCode: generateJobCode(),
    jobName: "",
    description: "",
    category: null,
    baseDailyRate: 0,
    overtimeMultiplier: 1.5,
    isActive: true
  })

  const handleInputChange = (field: keyof CreateJobTypeInput, value: string | number | boolean | null) => {
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
      createJobTypeSchema.parse(formData)
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
      const response = await fetch('/api/job-types', {
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
          jobCode: generateJobCode(),
          jobName: "",
          description: "",
          category: null,
          baseDailyRate: 0,
          overtimeMultiplier: 1.5,
          isActive: true
        })
        setErrors({})
        setOpen(false)
        
        // Call the callback to refresh the job types list
        if (onJobTypeAdded) {
          onJobTypeAdded()
        }
      } else {
        // Handle API errors
        if (data.details) {
          setErrors({ general: data.details })
        } else {
          setErrors({ general: data.error || "Failed to create job type" })
        }
      }
    } catch (error) {
      console.error("Error creating job type:", error)
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
                <IconBriefcase className="h-6 w-6 text-primary" />
              </div>
              Add New Job Type
            </SheetTitle>
            <SheetDescription className="text-lg text-muted-foreground">
              Add a new job type with salary rates and category information.
            </SheetDescription>
          </SheetHeader>
          
          <Card className="shadow-lg">
            <CardHeader className="pb-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Job Type Information</h3>
                <p className="text-sm text-muted-foreground">Fill in the details below to add a new job type</p>
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
                      placeholder="JT-20241201-001"
                      className="h-11 font-mono bg-muted"
                      value={formData.jobCode}
                      onChange={(e) => handleInputChange("jobCode", e.target.value)}
                      required
                      readOnly
                    />
                    <p className="text-xs text-muted-foreground">Auto-generated based on today's date</p>
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
                    placeholder="Brief description of the job type"
                    className="h-11"
                    value={formData.description || ""}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                  />
                  {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                  <Select
                    value={formData.category || ""}
                    onValueChange={(value) => handleInputChange("category", value || null)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select job category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SKILLED">Skilled</SelectItem>
                      <SelectItem value="UNSKILLED">Unskilled</SelectItem>
                      <SelectItem value="SUPERVISORY">Supervisory</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-sm text-red-600">{errors.category}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="baseDailyRate" className="text-sm font-medium flex items-center gap-2">
                      <IconCurrencyDollar className="h-4 w-4" />
                      Base Daily Rate (RWF) *
                    </Label>
                    <Input
                      id="baseDailyRate"
                      type="number"
                      min="0"
                      step="100"
                      placeholder="5000"
                      className="h-11"
                      value={formData.baseDailyRate}
                      onChange={(e) => handleInputChange("baseDailyRate", parseFloat(e.target.value) || 0)}
                      required
                    />
                    {errors.baseDailyRate && <p className="text-sm text-red-600">{errors.baseDailyRate}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overtimeMultiplier" className="text-sm font-medium flex items-center gap-2">
                      <IconClock className="h-4 w-4" />
                      Overtime Multiplier *
                    </Label>
                    <Input
                      id="overtimeMultiplier"
                      type="number"
                      min="1.0"
                      max="5.0"
                      step="0.1"
                      placeholder="1.5"
                      className="h-11"
                      value={formData.overtimeMultiplier}
                      onChange={(e) => handleInputChange("overtimeMultiplier", parseFloat(e.target.value) || 1.5)}
                      required
                    />
                    {errors.overtimeMultiplier && <p className="text-sm text-red-600">{errors.overtimeMultiplier}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isActive" className="text-sm font-medium">Status</Label>
                  <Select
                    value={formData.isActive ? "true" : "false"}
                    onValueChange={(value) => handleInputChange("isActive", value === "true")}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
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
                        Add Job Type
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