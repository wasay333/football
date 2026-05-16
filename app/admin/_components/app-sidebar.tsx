'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingCart, LogOut, Users, Tag, X } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { logoutAction } from '@/app/admin/auth/logout/actions'

const navItems = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Footballers', url: '/admin/footballers', icon: Users },
  { title: 'Products', url: '/admin/products', icon: Package },
  { title: 'Categories', url: '/admin/categories', icon: Tag },
  { title: 'Orders', url: '/admin/orders', icon: ShoppingCart },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  const handleMobileNavigation = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <Image
              src="/foocapsnewlogo.png"
              alt="Foocaps"
              width={100}
              height={32}
              style={{ objectFit: "contain" }}
            />
            <span className="text-xs text-muted-foreground">Admin Panel</span>
          </div>
          {isMobile && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setOpenMobile(false)}
            >
              <X className="size-4" />
              <span className="sr-only">Close navigation</span>
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url} onClick={handleMobileNavigation}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">AD</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">Admin</span>
            <span className="truncate text-xs text-muted-foreground">
              admin@football.com
            </span>
          </div>
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              title="Sign out"
              onClick={handleMobileNavigation}
            >
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
