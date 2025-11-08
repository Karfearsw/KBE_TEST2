import { 
  users, 
  leads,
  calls,
  scheduledCalls,
  teamMembers,
  activities,
  timesheets,
  User, 
  InsertUser,
  Lead,
  InsertLead,
  Call,
  InsertCall,
  ScheduledCall,
  InsertScheduledCall,
  TeamMember,
  InsertTeamMember,
  Activity,
  InsertActivity,
  Timesheet,
  InsertTimesheet
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, and, gte, desc, asc, sql, like, or, inArray, isNull } from "drizzle-orm";
import { generateLeadId, extractLeadNumber, getCurrentYearPrefix } from "./utils/lead-utils";
import { pool } from "./db";
import pgSessionFactory from "connect-pg-simple";

// Create the session store
const PgSession = pgSessionFactory(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;
  
  // Lead methods
  getLead(id: number): Promise<Lead | undefined>;
  getLeads(filters?: LeadFilters): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;
  
  // Call methods
  getCall(id: number): Promise<Call | undefined>;
  getCalls(leadId?: number, userId?: number): Promise<Call[]>;
  createCall(call: InsertCall): Promise<Call>;
  
  // Scheduled Call methods
  getScheduledCall(id: number): Promise<ScheduledCall | undefined>;
  getScheduledCalls(filters?: ScheduledCallFilters): Promise<ScheduledCall[]>;
  createScheduledCall(scheduledCall: InsertScheduledCall): Promise<ScheduledCall>;
  updateScheduledCall(id: number, scheduledCall: Partial<InsertScheduledCall>): Promise<ScheduledCall | undefined>;
  deleteScheduledCall(id: number): Promise<boolean>;
  
  // Team member methods
  getTeamMember(userId: number): Promise<TeamMember | undefined>;
  createOrUpdateTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  
  // Activity methods
  getActivities(limit?: number, offset?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Timesheet methods
  getTimesheet(id: number): Promise<Timesheet | undefined>;
  getTimesheets(filters?: TimesheetFilters): Promise<Timesheet[]>;
  createTimesheet(timesheet: InsertTimesheet): Promise<Timesheet>;
  updateTimesheet(id: number, timesheet: Partial<InsertTimesheet>): Promise<Timesheet | undefined>;
  deleteTimesheet(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: any; // Using any type for session store to avoid TypeScript issues
}

export interface LeadFilters {
  status?: string[];
  search?: string;
  assignedToUserId?: number;
  createdByUserId?: number; // Added to track who created the lead
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ScheduledCallFilters {
  status?: string;
  userId?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface TimesheetFilters {
  userId?: number;
  startDate?: Date;
  endDate?: Date;
  approved?: boolean;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any type for session store to avoid TypeScript issues
  
  constructor() {
    this.sessionStore = new PgSession({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'session', // Default table name
      schemaName: 'public', // Use public schema
      pruneSessionInterval: 60 * 15 // Prune expired sessions every 15 minutes
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      // Check if user exists first
      const user = await this.getUser(id);
      if (!user) {
        return false;
      }
      
      // Delete user
      const result = await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      return false;
    }
  }
  
  // Lead methods
  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }
  
  async getLeads(filters: LeadFilters = {}): Promise<Lead[]> {
    let query = db.select().from(leads);
    
    // Apply filters
    if (filters.status && filters.status.length > 0) {
      query = query.where(inArray(leads.status, filters.status));
    }
    
    if (filters.assignedToUserId) {
      query = query.where(eq(leads.assignedToUserId, filters.assignedToUserId));
    }
    
    // Filter for "created by" user ID
    if (filters.createdByUserId) {
      try {
        console.log('Filtering by createdByUserId:', filters.createdByUserId);
        
        // Look for activity records first (for recently added leads)
        const creationActivities = await db
          .select()
          .from(activities)
          .where(and(
            eq(activities.userId, filters.createdByUserId),
            eq(activities.actionType, 'create'),
            eq(activities.targetType, 'lead')
          ));
          
        console.log(`Found ${creationActivities.length} lead creation activities for user ${filters.createdByUserId}`);
        
        // Also look for leads directly created by this user for backward compatibility
        // This helps find leads that might have been created before we started tracking activities
        const userLeads = await db
          .select({ id: leads.id })
          .from(leads)
          .where(eq(leads.createdByUserId, filters.createdByUserId))
          .execute();
          
        console.log(`Found ${userLeads.length} leads with createdByUserId = ${filters.createdByUserId}`);
        
        // Combine both sources of lead IDs
        const leadIds = [
          ...creationActivities.map(activity => activity.targetId),
          ...userLeads.map(lead => lead.id)
        ];
        
        // Remove duplicates
        const uniqueLeadIds = [...new Set(leadIds)];
        console.log(`Total unique leads created by user ${filters.createdByUserId}:`, uniqueLeadIds.length);
        
        if (uniqueLeadIds.length > 0) {
          // Filter to only these leads
          query = query.where(inArray(leads.id, uniqueLeadIds));
        } else {
          console.log('No leads created by this user, returning empty result');
          return [];
        }
      } catch (error) {
        console.error('Error in createdByUserId filter:', error);
      }
    }
    
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.where(
        or(
          like(leads.propertyAddress, searchTerm),
          like(leads.ownerName, searchTerm),
          like(leads.ownerPhone, searchTerm),
          like(leads.ownerEmail, searchTerm)
        )
      );
    }
    
    // Apply sorting
    if (filters.sortBy) {
      const sortColumn = leads[filters.sortBy as keyof typeof leads] || leads.createdAt;
      if (filters.sortOrder === 'asc') {
        query = query.orderBy(asc(sortColumn));
      } else {
        query = query.orderBy(desc(sortColumn));
      }
    } else {
      query = query.orderBy(desc(leads.createdAt));
    }
    
    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }
  
  async createLead(insertLead: InsertLead): Promise<Lead> {
    try {
      console.log('Creating lead with data:', insertLead);
      
      // Get the latest lead ID to generate the next sequential ID
      const [latestLead] = await db
        .select()
        .from(leads)
        .where(like(leads.leadId, `${getCurrentYearPrefix()}%`))
        .orderBy(desc(leads.id))
        .limit(1);
      
      console.log('Latest lead found:', latestLead);
      
      // Extract the number from the latest lead ID or start from 0
      const lastLeadNumber = latestLead ? extractLeadNumber(latestLead.leadId) : 0;
      console.log('Last lead number:', lastLeadNumber);
      
      // Generate a new lead ID
      const newLeadId = generateLeadId(lastLeadNumber);
      console.log('Generated new lead ID:', newLeadId);
      
      // Insert the lead with the generated ID
      const [lead] = await db
        .insert(leads)
        .values({
          ...insertLead,
          leadId: newLeadId,
          updatedAt: new Date()
        })
        .returning();
      
      console.log('Created lead:', lead);
      return lead;
    } catch (error) {
      console.error('Error in createLead:', error);
      throw error;
    }
  }
  
  async updateLead(id: number, leadData: Partial<InsertLead>): Promise<Lead | undefined> {
    const [lead] = await db
      .update(leads)
      .set({
        ...leadData,
        updatedAt: new Date()
      })
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }
  
  async deleteLead(id: number): Promise<boolean> {
    try {
      console.log(`Starting deletion of lead ID: ${id}`);
      
      // Check for related calls
      const relatedCalls = await db.select().from(calls).where(eq(calls.leadId, id));
      console.log(`Found ${relatedCalls.length} related calls to delete`);
      
      // First delete any related calls to the lead
      await db
        .delete(calls)
        .where(eq(calls.leadId, id));
      console.log('Related calls deleted');
      
      // Check for scheduled calls
      const relatedScheduledCalls = await db.select().from(scheduledCalls).where(eq(scheduledCalls.leadId, id));
      console.log(`Found ${relatedScheduledCalls.length} related scheduled calls to delete`);
      
      // Then delete any scheduled calls for the lead
      await db
        .delete(scheduledCalls)
        .where(eq(scheduledCalls.leadId, id));
      console.log('Related scheduled calls deleted');
      
      // Check for timesheets
      const relatedTimesheets = await db.select().from(timesheets).where(eq(timesheets.leadId, id));
      console.log(`Found ${relatedTimesheets.length} related timesheets to delete`);
      
      // Delete any timesheets associated with the lead
      await db
        .delete(timesheets)
        .where(eq(timesheets.leadId, id));
      console.log('Related timesheets deleted');
      
      // Finally delete the lead itself
      await db
        .delete(leads)
        .where(eq(leads.id, id));
      console.log('Lead deleted successfully');
      
      return true;
    } catch (error) {
      console.error('Error in deleteLead:', error);
      throw error;
    }
  }
  
  // Call methods
  async getCall(id: number): Promise<Call | undefined> {
    const [call] = await db.select().from(calls).where(eq(calls.id, id));
    return call;
  }
  
  async getCalls(leadId?: number, userId?: number): Promise<Call[]> {
    let query = db.select().from(calls);
    
    if (leadId) {
      query = query.where(eq(calls.leadId, leadId));
    }
    
    if (userId) {
      query = query.where(eq(calls.userId, userId));
    }
    
    return await query.orderBy(desc(calls.callTime));
  }
  
  async createCall(insertCall: InsertCall): Promise<Call> {
    const [call] = await db
      .insert(calls)
      .values(insertCall)
      .returning();
    return call;
  }
  
  async deleteCall(id: number): Promise<boolean> {
    try {
      await db
        .delete(calls)
        .where(eq(calls.id, id));
      return true;
    } catch (error) {
      console.error('Error in deleteCall:', error);
      throw error;
    }
  }
  
  // Scheduled Call methods
  async getScheduledCall(id: number): Promise<ScheduledCall | undefined> {
    const [call] = await db
      .select()
      .from(scheduledCalls)
      .where(eq(scheduledCalls.id, id));
    return call;
  }
  
  async getScheduledCalls(filters: ScheduledCallFilters = {}): Promise<ScheduledCall[]> {
    let query = db.select().from(scheduledCalls);
    
    if (filters.status) {
      query = query.where(eq(scheduledCalls.status, filters.status));
    }
    
    if (filters.userId) {
      query = query.where(eq(scheduledCalls.assignedCallerId, filters.userId));
    }
    
    if (filters.startDate) {
      query = query.where(gte(scheduledCalls.scheduledTime, filters.startDate));
    }
    
    if (filters.endDate) {
      query = query.where(sql`${scheduledCalls.scheduledTime} <= ${filters.endDate}`);
    }
    
    return await query.orderBy(asc(scheduledCalls.scheduledTime));
  }
  
  async createScheduledCall(insertScheduledCall: InsertScheduledCall): Promise<ScheduledCall> {
    const [scheduledCall] = await db
      .insert(scheduledCalls)
      .values({
        ...insertScheduledCall,
        updatedAt: new Date()
      })
      .returning();
    return scheduledCall;
  }
  
  async updateScheduledCall(
    id: number, 
    scheduledCallData: Partial<InsertScheduledCall>
  ): Promise<ScheduledCall | undefined> {
    const [scheduledCall] = await db
      .update(scheduledCalls)
      .set({
        ...scheduledCallData,
        updatedAt: new Date()
      })
      .where(eq(scheduledCalls.id, id))
      .returning();
    return scheduledCall;
  }
  
  async deleteScheduledCall(id: number): Promise<boolean> {
    try {
      await db
        .delete(scheduledCalls)
        .where(eq(scheduledCalls.id, id));
      return true;
    } catch (error) {
      console.error('Error in deleteScheduledCall:', error);
      throw error;
    }
  }
  
  // Team member methods
  async getTeamMember(userId: number): Promise<TeamMember | undefined> {
    const [teamMember] = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));
    return teamMember;
  }
  
  async createOrUpdateTeamMember(insertTeamMember: InsertTeamMember): Promise<TeamMember> {
    // Check if team member exists
    const existingMember = await this.getTeamMember(insertTeamMember.userId);
    
    if (existingMember) {
      // Update existing team member
      const [teamMember] = await db
        .update(teamMembers)
        .set({
          ...insertTeamMember,
          lastActivityAt: new Date()
        })
        .where(eq(teamMembers.userId, insertTeamMember.userId))
        .returning();
      return teamMember;
    } else {
      // Create new team member
      const [teamMember] = await db
        .insert(teamMembers)
        .values({
          ...insertTeamMember,
          lastActivityAt: new Date()
        })
        .returning();
      return teamMember;
    }
  }
  
  // Activity methods
  async getActivities(limit: number = 100, offset: number = 0): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .orderBy(desc(activities.createdAt))
      .limit(limit)
      .offset(offset);
  }
  
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  // Timesheet methods
  async getTimesheet(id: number): Promise<Timesheet | undefined> {
    const [timesheet] = await db
      .select()
      .from(timesheets)
      .where(eq(timesheets.id, id));
    return timesheet;
  }
  
  async getTimesheets(filters: TimesheetFilters = {}): Promise<Timesheet[]> {
    let query = db.select().from(timesheets);
    
    if (filters.userId) {
      query = query.where(eq(timesheets.userId, filters.userId));
    }
    
    if (filters.startDate) {
      query = query.where(gte(timesheets.date, filters.startDate));
    }
    
    if (filters.endDate) {
      query = query.where(sql`${timesheets.date} <= ${filters.endDate}`);
    }
    
    if (filters.approved !== undefined) {
      query = query.where(eq(timesheets.approved, filters.approved));
    }
    
    return await query.orderBy(desc(timesheets.date));
  }
  
  async createTimesheet(insertTimesheet: InsertTimesheet): Promise<Timesheet> {
    const [timesheet] = await db
      .insert(timesheets)
      .values(insertTimesheet)
      .returning();
    return timesheet;
  }
  
  async updateTimesheet(id: number, timesheetData: Partial<InsertTimesheet>): Promise<Timesheet | undefined> {
    const [timesheet] = await db
      .update(timesheets)
      .set(timesheetData)
      .where(eq(timesheets.id, id))
      .returning();
    return timesheet;
  }
  
  async deleteTimesheet(id: number): Promise<boolean> {
    try {
      await db
        .delete(timesheets)
        .where(eq(timesheets.id, id));
      return true;
    } catch (error) {
      console.error('Error in deleteTimesheet:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
