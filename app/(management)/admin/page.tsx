"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader } from "@/components/ui/loader";
import Header from "@/components/Header";

export default function AdminPage() {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingUser, setEditingUser] = useState<{ id: string; role: "admin" | "teacher" | "student" } | null>(null);

  const currentUser = useQuery(api.users.getCurrentUser);
  const allUsers = useQuery(api.users.getAllUsers);
  const updateUserRole = useMutation(api.users.updateUserRole);
  const deleteUser = useMutation(api.users.deleteUser);
  const router = useRouter();

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (currentUser === null) {
      router.push("/signin");
    }
  }, [currentUser, router]);

  // Check loading states
  if (currentUser === undefined || allUsers === undefined) {
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

  // Check if user is admin
  if (currentUser.role !== "admin") {
    return (
      <div>
        <Header />
        <div className="min-h-screen p-8 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
              <p className="mb-4">You need admin privileges to access user management.</p>
              <Button onClick={() => router.push("/")}>Go Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleRoleUpdate = async (userId: string, newRole: "admin" | "teacher" | "student") => {
    setLoading(prev => ({ ...prev, [userId]: true }));
    setMessage(null);

    try {
      await updateUserRole({ userId: userId as any, role: newRole });
      setMessage({ type: "success", text: `User role updated to ${newRole}` });
      setEditingUser(null);
    } catch (error: unknown) {
      setMessage({ type: "error", text: (error as Error)?.message || "Failed to update role" });
    } finally {
      setLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    setLoading(prev => ({ ...prev, [userId]: true }));
    setMessage(null);

    try {
      await deleteUser({ userId: userId as any });
      setMessage({ type: "success", text: `User ${userEmail} deleted successfully` });
    } catch (error: unknown) {
      setMessage({ type: "error", text: (error as Error)?.message || "Failed to delete user" });
    } finally {
      setLoading(prev => ({ ...prev, [userId]: false }));
    }
  };


  return (
    <div>
      <Header />
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">User Management</h1>
              <p className="text-muted-foreground">
                Manage all users, roles, and permissions
              </p>
            </div>
            <div className="flex gap-4">
              <Button asChild>
                <Link href="/invite">Invite Users</Link>
              </Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                Back to Home
              </Button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <Alert className={`mb-6 ${message.type === "success"
                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : "border-destructive bg-red-50 dark:bg-red-900/20"
              }`}>
              <AlertDescription>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Users Table */}
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium">
                            {user.name || "No name"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email || "No email"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingUser?.id === user._id ? (
                        <Select
                          value={editingUser.role}
                          onValueChange={(value) => setEditingUser({ ...editingUser, role: value as any })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={
                          user.role === "admin" ? "destructive" :
                            user.role === "teacher" ? "default" :
                              "secondary"
                        }>
                          {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Student"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.emailVerificationTime ? "Verified" : "Pending"}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingUser?.id === user._id ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleRoleUpdate(user._id, editingUser.role)}
                            disabled={loading[user._id]}
                          >
                            {loading[user._id] ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingUser(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingUser({ id: user._id, role: user.role || "student" })}
                          >
                            Edit Role
                          </Button>
                          {user._id !== currentUser._id && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(user._id, user.email || "Unknown")}
                              disabled={loading[user._id]}
                            >
                              {loading[user._id] ? "Deleting..." : "Delete"}
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allUsers.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {allUsers.filter(u => u.role === "admin").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Teachers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {allUsers.filter(u => u.role === "teacher").length}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}