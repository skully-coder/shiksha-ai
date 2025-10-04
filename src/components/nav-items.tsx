
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { BookText, Sheet, ImageIcon, BrainCircuit, Languages, LogOut, User, Users, Heart } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const teacherNavItems = [
  { href: "/lesson-planner", icon: BookText, label: "Lesson Planner" },
  { href: "/classrooms", icon: Users, label: "Classrooms" },
  { href: "/differentiated-worksheets", icon: Sheet, label: "Worksheets" },
  { href: "/visual-aids", icon: ImageIcon, label: "Visual Aids" },
  { href: "/knowledge-base", icon: BrainCircuit, label: "Knowledge Base" },
  { href: "/local-content", icon: Languages, label: "Local Content" },
  { href: "/favorites", icon: Heart, label: "Favorites" },
];

const studentNavItems = [
    { href: "/classrooms", icon: Users, label: "Classroom" },
    { href: "/knowledge-base", icon: BrainCircuit, label: "Knowledge Base" },
    { href: "/local-content", icon: Languages, label: "Local Content" },
];

export function NavItems() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      router.push('/login');
      toast({
          title: "Logged Out",
          description: "You have been successfully logged out."
      });
    } catch (error) {
      console.error("Error signing out: ", error);
       toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'An unexpected error occurred during logout.',
      });
    }
  };

  const navItems = profile?.role === 'teacher' ? teacherNavItems : studentNavItems;

  return (
    <div className="flex flex-col h-full justify-between">
      <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.href)}
              tooltip={item.label}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Profile" isActive={pathname === '/profile'}>
              <Link href="/profile">
                <User />
                <span className="truncate">{user?.email ?? "Profile"}</span>
              </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}
