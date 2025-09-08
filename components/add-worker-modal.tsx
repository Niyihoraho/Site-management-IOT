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
import { IconPlus, IconUser, IconPhone, IconMail, IconId, IconBuilding, IconCreditCard, IconWallet, IconUserCheck, IconRefresh } from "@tabler/icons-react"
import { createWorkerSchema, CreateWorkerInput } from "@/app/api/validation/worker"

interface AddWorkerModalProps {
  children: React.ReactNode
  onWorkerAdded?: () => void
}

// Function to generate employee ID with format EMP-YYYYMMDD-001
const generateEmployeeId = (): string => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  
  return `EMP-${year}${month}${day}-001`
}

export function AddWorkerModal({ children, onWorkerAdded }: AddWorkerModalProps) {
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [sites, setSites] = React.useState<any[]>([])
  const [jobTypes, setJobTypes] = React.useState<any[]>([])
  const [formData, setFormData] = React.useState<CreateWorkerInput>({
    employeeId: generateEmployeeId(),
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    nationalId: "",
    status: "ACTIVE",
    bankAccount: "",
    bankName: "",
    mobileMoneyNumber: "",
    mobileMoneyProvider: null,
    airtelMoneyNumber: "",
    airtelMoneyProvider: null,
    preferredPaymentMethod: "BANK_TRANSFER",
    emergencyContactName: "",
    emergencyContactPhone: "",
    assignedSiteId: 0,
    jobTypeId: 0
  })

  // Fetch sites for the dropdown
  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites?page=1&limit=100')
      const data = await response.json()
      if (data.success && data.data) {
        setSites(data.data)
      }
    } catch (error) {
      console.error("Error fetching sites:", error)
    }
  }

  // Fetch job types for the dropdown
  const fetchJobTypes = async () => {
    try {
      const response = await fetch('/api/job-types?page=1&limit=100')
      const data = await response.json()
      if (data.success && data.data) {
        setJobTypes(data.data)
      }
    } catch (error) {
      console.error("Error fetching job types:", error)
    }
  }

  React.useEffect(() => {
    if (open) {
      fetchSites()
      fetchJobTypes()
    }
  }, [open])

  const handleInputChange = (field: keyof CreateWorkerInput, value: string | number | boolean | null) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      }
      
      // Clear payment fields when switching payment methods
      if (field === "preferredPaymentMethod") {
        newData.bankAccount = ""
        newData.bankName = ""
        newData.mobileMoneyNumber = ""
        newData.mobileMoneyProvider = null
        newData.airtelMoneyNumber = ""
        newData.airtelMoneyProvider = null
      }
      
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
      createWorkerSchema.parse(formData)
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
      const response = await fetch('/api/workers', {
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
          employeeId: generateEmployeeId(),
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          nationalId: "",
          status: "ACTIVE",
          bankAccount: "",
          bankName: "",
          mobileMoneyNumber: "",
          mobileMoneyProvider: null,
          airtelMoneyNumber: "",
          airtelMoneyProvider: null,
          preferredPaymentMethod: "BANK_TRANSFER",
          emergencyContactName: "",
          emergencyContactPhone: "",
          assignedSiteId: 0,
          jobTypeId: 0
        })
        setErrors({})
        setOpen(false)
        
        // Call the callback to refresh the workers list
        if (onWorkerAdded) {
          onWorkerAdded()
        }
      } else {
        // Handle API errors
        if (data.details) {
          setErrors({ general: data.details })
        } else {
          setErrors({ general: data.error || "Failed to create worker" })
        }
      }
    } catch (error) {
      console.error("Error creating worker:", error)
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
        <div className="container mx-auto max-w-4xl py-8">
          <SheetHeader className="pb-8 text-center">
            <SheetTitle className="flex items-center justify-center gap-3 text-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <IconUser className="h-6 w-6 text-primary" />
              </div>
              Add New Worker
            </SheetTitle>
            <SheetDescription className="text-lg text-muted-foreground">
              Add a new construction worker to the management system.
            </SheetDescription>
          </SheetHeader>
          
          <Card className="shadow-lg">
            <CardHeader className="pb-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Worker Information</h3>
                <p className="text-sm text-muted-foreground">Fill in the details below to add a new worker</p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {errors.general && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {errors.general}
                  </div>
                )}

                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-primary border-b pb-2">Basic Information</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employeeId" className="text-sm font-medium">Employee ID *</Label>
                      <Input
                        id="employeeId"
                        placeholder="EMP-20241201-001"
                        className="h-11 font-mono bg-muted"
                        value={formData.employeeId}
                        onChange={(e) => handleInputChange("employeeId", e.target.value)}
                        required
                        readOnly
                      />
                      <p className="text-xs text-muted-foreground">Auto-generated based on today's date</p>
                      {errors.employeeId && <p className="text-sm text-red-600">{errors.employeeId}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nationalId" className="text-sm font-medium">National ID</Label>
                      <div className="relative">
                        <IconId className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="nationalId"
                          placeholder="Enter national ID"
                          className="pl-10 h-11"
                          value={formData.nationalId || ""}
                          onChange={(e) => handleInputChange("nationalId", e.target.value)}
                        />
                      </div>
                      {errors.nationalId && <p className="text-sm text-red-600">{errors.nationalId}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium">First Name *</Label>
                      <div className="relative">
                        <IconUser className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          placeholder="Enter first name"
                          className="pl-10 h-11"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          required
                        />
                      </div>
                      {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">Last Name *</Label>
                      <div className="relative">
                        <IconUser className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="lastName"
                          placeholder="Enter last name"
                          className="pl-10 h-11"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          required
                        />
                      </div>
                      {errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                      <div className="relative">
                        <IconPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          placeholder="+250 788 123 456"
                          className="pl-10 h-11"
                          value={formData.phone || ""}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                        />
                      </div>
                      {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <div className="relative">
                        <IconMail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="worker@email.com"
                          className="pl-10 h-11"
                          value={formData.email || ""}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                        />
                      </div>
                      {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                    </div>
                  </div>
                </div>

                {/* Job Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-primary border-b pb-2">Job Information</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTypeId" className="text-sm font-medium">Job Type *</Label>
                      <Select value={formData.jobTypeId.toString()} onValueChange={(value) => handleInputChange("jobTypeId", parseInt(value))}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobTypes.map((jobType) => (
                            <SelectItem key={jobType.id} value={jobType.id.toString()}>
                              {jobType.jobName} - RWF {jobType.baseDailyRate?.toLocaleString()}/day
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.jobTypeId && <p className="text-sm text-red-600">{errors.jobTypeId}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assignedSiteId" className="text-sm font-medium">Assigned Site *</Label>
                      <div className="relative">
                        <IconBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Select value={formData.assignedSiteId.toString()} onValueChange={(value) => handleInputChange("assignedSiteId", parseInt(value))}>
                          <SelectTrigger className="pl-10 h-11">
                            <SelectValue placeholder="Select site" />
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
                      {errors.assignedSiteId && <p className="text-sm text-red-600">{errors.assignedSiteId}</p>}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Daily rates and overtime multipliers are automatically set based on the selected job type. 
                      Site-specific rates can be configured separately in the job type management section.
                    </p>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-primary border-b pb-2">Payment Information</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="preferredPaymentMethod" className="text-sm font-medium">Preferred Payment Method</Label>
                    <Select value={formData.preferredPaymentMethod} onValueChange={(value) => handleInputChange("preferredPaymentMethod", value)}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                        <SelectItem value="AIRTEL_MONEY">Airtel Money</SelectItem>
                        <SelectItem value="CHECK">Check</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.preferredPaymentMethod && <p className="text-sm text-red-600">{errors.preferredPaymentMethod}</p>}
                  </div>

                  {/* Bank Transfer Fields - Only show when BANK_TRANSFER is selected */}
                  {formData.preferredPaymentMethod === "BANK_TRANSFER" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankAccount" className="text-sm font-medium">Bank Account *</Label>
                        <div className="relative">
                          <IconCreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="bankAccount"
                            placeholder="Enter bank account number"
                            className="pl-10 h-11"
                            value={formData.bankAccount || ""}
                            onChange={(e) => handleInputChange("bankAccount", e.target.value)}
                            required
                          />
                        </div>
                        {errors.bankAccount && <p className="text-sm text-red-600">{errors.bankAccount}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankName" className="text-sm font-medium">Bank Name *</Label>
                        <Input
                          id="bankName"
                          placeholder="Enter bank name"
                          className="h-11"
                          value={formData.bankName || ""}
                          onChange={(e) => handleInputChange("bankName", e.target.value)}
                          required
                        />
                        {errors.bankName && <p className="text-sm text-red-600">{errors.bankName}</p>}
                      </div>
                    </div>
                  )}

                  {/* Mobile Money Fields - Only show when MOBILE_MONEY is selected */}
                  {formData.preferredPaymentMethod === "MOBILE_MONEY" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mobileMoneyNumber" className="text-sm font-medium">Mobile Money Number *</Label>
                        <div className="relative">
                          <IconWallet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="mobileMoneyNumber"
                            placeholder="+250 788 123 456"
                            className="pl-10 h-11"
                            value={formData.mobileMoneyNumber || ""}
                            onChange={(e) => handleInputChange("mobileMoneyNumber", e.target.value)}
                            required
                          />
                        </div>
                        {errors.mobileMoneyNumber && <p className="text-sm text-red-600">{errors.mobileMoneyNumber}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobileMoneyProvider" className="text-sm font-medium">Mobile Money Provider *</Label>
                        <Select value={formData.mobileMoneyProvider || ""} onValueChange={(value) => handleInputChange("mobileMoneyProvider", value || null)}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MTN_MOMO">MTN Mobile Money</SelectItem>
                            <SelectItem value="AIRTEL_MONEY">Airtel Money</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.mobileMoneyProvider && <p className="text-sm text-red-600">{errors.mobileMoneyProvider}</p>}
                      </div>
                    </div>
                  )}

                  {/* Airtel Money Fields - Only show when AIRTEL_MONEY is selected */}
                  {formData.preferredPaymentMethod === "AIRTEL_MONEY" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="airtelMoneyNumber" className="text-sm font-medium">Airtel Money Number *</Label>
                        <div className="relative">
                          <IconWallet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="airtelMoneyNumber"
                            placeholder="+250 730 123 456"
                            className="pl-10 h-11"
                            value={formData.airtelMoneyNumber || ""}
                            onChange={(e) => handleInputChange("airtelMoneyNumber", e.target.value)}
                            required
                          />
                        </div>
                        {errors.airtelMoneyNumber && <p className="text-sm text-red-600">{errors.airtelMoneyNumber}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="airtelMoneyProvider" className="text-sm font-medium">Airtel Money Provider *</Label>
                        <Select value={formData.airtelMoneyProvider || ""} onValueChange={(value) => handleInputChange("airtelMoneyProvider", value || null)}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AIRTEL_MONEY">Airtel Money</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.airtelMoneyProvider && <p className="text-sm text-red-600">{errors.airtelMoneyProvider}</p>}
                      </div>
                    </div>
                  )}

                  {/* Cash and Check - No additional fields needed */}
                  {(formData.preferredPaymentMethod === "CASH" || formData.preferredPaymentMethod === "CHECK") && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        {formData.preferredPaymentMethod === "CASH" 
                          ? "Cash payment selected. No additional payment details required."
                          : "Check payment selected. No additional payment details required."
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-primary border-b pb-2">Emergency Contact</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactName" className="text-sm font-medium">Emergency Contact Name</Label>
                      <div className="relative">
                        <IconUserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="emergencyContactName"
                          placeholder="Enter emergency contact name"
                          className="pl-10 h-11"
                          value={formData.emergencyContactName || ""}
                          onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                        />
                      </div>
                      {errors.emergencyContactName && <p className="text-sm text-red-600">{errors.emergencyContactName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactPhone" className="text-sm font-medium">Emergency Contact Phone</Label>
                      <div className="relative">
                        <IconPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="emergencyContactPhone"
                          placeholder="+250 788 123 456"
                          className="pl-10 h-11"
                          value={formData.emergencyContactPhone || ""}
                          onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                        />
                      </div>
                      {errors.emergencyContactPhone && <p className="text-sm text-red-600">{errors.emergencyContactPhone}</p>}
                    </div>
                  </div>
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
                        Add Worker
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