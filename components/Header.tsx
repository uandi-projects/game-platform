"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { ThemeToggle, MobileThemeToggle } from "@/components/theme-toggle";
import { Loader } from "@/components/ui/loader";
import { Gamepad2, UserPlus, Settings, User, LogOut, Menu, LayoutDashboard } from "lucide-react";

export default function Header() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrentUser);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 bg-background p-4 border-b border-border flex flex-row justify-between items-center">
      <Link href="/" className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity">
        <Gamepad2 className="h-6 w-6" />
        <span>U&I Game Platform</span>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-2">
        {isLoading ? (
          <Loader size="sm" />
        ) : isAuthenticated && currentUser && (
          <>
            <Button asChild size="sm" variant="ghost">
              <Link href="/dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </Button>
            {(currentUser.role === "teacher" || currentUser.role === "admin") && (
              <Button asChild size="sm" variant="outline">
                <Link href="/invite" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Invite Users</span>
                </Link>
              </Button>
            )}
            {currentUser.role === "admin" && (
              <Button asChild size="sm" variant="destructive">
                <Link href="/admin" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>User Management</span>
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profile" className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs font-medium">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : currentUser.email?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">
                    {currentUser.name || currentUser.email}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentUser.role}
                  </div>
                </div>
              </Link>
            </Button>
          </>
        )}
        {!isLoading && (
          <>
            <ThemeToggle />
            <SignOutButton />
          </>
        )}
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden">
        <Drawer open={isOpen} onOpenChange={setIsOpen} direction="right">
          <DrawerTrigger asChild>
            <Button variant="ghost" size="sm">
              <Menu className="h-6 w-6" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-full w-80 right-0 left-auto rounded-l-lg">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b">
                <Link href="/" className="flex items-center gap-2 text-xl font-bold" onClick={() => setIsOpen(false)}>
                  <Gamepad2 className="h-6 w-6" />
                  <span>U&I Game Platform</span>
                </Link>
              </div>

              {/* Content */}
              <div className="flex-1 p-6">
                {isLoading ? (
                  <div className="flex justify-center">
                    <Loader />
                  </div>
                ) : isAuthenticated && currentUser ? (
                  <div className="flex flex-col space-y-6">
                    {/* User Profile */}
                    <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                      <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : currentUser.email?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {currentUser.name || currentUser.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {currentUser.role}
                        </div>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="space-y-2">
                      <Button asChild variant="ghost" className="w-full justify-start h-12" onClick={() => setIsOpen(false)}>
                        <Link href="/dashboard" className="flex items-center gap-3">
                          <LayoutDashboard className="h-5 w-5" />
                          <span>Dashboard</span>
                        </Link>
                      </Button>

                      <Button asChild variant="ghost" className="w-full justify-start h-12" onClick={() => setIsOpen(false)}>
                        <Link href="/profile" className="flex items-center gap-3">
                          <User className="h-5 w-5" />
                          <span>Profile</span>
                        </Link>
                      </Button>

                      {(currentUser.role === "teacher" || currentUser.role === "admin") && (
                        <Button asChild variant="ghost" className="w-full justify-start h-12" onClick={() => setIsOpen(false)}>
                          <Link href="/invite" className="flex items-center gap-3">
                            <UserPlus className="h-5 w-5" />
                            <span>Invite Users</span>
                          </Link>
                        </Button>
                      )}

                      {currentUser.role === "admin" && (
                        <Button asChild variant="ghost" className="w-full justify-start h-12" onClick={() => setIsOpen(false)}>
                          <Link href="/admin" className="flex items-center gap-3">
                            <Settings className="h-5 w-5" />
                            <span>User Management</span>
                          </Link>
                        </Button>
                      )}

                      <MobileThemeToggle />
                    </div>
                  </div>
                ) : (
                  <Button asChild className="w-full justify-start h-12" onClick={() => setIsOpen(false)}>
                    <Link href="/signin" className="flex items-center gap-3">
                      <User className="h-5 w-5" />
                      <span>Sign In</span>
                    </Link>
                  </Button>
                )}
              </div>

              {/* Footer */}
              {isAuthenticated && currentUser && (
                <div className="p-6 border-t">
                  <MobileSignOutButton onClose={() => setIsOpen(false)} />
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </header>
  );
}

function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <Button asChild>
        <Link href="/signin" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>Sign In</span>
        </Link>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() =>
        void signOut().then(() => {
          router.push("/signin");
        })
      }
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      <span>Sign out</span>
    </Button>
  );
}

function MobileSignOutButton({ onClose }: { onClose: () => void }) {
  const { signOut } = useAuthActions();
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      className="justify-start w-full h-12"
      onClick={() =>
        void signOut().then(() => {
          router.push("/signin");
          onClose();
        })
      }
    >
      <LogOut className="h-5 w-5 mr-3" />
      <span>Sign Out</span>
    </Button>
  );
}