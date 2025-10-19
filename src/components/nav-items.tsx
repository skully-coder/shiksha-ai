"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { BookText, Sheet, ImageIcon, BrainCircuit, Languages, LogOut, User, Users } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';

const teacherNavItems = [
  { href: "/lesson-planner", icon: BookText, labelKey: "Lesson Planner" },
  { href: "/classrooms", icon: Users, labelKey: "Classrooms" },
  { href: "/differentiated-worksheets", icon: Sheet, labelKey: "Worksheets" },
  { href: "/visual-aids", icon: ImageIcon, labelKey: "Visual Aids" },
  { href: "/knowledge-base", icon: BrainCircuit, labelKey: "Knowledge Base" },
  { href: "/local-content", icon: Languages, labelKey: "Local Content" },
];

const studentNavItems = [
  { href: "/classrooms", icon: Users, labelKey: "Classrooms" },
  { href: "/knowledge-base", icon: BrainCircuit, labelKey: "Knowledge Base" },
  { href: "/local-content", icon: Languages, labelKey: "Local Content" },
];


export function NavItems() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { t, i18n } = useTranslation();

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      router.push('/login');
      toast({
          variant: 'default',
          title: t("loggedOut"),
          description: t("successfullyLoggedOut"),
          style: { backgroundColor: "#fff", color: "#222" }
      });
    } catch (error) {
      console.error("Error signing out: ", error);
       toast({
        variant: 'destructive',
        title: t("logoutFailed"),
        description: t("unexpectedLogoutError"),
        style: { backgroundColor: "#fff", color: "#222" }
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
              tooltip={t(item.labelKey)}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{t(item.labelKey)}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip={t("selectLanguage")}>
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="bg-transparent border-none text-sm text-gray-800 dark:text-white"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="mr">Marathi</option>
              <option value="bn">Bengali</option>
              <option value="ta">Tamil</option>
            </select>
          </SidebarMenuButton>
        </SidebarMenuItem>

         <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t("profile")} isActive={pathname === '/profile'}>
              <Link href="/profile">
                <User />
                <span className="truncate">{user?.email ?? t("profile")}</span>
              </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip={t("logout")}>
              <LogOut />
              <span>{t("logout")}</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}
