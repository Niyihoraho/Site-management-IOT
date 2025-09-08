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
  IconSearch,
  IconSettings,
  IconUsers,
  IconWallet,
  IconBriefcase,
  IconFingerprint,
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
      title: "Attendance Report",
      url: "/attendance-reports",
      icon: IconReport,
    },
    {
      title: "Payroll",
      url: "/payroll",
      icon: IconWallet,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "/help",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "/search",
      icon: IconSearch,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  
  // Determine active item based on current path
  const getActiveItem = () => {
    if (pathname === "/dashboard") return "Dashboard"
    if (pathname.startsWith("/sites")) return "Construction Sites"
    if (pathname.startsWith("/workers")) return "Workers"
    if (pathname.startsWith("/job-types")) return "Job Types"
    if (pathname.startsWith("/attendance")) {
      if (pathname.includes("/reports")) return "Attendance Report"
      return "Attendance List"
    }
    if (pathname.startsWith("/fingerprint")) return "Fingerprint Management"
    if (pathname.startsWith("/payroll")) return "Payroll"
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
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
