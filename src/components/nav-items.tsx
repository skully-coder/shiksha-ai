"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { BookText, Sheet, ImageIcon, BrainCircuit, Languages, LogOut, User, Users, School } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

const teacherNavItems = [
  { href: "/lesson-planner", icon: BookText, label: "Lesson Planner" },
  { href: "/classrooms", icon: Users, label: "Classrooms" },
  { href: "/differentiated-worksheets", icon: Sheet, label: "Worksheets" },
  { href: "/visual-aids", icon: ImageIcon, label: "Visual Aids" },
  { href: "/knowledge-base", icon: BrainCircuit, label: "Knowledge Base" },
  { href: "/local-content", icon: Languages, label: "Local Content" },
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
          variant: 'default',
          title: "Logged Out",
          description: "You have been successfully logged out.",
          style: { backgroundColor: "#fff", color: "#222" } // Set background to white, text to dark
      });
    } catch (error) {
      console.error("Error signing out: ", error);
       toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'An unexpected error occurred during logout.',
        style: { backgroundColor: "#fff", color: "#222" } // Set background to white, text to dark
      });
    }
  };

  const navItems = profile?.role === 'teacher' ? teacherNavItems : studentNavItems;

  return (
    <div className="flex flex-col h-full justify-between">
      <SidebarMenu>
        <Badge className="flex gap-2 pl-2 items-center text-md mx-auto px-5 mb-2" variant="outline"><School size={16}/>{profile?.school?.name || "N/A"}</Badge>
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
