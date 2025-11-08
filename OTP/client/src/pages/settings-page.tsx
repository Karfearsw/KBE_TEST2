import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "@shared/schema";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  User as UserIcon,
  Lock,
  Bell,
  Layout,
  Shield,
  Users,
  FileText,
  HelpCircle,
  Info
} from "lucide-react";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Define validation schemas for various forms
const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  role: z.string(),
  bio: z.string().optional(),
});

const securityFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  leadAlerts: z.boolean().default(true),
  callReminders: z.boolean().default(true),
  dealUpdates: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  teamActivity: z.boolean().default(true),
});

const appearanceSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  dashboardLayout: z.enum(["default", "compact", "expanded"]),
  tableRowsPerPage: z.enum(["10", "25", "50", "100"]),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type SecurityFormValues = z.infer<typeof securityFormSchema>;
type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;
type AppearanceSettingsValues = z.infer<typeof appearanceSettingsSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile form setup
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: "",
      role: user?.role || "user",
      bio: "",
    },
  });

  // Security form setup
  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Notification settings form
  const notificationForm = useForm<NotificationSettingsValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      leadAlerts: true,
      callReminders: true,
      dealUpdates: true,
      marketingEmails: false,
      teamActivity: true,
    },
  });

  // Appearance settings form
  const appearanceForm = useForm<AppearanceSettingsValues>({
    resolver: zodResolver(appearanceSettingsSchema),
    defaultValues: {
      theme: "light",
      dashboardLayout: "default",
      tableRowsPerPage: "25",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return res.json();
    },
    onSuccess: (data: User) => {
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: SecurityFormValues) => {
      const res = await apiRequest("POST", "/api/user/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
      securityForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to change password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update notification settings mutation
  const updateNotificationSettingsMutation = useMutation({
    mutationFn: async (data: NotificationSettingsValues) => {
      const res = await apiRequest("PATCH", "/api/user/notification-settings", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update appearance settings mutation
  const updateAppearanceSettingsMutation = useMutation({
    mutationFn: async (data: AppearanceSettingsValues) => {
      const res = await apiRequest("PATCH", "/api/user/appearance-settings", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Appearance settings updated",
        description: "Your display preferences have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle profile form submission
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  // Handle security form submission
  const onSecuritySubmit = (data: SecurityFormValues) => {
    changePasswordMutation.mutate(data);
  };

  // Handle notification settings form submission
  const onNotificationSettingsSubmit = (data: NotificationSettingsValues) => {
    updateNotificationSettingsMutation.mutate(data);
  };

  // Handle appearance settings form submission
  const onAppearanceSettingsSubmit = (data: AppearanceSettingsValues) => {
    updateAppearanceSettingsMutation.mutate(data);
  };

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar />
      
      <main className="main-content flex-1 min-h-screen p-4 md:ml-64 md:p-6 overflow-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-heading text-neutral-900">Settings</h1>
          <p className="text-neutral-600">Manage your account settings and preferences</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Settings Navigation Sidebar */}
          <Card className="md:w-64 flex-shrink-0">
            <CardContent className="p-4">
              <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
                <Button 
                  variant={activeTab === "profile" ? "default" : "ghost"} 
                  className="justify-start"
                  onClick={() => setActiveTab("profile")}
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button 
                  variant={activeTab === "security" ? "default" : "ghost"} 
                  className="justify-start"
                  onClick={() => setActiveTab("security")}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Security
                </Button>
                <Button 
                  variant={activeTab === "notifications" ? "default" : "ghost"} 
                  className="justify-start"
                  onClick={() => setActiveTab("notifications")}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
                <Button 
                  variant={activeTab === "appearance" ? "default" : "ghost"} 
                  className="justify-start"
                  onClick={() => setActiveTab("appearance")}
                >
                  <Layout className="h-4 w-4 mr-2" />
                  Appearance
                </Button>
                <Button 
                  variant={activeTab === "team" ? "default" : "ghost"} 
                  className="justify-start"
                  onClick={() => setActiveTab("team")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Team
                </Button>
                <Button 
                  variant={activeTab === "company" ? "default" : "ghost"} 
                  className="justify-start"
                  onClick={() => setActiveTab("company")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Company
                </Button>
                <Button 
                  variant={activeTab === "help" ? "default" : "ghost"} 
                  className="justify-start"
                  onClick={() => setActiveTab("help")}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Help & Support
                </Button>
              </nav>
            </CardContent>
          </Card>
          
          {/* Settings Content */}
          <div className="flex-1">
            {/* Profile Settings */}
            {activeTab === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Update your personal information and preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Profile Picture */}
                    <div className="flex flex-col items-center">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={""} alt={user?.name || "User"} />
                        <AvatarFallback className="text-xl bg-primary text-white">
                          {user ? getUserInitials(user.name) : "??"}
                        </AvatarFallback>
                      </Avatar>
                      <Button variant="outline" className="mt-4 text-sm">
                        Change Photo
                      </Button>
                    </div>

                    {/* Profile Form */}
                    <div className="flex-1">
                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                          <FormField
                            control={profileForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={profileForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email Address</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={profileForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={profileForm.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select your role" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="admin">Administrator</SelectItem>
                                    <SelectItem value="acquisitions">Acquisitions Manager</SelectItem>
                                    <SelectItem value="caller">Caller</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="bio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bio</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    rows={4}
                                    placeholder="Tell us a little about yourself"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button 
                            type="submit" 
                            disabled={updateProfileMutation.isPending}
                            className="mt-2"
                          >
                            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </form>
                      </Form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Security Settings */}
            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your password and account security</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...securityForm}>
                    <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4">
                      <FormField
                        control={securityForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormDescription>
                              Password must be at least 8 characters.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        disabled={changePasswordMutation.isPending}
                        className="mt-2"
                      >
                        {changePasswordMutation.isPending ? "Changing Password..." : "Change Password"}
                      </Button>
                    </form>
                  </Form>
                  
                  <Separator className="my-8" />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Login Sessions</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-neutral-50 rounded-md border flex justify-between items-center">
                        <div>
                          <p className="font-medium">Current Session</p>
                          <p className="text-sm text-neutral-500">Started Apr 26, 2025 at 1:30 PM</p>
                        </div>
                        <Shield className="h-6 w-6 text-green-500" />
                      </div>
                      
                      <Button variant="destructive">
                        Sign Out All Other Devices
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Control how and when you receive notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...notificationForm}>
                    <form onSubmit={notificationForm.handleSubmit(onNotificationSettingsSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Email Notifications</h3>
                        
                        <FormField
                          control={notificationForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base mb-0">Email Notifications</FormLabel>
                                <FormDescription className="m-0">
                                  Receive notifications via email
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Notification Types</h3>
                        
                        <FormField
                          control={notificationForm.control}
                          name="leadAlerts"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base mb-0">Lead Alerts</FormLabel>
                                <FormDescription className="m-0">
                                  New leads and lead updates
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="callReminders"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base mb-0">Call Reminders</FormLabel>
                                <FormDescription className="m-0">
                                  Reminders for scheduled calls
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="dealUpdates"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base mb-0">Deal Updates</FormLabel>
                                <FormDescription className="m-0">
                                  Changes to deal status and details
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="teamActivity"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base mb-0">Team Activity</FormLabel>
                                <FormDescription className="m-0">
                                  Updates about team member actions
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="marketingEmails"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base mb-0">Marketing Emails</FormLabel>
                                <FormDescription className="m-0">
                                  Product updates and promotional offers
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        disabled={updateNotificationSettingsMutation.isPending}
                      >
                        {updateNotificationSettingsMutation.isPending 
                          ? "Saving..." 
                          : "Save Notification Settings"
                        }
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
            
            {/* Appearance Settings */}
            {activeTab === "appearance" && (
              <Card>
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>Customize how Flipstackk looks and works</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...appearanceForm}>
                    <form onSubmit={appearanceForm.handleSubmit(onAppearanceSettingsSubmit)} className="space-y-6">
                      <FormField
                        control={appearanceForm.control}
                        name="theme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Theme</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="system">System</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Choose how the application appears
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={appearanceForm.control}
                        name="dashboardLayout"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dashboard Layout</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select layout" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="default">Default</SelectItem>
                                <SelectItem value="compact">Compact</SelectItem>
                                <SelectItem value="expanded">Expanded</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              How dashboard components are arranged
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={appearanceForm.control}
                        name="tableRowsPerPage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rows Per Page</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select rows" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="10">10 rows</SelectItem>
                                <SelectItem value="25">25 rows</SelectItem>
                                <SelectItem value="50">50 rows</SelectItem>
                                <SelectItem value="100">100 rows</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Number of items to display in tables
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        disabled={updateAppearanceSettingsMutation.isPending}
                      >
                        {updateAppearanceSettingsMutation.isPending 
                          ? "Saving..." 
                          : "Save Appearance Settings"
                        }
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
            
            {/* Team Settings */}
            {activeTab === "team" && (
              <Card>
                <CardHeader>
                  <CardTitle>Team Settings</CardTitle>
                  <CardDescription>Manage your team members and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Team Members</h3>
                      <Button size="sm">Invite New Member</Button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full data-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="hover:bg-neutral-50">
                            <td className="flex items-center space-x-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary text-white">
                                  AU
                                </AvatarFallback>
                              </Avatar>
                              <span>Admin User</span>
                            </td>
                            <td>admin@example.com</td>
                            <td>
                              <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-1 text-xs">
                                Admin
                              </span>
                            </td>
                            <td>
                              <span className="rounded-full bg-green-100 text-green-800 px-2 py-1 text-xs">
                                Active
                              </span>
                            </td>
                            <td>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">Edit</Button>
                                <Button size="sm" variant="outline" className="text-red-500">Remove</Button>
                              </div>
                            </td>
                          </tr>
                          <tr className="hover:bg-neutral-50">
                            <td className="flex items-center space-x-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary text-white">
                                  BJ
                                </AvatarFallback>
                              </Avatar>
                              <span>Benny Jelleh</span>
                            </td>
                            <td>benny@example.com</td>
                            <td>
                              <span className="rounded-full bg-purple-100 text-purple-800 px-2 py-1 text-xs">
                                Acquisitions
                              </span>
                            </td>
                            <td>
                              <span className="rounded-full bg-green-100 text-green-800 px-2 py-1 text-xs">
                                Active
                              </span>
                            </td>
                            <td>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">Edit</Button>
                                <Button size="sm" variant="outline" className="text-red-500">Remove</Button>
                              </div>
                            </td>
                          </tr>
                          <tr className="hover:bg-neutral-50">
                            <td className="flex items-center space-x-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary text-white">
                                  KB
                                </AvatarFallback>
                              </Avatar>
                              <span>Kevin Ben</span>
                            </td>
                            <td>kevin@example.com</td>
                            <td>
                              <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-1 text-xs">
                                Admin
                              </span>
                            </td>
                            <td>
                              <span className="rounded-full bg-green-100 text-green-800 px-2 py-1 text-xs">
                                Active
                              </span>
                            </td>
                            <td>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">Edit</Button>
                                <Button size="sm" variant="outline" className="text-red-500">Remove</Button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Team Permissions</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Admin</p>
                            <p className="text-sm text-neutral-500">Full access to all features</p>
                          </div>
                          <Button size="sm" variant="outline">Edit</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Acquisitions</p>
                            <p className="text-sm text-neutral-500">Manage leads and deals</p>
                          </div>
                          <Button size="sm" variant="outline">Edit</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Caller</p>
                            <p className="text-sm text-neutral-500">Manage calls and contact leads</p>
                          </div>
                          <Button size="sm" variant="outline">Edit</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Company Settings */}
            {activeTab === "company" && (
              <Card>
                <CardHeader>
                  <CardTitle>Company Settings</CardTitle>
                  <CardDescription>Manage your company information and branding</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      <div className="flex flex-col items-center">
                        <div className="h-24 w-24 border rounded-md flex items-center justify-center bg-neutral-50">
                          <span className="text-2xl font-bold text-primary">F</span>
                        </div>
                        <Button variant="outline" className="mt-4 text-sm">
                          Upload Logo
                        </Button>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div>
                          <label className="text-sm font-medium">Company Name</label>
                          <Input defaultValue="Flipstackk Real Estate" />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Website</label>
                          <Input defaultValue="https://flipstackk.com" />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Address</label>
                          <Textarea rows={3} defaultValue="123 Main Street, Suite 100, Anytown, CA 90210" />
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Branding</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Primary Color</label>
                          <div className="flex items-center mt-2">
                            <div className="h-10 w-10 rounded-md bg-primary"></div>
                            <Input defaultValue="#FF533E" className="ml-4 w-32" />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Secondary Color</label>
                          <div className="flex items-center mt-2">
                            <div className="h-10 w-10 rounded-md bg-blue-600"></div>
                            <Input defaultValue="#2563EB" className="ml-4 w-32" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button className="mt-4">
                      Save Company Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Help & Support */}
            {activeTab === "help" && (
              <Card>
                <CardHeader>
                  <CardTitle>Help & Support</CardTitle>
                  <CardDescription>Get help using Flipstackk and find resources</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center">
                            <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                            Knowledge Base
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-neutral-600 mb-4">
                            Browse our extensive documentation to learn how to use all Flipstackk features.
                          </p>
                          <Button variant="outline">View Documentation</Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center">
                            <Info className="h-5 w-5 mr-2 text-blue-600" />
                            Contact Support
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-neutral-600 mb-4">
                            Need personalized help? Our support team is ready to assist you.
                          </p>
                          <Button variant="outline">Contact Support</Button>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Frequently Asked Questions</h3>
                      <div className="space-y-3">
                        <div className="rounded-md border p-4">
                          <h4 className="font-medium">How do I add a new lead?</h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            You can add a new lead by clicking the "Add New Lead" button on the Leads page or Dashboard.
                          </p>
                        </div>
                        <div className="rounded-md border p-4">
                          <h4 className="font-medium">How do I schedule a call with a lead?</h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            Navigate to the Calls page and click "Schedule Call" or click the call icon on any lead card.
                          </p>
                        </div>
                        <div className="rounded-md border p-4">
                          <h4 className="font-medium">How do I export my leads data?</h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            On the Leads page, click the "Export" button to download your leads as a CSV file.
                          </p>
                        </div>
                        <div className="rounded-md border p-4">
                          <h4 className="font-medium">How do I invite team members?</h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            Go to Settings and select Team, then click the "Invite New Member" button.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="rounded-md bg-neutral-50 p-6 text-center">
                      <h3 className="text-lg font-medium mb-2">Still need help?</h3>
                      <p className="text-neutral-600 mb-4">
                        Schedule a one-on-one session with our product specialists
                      </p>
                      <Button>Schedule Demo</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}