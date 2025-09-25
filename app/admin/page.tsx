"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  // Check if user is admin
  if (currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">You need admin privileges to access user management.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-foreground text-background px-4 py-2 rounded-md"
          >
            Go Home
          </button>
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-500/20 text-red-700 border-red-500/50";
      case "teacher": return "bg-blue-500/20 text-blue-700 border-blue-500/50";
      case "student": return "bg-green-500/20 text-green-700 border-green-500/50";
      default: return "bg-gray-500/20 text-gray-700 border-gray-500/50";
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">User Management</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage all users, roles, and permissions
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/invite"
              className="bg-foreground text-background px-4 py-2 rounded-md hover:opacity-80 transition-opacity"
            >
              Invite Users
            </Link>
            <button
              onClick={() => router.push("/")}
              className="bg-slate-200 dark:bg-slate-800 text-foreground px-4 py-2 rounded-md hover:opacity-80 transition-opacity"
            >
              Back to Home
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 rounded-md p-4 ${
            message.type === "success"
              ? "bg-green-500/20 border-2 border-green-500/50"
              : "bg-red-500/20 border-2 border-red-500/50"
          }`}>
            <p className="text-foreground">
              {message.text}
            </p>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {allUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-100 dark:hover:bg-slate-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center">
                            <span className="text-sm font-medium text-foreground">
                              {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground">
                            {user.name || "No name"}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email || "No email"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser?.id === user._id ? (
                        <select
                          className="bg-background border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1 text-sm"
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(user.role || "student")}`}>
                          {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Student"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.emailVerificationTime ? "Verified" : "Pending"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingUser?.id === user._id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleRoleUpdate(user._id, editingUser.role)}
                            disabled={loading[user._id]}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                          >
                            {loading[user._id] ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingUser({ id: user._id, role: user.role || "student" })}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Edit Role
                          </button>
                          {user._id !== currentUser._id && (
                            <button
                              onClick={() => handleDeleteUser(user._id, user.email || "Unknown")}
                              disabled={loading[user._id]}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                            >
                              {loading[user._id] ? "Deleting..." : "Delete"}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">{allUsers.length}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold mb-2">Admins</h3>
            <p className="text-3xl font-bold text-red-600">
              {allUsers.filter(u => u.role === "admin").length}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold mb-2">Teachers</h3>
            <p className="text-3xl font-bold text-green-600">
              {allUsers.filter(u => u.role === "teacher").length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}