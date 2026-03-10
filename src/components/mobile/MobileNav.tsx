"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";

type NavItem = {
  path: string;
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { path: "/portal", label: "Portal", icon: "◉" },
  { path: "/queue", label: "Queue", icon: "☰" },
  { path: "/paths", label: "Paths", icon: "◫" },
  { path: "/community", label: "Cohort", icon: "⊞" },
];

// Routes where global nav is hidden (standalone pages with their own UI)
const HIDDEN_ROUTES = ["/create", "/p/", "/auth/"];

export function MobileNav() {
  const C = useC();
  const pathname = usePathname();

  // Hide on standalone pages
  if (HIDDEN_ROUTES.some((route) => pathname.startsWith(route))) {
    return null;
  }

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: C.void, borderTop: `1px solid ${C.edge}`,
      padding: "8px 16px", paddingBottom: "max(8px, env(safe-area-inset-bottom))",
      display: "none", // Hidden by default, shown via CSS media query
    }}
    className="mobile-nav"
    >
      <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + "/");

          return (
            <Link key={item.path} href={item.path} style={{ textDecoration: "none" }}>
              <motion.div
                whileTap={{ scale: 0.95 }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  padding: "8px 16px", borderRadius: 8,
                  background: isActive ? C.blue + "15" : "transparent",
                }}
              >
                <span style={{
                  fontSize: 20,
                  color: isActive ? C.blue : C.t3,
                }}>
                  {item.icon}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 500,
                  color: isActive ? C.blue : C.t4,
                  letterSpacing: "0.02em",
                }}>
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
