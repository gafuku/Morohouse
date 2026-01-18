"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const { user, userData, logout } = useAuth();
  const pathname = usePathname();

  // Don't show navbar on login or landing page (optional decision, but safer for now)
  if (pathname === "/login" || pathname === "/") {
    return null;
  }

  // Navigation Links
  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/opportunities", label: "Opportunities" },
    { href: "/resources", label: "Resources" },
    // { href: "/events", label: "Events" }, // Events are currently just on dashboard
  ];

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 items-center px-4 mx-auto justify-between">
        <div className="flex items-center">
          <Link
            href="/dashboard"
            className="mr-6 flex items-center space-x-2 font-bold text-primary"
          >
            <span>BYEN MEMBER</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === link.href
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                {link.label}
              </Link>
            ))}
            {/* Members Directory */}
            <Link
              href="/members"
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === "/members"
                  ? "text-foreground"
                  : "text-foreground/60"
              )}
            >
              Members
            </Link>
            <Link
              href="/chapters"
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === "/chapters"
                  ? "text-foreground"
                  : "text-foreground/60"
              )}
            >
              Chapters
            </Link>
            {userData?.role === "admin" && (
              <Link
                href="/admin"
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === "/admin"
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden items-center gap-4">
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {user && (
            <>
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={() => logout()}>
                Log out
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu Content */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t p-4 space-y-4 bg-background">
          <nav className="flex flex-col space-y-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === link.href
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/members"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/members"
                  ? "text-foreground"
                  : "text-foreground/60"
              )}
            >
              Members
            </Link>
            <Link
              href="/chapters"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/chapters"
                  ? "text-foreground"
                  : "text-foreground/60"
              )}
            >
              Chapters
            </Link>
            {userData?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === "/admin"
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                Admin
              </Link>
            )}
          </nav>
          <div className="pt-4 border-t">
            {user && (
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logout()}
                  className="w-full"
                >
                  Log out
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
