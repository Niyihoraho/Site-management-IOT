"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconBuilding,
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconListCheck,
  IconReport,
  IconUsers,
  IconWallet,
  IconBriefcase,
  IconFingerprint,
  IconChartBar,
  IconArrowRight,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Admin",
    email: "admin@construction.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Executive Dashboard",
      url: "/executive-dashboard",
      icon: IconChartBar,
    },
  ],
  navManagement: [
    {
      title: "Construction Sites",
      url: "/sites",
      icon: IconBuilding,
    },
    {
      title: "Workers",
      url: "/workers",
      icon: IconUsers,
    },
    {
      title: "Job Types",
      url: "/job-types",
      icon: IconBriefcase,
    },
  ],
  navOperations: [
    {
      title: "Attendance List",
      url: "/attendance",
      icon: IconListCheck,
    },
    {
      title: "Fingerprint Management",
      url: "/fingerprint",
      icon: IconFingerprint,
    },
    {
      title: "Payroll",
      url: "/payroll",
      icon: IconWallet,
    },
    {
      title: "Pending Payments",
      url: "/pending-payments",
      icon: IconListCheck,
    },
  ],
  navReports: [
    {
      title: "Attendance Report",
      url: "/attendance-reports",
      icon: IconReport,
    },
    {
      title: "Payroll Reports",
      url: "/payroll-reports",
      icon: IconReport,
    },
    {
      title: "Attendance → Payroll Flow",
      url: "/attendance-payroll-flow",
      icon: IconArrowRight,
    },
  ],

}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  
  // Determine active item based on current path
  const getActiveItem = () => {
    if (pathname === "/dashboard") return "Dashboard"
    if (pathname === "/executive-dashboard") return "Executive Dashboard"
    if (pathname.startsWith("/sites")) return "Construction Sites"
    if (pathname.startsWith("/workers")) return "Workers"
    if (pathname.startsWith("/job-types")) return "Job Types"
    if (pathname.startsWith("/attendance")) {
      if (pathname.includes("/reports")) return "Attendance Report"
      return "Attendance List"
    }
    if (pathname.startsWith("/fingerprint")) return "Fingerprint Management"
    if (pathname.startsWith("/payroll")) {
      if (pathname.includes("/reports")) return "Payroll Reports"
      if (pathname.includes("/pending")) return "Pending Payments"
      return "Payroll"
    }
    if (pathname.startsWith("/pending-payments")) return "Pending Payments"
    if (pathname.startsWith("/payroll-reports")) return "Payroll Reports"
    if (pathname.startsWith("/attendance-payroll-flow")) return "Attendance → Payroll Flow"
    return undefined
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Site Management</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} activeItem={getActiveItem()} />
        
        {/* Management Section */}
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-muted-foreground">
            Management
          </h2>
          <NavMain items={data.navManagement} activeItem={getActiveItem()} />
        </div>
        
        {/* Operations Section */}
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-muted-foreground">
            Operations
          </h2>
          <NavMain items={data.navOperations} activeItem={getActiveItem()} />
        </div>
        
        {/* Reports Section */}
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-muted-foreground">
            Reports
          </h2>
          <NavMain items={data.navReports} activeItem={getActiveItem()} />
        </div>
        
       
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
