import { pgTable, text, serial, integer, timestamp, boolean, numeric, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  role: text("role", { enum: ["admin", "acquisitions", "caller", "investor"] }).default("caller"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertUserSchema = createInsertSchema(users);
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Leads table
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  leadId: text("lead_id").notNull(), // Custom formatted ID (e.g., LD-2025-0001)
  propertyAddress: text("property_address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  ownerName: text("owner_name").notNull(),
  ownerPhone: text("owner_phone"),
  ownerEmail: text("owner_email"),
  status: text("status").default("new"), // new, contacted, follow-up, negotiation, under-contract, closed, dead
  motivationLevel: text("motivation_level").default("unknown"), // unknown, low, medium, high
  propertyType: text("property_type").default("single-family"), // single-family, multi-family, condo, commercial, land
  source: text("lead_source").default("other"), // cold-call, direct-mail, referral, online, other
  notes: text("notes"),
  arv: integer("arv"), // After repair value
  repairCost: integer("repair_cost"),
  estimatedValue: integer("estimated_value"),
  assignedToUserId: integer("assigned_to_user_id").references(() => users.id),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leadsRelations = relations(leads, ({ one }) => ({
  assignedTo: one(users, {
    fields: [leads.assignedToUserId],
    references: [users.id]
  })
}));

export const insertLeadSchema = createInsertSchema(leads);
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

// Calls table - for tracking calls made to leads
export const calls = pgTable("calls", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  callTime: timestamp("call_timestamp").defaultNow().notNull(),
  duration: integer("duration_seconds"), // in seconds
  outcome: text("outcome"), // answered, voicemail, no-answer, etc.
  notes: text("notes"),
  // Omit fields not in the database for now
  // recordingUrl: text("recording_url"),
  // callType: text("call_type").default("outbound"), // inbound, outbound
  // phoneNumber: text("phone_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const callsRelations = relations(calls, ({ one }) => ({
  user: one(users, {
    fields: [calls.userId],
    references: [users.id]
  }),
  lead: one(leads, {
    fields: [calls.leadId],
    references: [leads.id]
  })
}));

export const insertCallSchema = createInsertSchema(calls);
export type Call = typeof calls.$inferSelect;
export type InsertCall = z.infer<typeof insertCallSchema>;

// Scheduled calls table - for upcoming calls
export const scheduledCalls = pgTable("scheduled_calls", {
  id: serial("id").primaryKey(),
  assignedCallerId: integer("assigned_caller_id").notNull().references(() => users.id),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  scheduledTime: timestamp("scheduled_time").notNull(),
  notes: text("notes"),
  status: text("status").default("pending"), // pending, completed, missed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const scheduledCallsRelations = relations(scheduledCalls, ({ one }) => ({
  user: one(users, {
    fields: [scheduledCalls.assignedCallerId],
    references: [users.id]
  }),
  lead: one(leads, {
    fields: [scheduledCalls.leadId],
    references: [leads.id]
  })
}));

// Create the insert schema for scheduled calls
export const insertScheduledCallSchema = createInsertSchema(scheduledCalls);
export type ScheduledCall = typeof scheduledCalls.$inferSelect;
export type InsertScheduledCall = z.infer<typeof insertScheduledCallSchema>;

// Team members table - for tracking performance
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  totalCalls: integer("total_calls").default(0),
  totalLeadsConverted: integer("total_leads_converted").default(0),
  totalRevenueGenerated: numeric("total_revenue_generated", { precision: 10, scale: 2 }).default("0"),
  currentDealsValue: numeric("current_deals_value", { precision: 10, scale: 2 }).default("0"),
  lastActivityAt: timestamp("last_activity_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id]
  })
}));

export const insertTeamMemberSchema = createInsertSchema(teamMembers);
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

// Activities table - for tracking user activities
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  actionType: text("action_type").notNull(), // create, update, delete, call, schedule, etc.
  targetType: text("target_type").notNull(), // lead, call, scheduled_call, etc.
  targetId: integer("target_id").notNull(), // ID of the target record
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id]
  })
}));

export const insertActivitySchema = createInsertSchema(activities);
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Timesheet table
export const timesheets = pgTable("timesheets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  totalHours: numeric("total_hours", { precision: 5, scale: 2 }).notNull(),
  description: text("description").notNull(),
  activityType: text("activity_type").notNull(), // e.g., "calling", "meetings", "admin", "property-visits"
  leadId: integer("lead_id").references(() => leads.id),
  approved: boolean("approved").default(false),
  approvedBy: integer("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// Timesheet schema relations
export const timesheetsRelations = relations(timesheets, ({ one }) => ({
  user: one(users, {
    fields: [timesheets.userId],
    references: [users.id]
  }),
  lead: one(leads, {
    fields: [timesheets.leadId],
    references: [leads.id]
  }),
  approver: one(users, {
    fields: [timesheets.approvedBy],
    references: [users.id]
  })
}));

export const insertTimesheetSchema = createInsertSchema(timesheets);
export type Timesheet = typeof timesheets.$inferSelect;
export type InsertTimesheet = z.infer<typeof insertTimesheetSchema>;