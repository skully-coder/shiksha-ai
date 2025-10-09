
'use client';

import Link from "next/link";
import Image from "next/image";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from "@/components/ui/sidebar";
import { NavItems } from "@/components/nav-items";
import AuthGuard from "@/components/auth-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {

  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex">
          <Sidebar>
            <SidebarHeader className="flex items-center justify-center">
              <Link href="/lesson-planner" className="block">
                <Image 
                  src="/assets/Logo_2.png"
                  alt="Shiksha AI Logo"
                  width={150}
                  height={38}
                  className="w-40 h-auto"
                  priority
                />
              </Link>
            </SidebarHeader>
            <SidebarContent>
              <NavItems />
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <div className="relative flex-1">
              {children}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
