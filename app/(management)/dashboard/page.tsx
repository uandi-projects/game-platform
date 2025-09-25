"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import Header from "@/components/Header";
import {
  Gamepad2,
  Users,
  BarChart3,
  Settings,
  UserPlus,
  Calendar,
  Trophy,
  PlusCircle,
  FolderOpen
} from "lucide-react";

export default function DashboardPage() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const router = useRouter();

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (currentUser === null) {
      router.push("/signin");
    }
  }, [currentUser, router]);

  // Check loading states
  if (currentUser === undefined) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Loader />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Welcome, {currentUser.name || currentUser.email}!
            </h1>
            <p className="text-lg text-muted-foreground flex items-center gap-2">
              <Badge variant={
                currentUser.role === "admin" ? "destructive" :
                currentUser.role === "teacher" ? "default" :
                "secondary"
              }>
                {currentUser.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : "Student"}
              </Badge>
              {currentUser.role === "student" && "Join games, track progress, and learn"}
              {currentUser.role === "teacher" && "Create games, manage students, and track progress"}
              {currentUser.role === "admin" && "Manage users, oversee the platform, and configure settings"}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quick Join</CardTitle>
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Game Code</div>
                <p className="text-xs text-muted-foreground">Enter a code to join a game</p>
                <Button size="sm" className="mt-2 w-full" asChild>
                  <Link href="/">Enter Code</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profile</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Settings</div>
                <p className="text-xs text-muted-foreground">Manage your account</p>
                <Button size="sm" variant="outline" className="mt-2 w-full" asChild>
                  <Link href="/profile">View Profile</Link>
                </Button>
              </CardContent>
            </Card>

            {(currentUser.role === "teacher" || currentUser.role === "admin") && (
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Invite Users</CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Add People</div>
                  <p className="text-xs text-muted-foreground">Invite students or teachers</p>
                  <Button size="sm" variant="outline" className="mt-2 w-full" asChild>
                    <Link href="/invite">Send Invites</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentUser.role === "admin" && (
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Admin Panel</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Manage</div>
                  <p className="text-xs text-muted-foreground">User management</p>
                  <Button size="sm" variant="destructive" className="mt-2 w-full" asChild>
                    <Link href="/admin">Open Admin</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Role-based Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentUser.role === "student" && (
              <>
                <DashboardCard
                  title="Single Player Games"
                  description="Practice and improve your skills with solo challenges"
                  href="/games/single-player"
                  icon={<Gamepad2 className="h-6 w-6" />}
                  color="bg-blue-500"
                />
                <DashboardCard
                  title="My Progress"
                  description="View your learning progress and achievement scores"
                  href="/progress"
                  icon={<BarChart3 className="h-6 w-6" />}
                  color="bg-green-500"
                />
                <DashboardCard
                  title="Game History"
                  description="Review past games and achievements you've earned"
                  href="/history"
                  icon={<Trophy className="h-6 w-6" />}
                  color="bg-purple-500"
                />
              </>
            )}

            {(currentUser.role === "teacher" || currentUser.role === "admin") && (
              <>
                <DashboardCard
                  title="Create Game"
                  description="Design new educational games for your students"
                  href="/games/create"
                  icon={<PlusCircle className="h-6 w-6" />}
                  color="bg-green-500"
                />
                <DashboardCard
                  title="My Games"
                  description="Manage and organize your created games"
                  href="/games/manage"
                  icon={<FolderOpen className="h-6 w-6" />}
                  color="bg-blue-500"
                />
                <DashboardCard
                  title="Analytics"
                  description="View student performance and engagement metrics"
                  href="/analytics"
                  icon={<BarChart3 className="h-6 w-6" />}
                  color="bg-purple-500"
                />
              </>
            )}

            {currentUser.role === "admin" && (
              <>
                <DashboardCard
                  title="Platform Analytics"
                  description="View overall platform usage and system metrics"
                  href="/admin/analytics"
                  icon={<BarChart3 className="h-6 w-6" />}
                  color="bg-orange-500"
                />
                <DashboardCard
                  title="System Settings"
                  description="Configure platform settings and preferences"
                  href="/admin/settings"
                  icon={<Settings className="h-6 w-6" />}
                  color="bg-red-500"
                />
              </>
            )}
          </div>

          {/* Recent Activity Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <Calendar className="h-8 w-8 mx-auto mb-2" />
                    <p>No recent activity to display</p>
                    <p className="text-sm">Your game activity will appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, description, href, icon, color }: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Link href={href} className="group">
      <Card className={`${color} text-white hover:opacity-90 transition-opacity border-0 h-full`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="opacity-80">
              {icon}
            </div>
            <div className="text-right">
              <h3 className="text-xl font-bold mb-1 group-hover:translate-x-1 transition-transform">
                {title}
              </h3>
            </div>
          </div>
          <p className="text-white/80 text-sm">
            {description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}