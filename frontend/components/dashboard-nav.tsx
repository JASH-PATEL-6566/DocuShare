"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileText, Link2, CreditCard, Settings, BarChart } from "lucide-react";

const items = [
  {
    title: "Files",
    href: "/dashboard/files",
    icon: FileText,
  },
  {
    title: "Shared Links",
    href: "/dashboard/links",
    icon: Link2,
  },
  {
    title: "Access Logs",
    href: "/dashboard/access-logs",
    icon: BarChart,
  },
  {
    title: "Subscription",
    href: "/dashboard/subscription",
    icon: CreditCard,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="grid items-start gap-2 p-4">
      <Link href="/dashboard">
        <Button
          variant={pathname === "/dashboard" ? "default" : "ghost"}
          className="w-full justify-start"
        >
          <FileText className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </Link>
      {items.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant={pathname === item.href ? "default" : "ghost"}
            className="w-full justify-start"
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.title}
          </Button>
        </Link>
      ))}
    </nav>
  );
}
