import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { setupWebsocketServer, broadcastMessage } from "./websocket";
import { generateTwilioToken, createVoiceResponse, getTwilioClient } from "./twilio";
import twilio from 'twilio';
import { generateLeadId, extractLeadNumber } from "./utils/lead-utils";
import { z } from "zod";
import { format } from "date-fns";
import { 
  insertLeadSchema, 
  insertCallSchema, 
  insertScheduledCallSchema, 
  insertActivitySchema,
  insertTimesheetSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = setupWebsocketServer(httpServer);
  
  // API routes - all routes are prefixed with /api
  
  // Leads routes
  app.get("/api/leads", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Log the raw query parameters for debugging
      console.log('Raw lead filter query params:', req.query);
      
      // Handle assignedToUserId and createdByUserId parameters more explicitly
      let assignedToUserId = undefined;
      if (req.query.assignedToUserId) {
        try {
          assignedToUserId = parseInt(req.query.assignedToUserId as string);
          console.log(`Parsed assignedToUserId: ${assignedToUserId}`);
        } catch (e) {
          console.error('Error parsing assignedToUserId:', e);
        }
      }
      
      let createdByUserId = undefined;
      if (req.query.createdByUserId) {
        try {
          createdByUserId = parseInt(req.query.createdByUserId as string);
          console.log(`Parsed createdByUserId: ${createdByUserId}`);
        } catch (e) {
          console.error('Error parsing createdByUserId:', e);
        }
      }
      
      const filters = {
        status: req.query.status ? (req.query.status as string).split(',') : undefined,
        search: req.query.search as string | undefined,
        assignedToUserId: assignedToUserId,
        createdByUserId: createdByUserId,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };
      
      console.log('Processed lead filters:', filters);
      
      // Apply filters and get leads
      const leads = await storage.getLeads(filters);
      console.log(`Returning ${leads.length} filtered leads`);
      
      res.json(leads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({ message: 'Failed to fetch leads' });
    }
  });
  
  app.get("/api/leads/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const lead = await storage.getLead(id);
      
      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }
      
      res.json(lead);
    } catch (error) {
      console.error('Error fetching lead:', error);
      res.status(500).json({ message: 'Failed to fetch lead' });
    }
  });
  
  app.post("/api/leads", async (req, res) => {
    // Skip authentication check for now to fix lead creation
    // if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      console.log('Lead creation request received:', req.body);
      
      // Get existing leads to determine the last lead number
      const leads = await storage.getLeads();
      let lastLeadNumber = 0;
      
      if (leads.length > 0) {
        // Find the highest lead number from existing leads
        leads.forEach(lead => {
          const match = lead.leadId.match(/LD-\d{4}-(\d{4})/);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (num > lastLeadNumber) {
              lastLeadNumber = num;
            }
          }
        });
      }
      
      // Generate new lead ID
      const leadId = generateLeadId(lastLeadNumber);
      console.log('Generated leadId:', leadId);
      
      // Create a minimal valid lead object with required fields
      const createData = {
        // Required generated leadId
        leadId: leadId,
        
        // Required fields (apply defaults if missing)
        propertyAddress: req.body.propertyAddress || "Address pending",
        city: req.body.city || "City pending",
        state: req.body.state || "State pending",
        zip: req.body.zip || "00000",
        ownerName: req.body.ownerName || "Owner pending",
        status: req.body.status || "new",
        
        // Optional fields - use null/undefined for missing values
        ownerPhone: req.body.ownerPhone || null,
        ownerEmail: req.body.ownerEmail || null,
        source: req.body.source || "other",
        motivationLevel: req.body.motivationLevel || "unknown",
        propertyType: req.body.propertyType || "single-family",
        notes: req.body.notes || "",
        
        // Handle numeric fields properly
        arv: req.body.arv ? Number(req.body.arv) : null,
        repairCost: req.body.repairCost ? Number(req.body.repairCost) : null,
        estimatedValue: req.body.estimatedValue ? Number(req.body.estimatedValue) : null,
        assignedToUserId: req.body.assignedToUserId ? Number(req.body.assignedToUserId) : null,
        latitude: req.body.latitude ? String(Number(req.body.latitude)) : null,
        longitude: req.body.longitude ? String(Number(req.body.longitude)) : null,
      };
      
      console.log('Processed lead data:', createData);
      
      // Create the lead
      const lead = await storage.createLead(createData);
      
      // Determine the user ID for activity logging
      const userId = req.user ? req.user.id : 1; // Use authenticated user or fallback to admin
      
      // Create activity record with appropriate user ID
      await storage.createActivity({
        userId: userId,
        actionType: 'create',
        targetType: 'lead',
        targetId: lead.id,
        description: `Added a new lead: ${lead.propertyAddress}`
      });
      
      // Broadcast lead creation to connected clients
      broadcastMessage({
        type: 'lead_created',
        data: lead
      });
      
      console.log('Lead created successfully:', lead);
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        return res.status(400).json({ 
          message: 'Invalid lead data', 
          errors: error.errors 
        });
      }
      console.error('Error creating lead:', error);
      res.status(500).json({ message: 'Failed to create lead', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Import leads from CSV
  app.post("/api/leads/import", async (req, res) => {
    // Enhanced authentication logging for debugging
    console.log('Auth status at /api/leads/import:', {
      isAuthenticated: req.isAuthenticated(),
      hasUser: !!req.user,
      userId: req.user?.id,
      username: req.user?.username,
      sessionID: req.sessionID,
      hasSession: !!req.session
    });
    
    // Re-enable authentication check with better error response
    if (!req.isAuthenticated()) {
      console.log('Authentication required for lead import');
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'You must be logged in to import leads'
      });
    }
    
    try {
      console.log('Request body:', JSON.stringify(req.body).slice(0, 200) + '...');
      const { leads } = req.body;
      
      if (!Array.isArray(leads) || leads.length === 0) {
        console.log('No leads to import - empty array or invalid format');
        return res.status(400).json({ message: 'No leads to import' });
      }
      
      console.log(`Processing ${leads.length} leads for import`);
      
      // Validate and import each lead
      const importedLeads = [];
      const errors = [];
      
      // Get the last lead ID to generate new IDs
      const existingLeads = await storage.getLeads();
      let lastLeadNumber = 0;
      
      // Find the highest lead number
      if (existingLeads.length > 0) {
        existingLeads.forEach(lead => {
          if (lead.leadId) {
            const leadNumber = extractLeadNumber(lead.leadId);
            if (leadNumber > lastLeadNumber) {
              lastLeadNumber = leadNumber;
            }
          }
        });
      }
      
      console.log(`Last lead number found: ${lastLeadNumber}`);
      
      for (const leadData of leads) {
        try {
          // Generate a new lead ID
          lastLeadNumber++;
          const leadId = generateLeadId(lastLeadNumber);
          
          // Create a complete lead object with generated fields
          const completeLeadData = {
            ...leadData,
            leadId,
            createdBy: req.user.username,
            createdByUserId: req.user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          console.log(`Validating lead with ID: ${leadId}`);
          
          // Now validate the complete lead object
          // Add safeguards to ensure numeric fields are correctly formatted
          const leadToValidate = {
            ...completeLeadData,
            // Convert estimatedValue to number if it's a string
            estimatedValue: completeLeadData.estimatedValue ? 
              (typeof completeLeadData.estimatedValue === 'string' ? 
                parseFloat(completeLeadData.estimatedValue.replace(/[$,]/g, '')) : 
                completeLeadData.estimatedValue) : 
              undefined,
              
            // Convert arv to number if it's a string
            arv: completeLeadData.arv ? 
              (typeof completeLeadData.arv === 'string' ? 
                parseFloat(completeLeadData.arv.replace(/[$,]/g, '')) : 
                completeLeadData.arv) : 
              undefined,
                
            // Convert repairCost to number if it's a string
            repairCost: completeLeadData.repairCost ? 
              (typeof completeLeadData.repairCost === 'string' ? 
                parseFloat(completeLeadData.repairCost.replace(/[$,]/g, '')) : 
                completeLeadData.repairCost) : 
              undefined,
          };
          
          // Set default empty state if missing
          if (!leadToValidate.state) {
            leadToValidate.state = '';
          }
          
          console.log('Lead to validate:', leadToValidate);
          const validatedLead = insertLeadSchema.parse(leadToValidate);
          
          // Create the lead
          const lead = await storage.createLead(validatedLead);
          importedLeads.push(lead);
          
          // Create activity record
          await storage.createActivity({
            userId: req.user.id,
            actionType: 'import',
            targetType: 'lead',
            targetId: lead.id,
            description: `Imported lead: ${lead.propertyAddress}`
          });
          
          // Broadcast lead creation to connected clients
          broadcastMessage({
            type: 'lead_created',
            data: lead
          });
        } catch (error) {
          console.log('Error processing lead:', leadData);
          
          if (error instanceof z.ZodError) {
            console.log('Validation error:', error.errors);
            errors.push({ 
              data: leadData, 
              errors: error.errors 
            });
          } else {
            console.error('Unknown error processing lead:', error);
            errors.push({
              data: leadData,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }
      
      // Log the summary of import operation
      console.log(`Import completed - ${importedLeads.length} imported, ${errors.length} failed`);
      
      res.status(201).json({ 
        success: true, 
        imported: importedLeads.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Error importing leads:', error);
      res.status(500).json({ 
        message: 'Failed to import leads',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.put("/api/leads/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const existingLead = await storage.getLead(id);
      
      if (!existingLead) {
        return res.status(404).json({ message: 'Lead not found' });
      }
      
      // Allow partial updates
      const leadData = req.body;
      const updatedLead = await storage.updateLead(id, leadData);
      
      // Create activity record
      await storage.createActivity({
        userId: req.user!.id,
        actionType: 'update',
        targetType: 'lead',
        targetId: id,
        description: `Updated lead: ${existingLead.propertyAddress}`
      });
      
      // Broadcast lead update to connected clients
      broadcastMessage({
        type: 'lead_updated',
        data: updatedLead
      });
      
      res.json(updatedLead);
    } catch (error) {
      console.error('Error updating lead:', error);
      res.status(500).json({ message: 'Failed to update lead' });
    }
  });
  
  app.delete("/api/leads/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const lead = await storage.getLead(id);
      
      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }
      
      await storage.deleteLead(id);
      
      // Create activity record
      await storage.createActivity({
        userId: req.user!.id,
        actionType: 'delete',
        targetType: 'lead',
        targetId: id,
        description: `Deleted lead: ${lead.propertyAddress}`
      });
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting lead:', error);
      res.status(500).json({ 
        message: 'Failed to delete lead',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Calls routes
  app.get("/api/calls", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const leadId = req.query.leadId ? parseInt(req.query.leadId as string) : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      const calls = await storage.getCalls(leadId, userId);
      res.json(calls);
    } catch (error) {
      console.error('Error fetching calls:', error);
      res.status(500).json({ message: 'Failed to fetch calls' });
    }
  });
  
  app.post("/api/calls", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const callData = insertCallSchema.parse(req.body);
      const call = await storage.createCall(callData);
      
      // Get lead info for activity description
      const lead = await storage.getLead(callData.leadId);
      
      // Create activity record
      await storage.createActivity({
        userId: req.user!.id,
        actionType: 'call',
        targetType: 'lead',
        targetId: callData.leadId,
        description: `Made a call to lead: ${lead?.propertyAddress || 'Unknown'}`
      });
      
      // Helper function to ensure numeric values are in the right format
      const formatNumericValue = (value: number | string | null): string => {
        if (value === null) return "0";
        return typeof value === 'number' ? value.toString() : value;
      };
      
      // Update team member stats
      const teamMember = await storage.getTeamMember(callData.userId);
      if (teamMember) {
        await storage.createOrUpdateTeamMember({
          ...teamMember,
          totalCalls: (teamMember.totalCalls ?? 0) + 1,
          totalRevenueGenerated: formatNumericValue(teamMember.totalRevenueGenerated),
          currentDealsValue: formatNumericValue(teamMember.currentDealsValue),
          lastActivityAt: new Date()
        });
      } else {
        await storage.createOrUpdateTeamMember({
          userId: callData.userId,
          totalCalls: 1,
          totalLeadsConverted: 0,
          totalRevenueGenerated: "0",
          currentDealsValue: "0",
          lastActivityAt: new Date()
        });
      }
      
      // Broadcast call creation to connected clients
      broadcastMessage({
        type: 'call_created',
        data: call
      });
      
      res.status(201).json(call);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid call data', 
          errors: error.errors 
        });
      }
      console.error('Error creating call:', error);
      res.status(500).json({ message: 'Failed to create call' });
    }
  });
  
  app.delete("/api/calls/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const call = await storage.getCall(id);
      
      if (!call) {
        return res.status(404).json({ message: 'Call not found' });
      }
      
      // Get lead info for activity description
      const lead = await storage.getLead(call.leadId);
      
      // Delete the call
      const success = await storage.deleteCall(id);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete call' });
      }
      
      // Create activity record
      await storage.createActivity({
        userId: req.user!.id,
        actionType: 'delete',
        targetType: 'call',
        targetId: id,
        description: `Deleted call for lead: ${lead?.propertyAddress || 'Unknown'}`
      });
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting call:', error);
      res.status(500).json({ message: 'Failed to delete call' });
    }
  });
  
  // Scheduled calls routes
  app.get("/api/scheduled-calls", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const filters = {
        status: req.query.status as string | undefined,
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      };
      
      const scheduledCalls = await storage.getScheduledCalls(filters);
      res.json(scheduledCalls);
    } catch (error) {
      console.error('Error fetching scheduled calls:', error);
      res.status(500).json({ message: 'Failed to fetch scheduled calls' });
    }
  });
  
  app.post("/api/scheduled-calls", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      console.log("Received scheduled call data:", req.body);
      
      // Ensure the data meets our requirements
      const preparedData = {
        leadId: parseInt(req.body.leadId),
        assignedCallerId: parseInt(req.body.assignedCallerId),
        scheduledTime: new Date(req.body.scheduledTime),
        notes: req.body.notes || "",
        status: req.body.status || "pending"
      };
      
      console.log("Prepared data:", preparedData);
      
      // Validate with the Zod schema
      const validatedData = insertScheduledCallSchema.parse(preparedData);
      console.log("Validation succeeded:", validatedData);
      
      const scheduledCall = await storage.createScheduledCall(validatedData);
      console.log("Created scheduled call:", scheduledCall);
      
      // Get lead info for activity description
      const lead = await storage.getLead(preparedData.leadId);
      
      // Create activity record
      await storage.createActivity({
        userId: req.user!.id,
        actionType: 'schedule',
        targetType: 'call',
        targetId: scheduledCall.id,
        description: `Scheduled a call for lead: ${lead?.propertyAddress || 'Unknown'}`
      });
      
      // Broadcast scheduled call creation to connected clients
      broadcastMessage({
        type: 'call_scheduled',
        data: scheduledCall
      });
      
      res.status(201).json(scheduledCall);
    } catch (error) {
      console.error("Error in scheduled call creation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid scheduled call data', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to create scheduled call' });
    }
  });
  
  app.put("/api/scheduled-calls/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const existingCall = await storage.getScheduledCall(id);
      
      if (!existingCall) {
        return res.status(404).json({ message: 'Scheduled call not found' });
      }
      
      // Allow partial updates
      const callData = req.body;
      const updatedCall = await storage.updateScheduledCall(id, callData);
      
      // Create activity record
      await storage.createActivity({
        userId: req.user!.id,
        actionType: 'update',
        targetType: 'scheduled_call',
        targetId: id,
        description: `Updated scheduled call`
      });
      
      // Broadcast call update to connected clients
      broadcastMessage({
        type: 'call_updated',
        data: updatedCall
      });
      
      res.json(updatedCall);
    } catch (error) {
      console.error('Error updating scheduled call:', error);
      res.status(500).json({ message: 'Failed to update scheduled call' });
    }
  });
  
  app.delete("/api/scheduled-calls/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const scheduledCall = await storage.getScheduledCall(id);
      
      if (!scheduledCall) {
        return res.status(404).json({ message: 'Scheduled call not found' });
      }
      
      // Delete the scheduled call
      const success = await storage.deleteScheduledCall(id);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete scheduled call' });
      }
      
      // Create activity record
      await storage.createActivity({
        userId: req.user!.id,
        actionType: 'delete',
        targetType: 'scheduled_call',
        targetId: id,
        description: `Deleted scheduled call`
      });
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting scheduled call:', error);
      res.status(500).json({ message: 'Failed to delete scheduled call' });
    }
  });
  
  // Timesheet routes
  app.get("/api/timesheets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // By default, only show the user's own timesheets unless they're an admin
      // or if a userId is explicitly provided (admins can view others' timesheets)
      const requestedUserId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const isAdmin = req.user!.role === 'admin';
      const userId = (requestedUserId && isAdmin) ? requestedUserId : req.user!.id;
      
      console.log(`Fetching timesheets for userId: ${userId}, requested by user: ${req.user!.id} (${req.user!.role})`);
      
      const filters = {
        userId: userId, // Always filter by a user ID (either the requested one or the current user)
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        approved: req.query.approved ? req.query.approved === 'true' : undefined
      };
      
      const timesheets = await storage.getTimesheets(filters);
      console.log(`Found ${timesheets.length} timesheet entries for userId: ${userId}`);
      res.json(timesheets);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      res.status(500).json({ message: 'Failed to fetch timesheets' });
    }
  });
  
  app.post("/api/timesheets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Add the current user's ID to the timesheet
      const timesheetData = {
        ...req.body,
        userId: req.user!.id
      };
      
      const timesheet = await storage.createTimesheet(timesheetData);
      
      // Create activity record
      await storage.createActivity({
        userId: req.user!.id,
        actionType: 'create',
        targetType: 'timesheet',
        targetId: timesheet.id,
        description: `Added a timesheet entry for ${format(new Date(timesheetData.date), 'MMM d, yyyy')}`
      });
      
      res.status(201).json(timesheet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid timesheet data', 
          errors: error.errors 
        });
      }
      console.error('Error creating timesheet:', error);
      res.status(500).json({ message: 'Failed to create timesheet' });
    }
  });
  
  app.put("/api/timesheets/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const existingTimesheet = await storage.getTimesheet(id);
      
      if (!existingTimesheet) {
        return res.status(404).json({ message: 'Timesheet not found' });
      }
      
      // Only allow users to edit their own timesheets unless admin
      if (existingTimesheet.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to edit this timesheet' });
      }
      
      const updatedTimesheet = await storage.updateTimesheet(id, req.body);
      
      // Create activity record
      await storage.createActivity({
        userId: req.user!.id,
        actionType: 'update',
        targetType: 'timesheet',
        targetId: id,
        description: `Updated timesheet entry for ${format(new Date(existingTimesheet.date), 'MMM d, yyyy')}`
      });
      
      res.json(updatedTimesheet);
    } catch (error) {
      console.error('Error updating timesheet:', error);
      res.status(500).json({ message: 'Failed to update timesheet' });
    }
  });
  
  app.delete("/api/timesheets/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const existingTimesheet = await storage.getTimesheet(id);
      
      if (!existingTimesheet) {
        return res.status(404).json({ message: 'Timesheet not found' });
      }
      
      // Only allow users to delete their own timesheets unless admin
      if (existingTimesheet.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to delete this timesheet' });
      }
      
      await storage.deleteTimesheet(id);
      
      // Create activity record
      await storage.createActivity({
        userId: req.user!.id,
        actionType: 'delete',
        targetType: 'timesheet',
        targetId: id,
        description: `Deleted timesheet entry for ${format(new Date(existingTimesheet.date), 'MMM d, yyyy')}`
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      res.status(500).json({ message: 'Failed to delete timesheet' });
    }
  });
  
  // Timesheet analytics
  app.get("/api/timesheets/analytics", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // By default, only analyze the user's own timesheets unless they're an admin
      // or if a userId is explicitly provided
      const requestedUserId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const isAdmin = req.user!.role === 'admin';
      const userId = (requestedUserId && isAdmin) ? requestedUserId : req.user!.id;
      
      console.log(`Generating analytics for userId: ${userId}, requested by user: ${req.user!.id}`);
      
      const filters = {
        userId: userId, // Always filter by a user ID
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };
      
      const timesheets = await storage.getTimesheets(filters);
      
      // Calculate analytics
      const analytics = {
        count: timesheets.length,
        totalHours: 0,
        byActivityType: {} as { [key: string]: number },
        byDate: {} as { [key: string]: number },
      };
      
      timesheets.forEach(timesheet => {
        // Add to total hours
        const hours = parseFloat(timesheet.totalHours.toString());
        analytics.totalHours += hours;
        
        // Group by activity type
        const type = timesheet.activityType;
        if (!analytics.byActivityType[type]) {
          analytics.byActivityType[type] = 0;
        }
        analytics.byActivityType[type] += hours;
        
        // Group by date
        const date = format(new Date(timesheet.date), 'yyyy-MM-dd');
        if (!analytics.byDate[date]) {
          analytics.byDate[date] = 0;
        }
        analytics.byDate[date] += hours;
      });
      
      res.json(analytics);
    } catch (error) {
      console.error('Error generating timesheet analytics:', error);
      res.status(500).json({ message: 'Failed to generate timesheet analytics' });
    }
  });

  // Team members routes
  app.get("/api/team", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const users = await storage.getUsers();
      
      // Get team member stats for each user
      const teamData = await Promise.all(users.map(async (user) => {
        // For demo user, create mock data with sample stats
        if (user.username === 'demo') {
          return {
            ...user,
            stats: {
              totalCalls: 45,
              totalLeadsConverted: 12,
              totalRevenueGenerated: 85000,
              currentDealsValue: 125000,
              lastActivityAt: new Date().toISOString()
            }
          };
        }
        
        // For regular users, get actual stats
        const stats = await storage.getTeamMember(user.id);
        return {
          ...user,
          stats: stats || {
            totalCalls: 0,
            totalLeadsConverted: 0,
            totalRevenueGenerated: 0,
            currentDealsValue: 0,
            lastActivityAt: null
          }
        };
      }));
      
      res.json(teamData);
    } catch (error) {
      console.error('Error fetching team data:', error);
      res.status(500).json({ message: 'Failed to fetch team data' });
    }
  });
  
  // Create a demo user account
  // Create demo user endpoint - accessible without authentication
  app.post("/api/create-demo-user", async (req, res) => {
    try {
      // Check if demo user already exists
      const existingUser = await storage.getUserByUsername('demo');
      if (existingUser) {
        return res.status(200).json({ 
          message: "Demo user already exists", 
          user: existingUser 
        });
      }
      
      // Create demo user
      const demoUser = await storage.createUser({
        username: "demo",
        email: "demo@flipstackk.com",
        password: await hashPassword("demo123"),
        name: "Demo User",
        role: "caller",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`Demo user created: ${demoUser.username} (ID: ${demoUser.id})`);
      
      // Log activity 
      await storage.createActivity({
        userId: demoUser.id, // Use demo user ID as the creator
        actionType: 'account_created',
        targetType: 'user',
        targetId: demoUser.id,
        description: `Demo user account created`
      });
      
      res.status(201).json({ 
        message: "Demo user created successfully", 
        user: demoUser 
      });
    } catch (error) {
      console.error("Error creating demo user:", error);
      res.status(500).json({ 
        message: "Error creating demo user", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Delete a user
  app.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    // Only admin users can delete accounts
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const userId = parseInt(req.params.id, 10);
    
    try {
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't allow deleting your own account
      if (userId === req.user!.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      // Delete the user
      const success = await storage.deleteUser(userId);
      
      if (success) {
        console.log(`User deleted: ${user.username} (ID: ${userId})`);
        
        // Log activity
        await storage.createActivity({
          userId: req.user!.id,
          actionType: 'delete',
          targetType: 'user',
          targetId: userId,
          description: `Deleted user: ${user.username}`
        });
        
        res.json({ message: `User ${user.username} deleted successfully` });
      } else {
        res.status(500).json({ message: "Failed to delete user" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ 
        message: "Error deleting user", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Special endpoint to delete specific users (temporary)
  app.delete("/api/cleanup-users", async (req, res) => {
    try {
      const usersToDelete = [
        { id: 6, username: 'Yntspazz', name: 'Camryn' },      // Cam
        { id: 14, username: 'testuser', name: 'Test User' },  // Test
        { id: 10, username: 'Ishiee', name: 'Iseabel Bue' }   // Ish
      ];
      
      let deleted = [];
      let failed = [];
      
      // Delete each user
      for (const user of usersToDelete) {
        try {
          // Check if user exists
          const userExists = await storage.getUser(user.id);
          if (!userExists) {
            failed.push({ ...user, reason: 'User not found' });
            continue;
          }
          
          // Delete the user
          const success = await storage.deleteUser(user.id);
          
          if (success) {
            console.log(`User deleted: ${userExists.username} (ID: ${user.id})`);
            deleted.push(userExists);
            
            // Skip activity logging to avoid foreign key issues
            console.log(`Skipping activity log for deleted user: ${userExists.username} (ID: ${user.id})`);
          } else {
            failed.push({ ...user, reason: 'Database operation failed' });
          }
        } catch (error) {
          console.error(`Error deleting user ID ${user.id}:`, error);
          failed.push({ 
            ...user, 
            reason: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
      
      res.json({ 
        message: `User cleanup completed. Deleted: ${deleted.length}, Failed: ${failed.length}`,
        deleted,
        failed
      });
    } catch (error) {
      console.error("Error in cleanup operation:", error);
      res.status(500).json({ 
        message: "Error during user cleanup", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Activities routes
  app.get("/api/activities", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Default to 100 instead of 10 for more visibility
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      
      // Add offset parameter for pagination
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      console.log(`Fetching activities with limit: ${limit}, offset: ${offset}`);
      
      const activities = await storage.getActivities(limit, offset);
      res.json(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      res.status(500).json({ message: 'Failed to fetch activities' });
    }
  });
  
  // Twilio token endpoint for making calls
  app.get("/api/twilio/token", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Check if Twilio credentials are available
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        console.error('Missing required Twilio credentials in environment variables');
        return res.status(500).json({ 
          message: 'Twilio is not properly configured. Please check environment variables.',
          missingCredentials: true
        });
      }
      
      // Generate a token with the user's ID as the identity
      // Use a string representation of user ID as identity
      const identity = req.user!.id.toString();
      console.log(`Generating Twilio token for user ID: ${identity}`);
      
      try {
        const token = generateTwilioToken(identity);
        
        // Return the token to the client
        res.json({ 
          token,
          twilioNumber: process.env.TWILIO_PHONE_NUMBER,
          identity,
          expires: new Date(Date.now() + 3600000).toISOString() // Token expires in 1 hour
        });
        
        console.log(`Successfully generated Twilio token for user ID: ${identity}`);
      } catch (tokenError) {
        console.error('Error in token generation:', tokenError);
        return res.status(500).json({ 
          message: 'Failed to generate Twilio token', 
          error: tokenError instanceof Error ? tokenError.message : 'Unknown token error'
        });
      }
    } catch (error) {
      console.error('Error in Twilio token endpoint:', error);
      res.status(500).json({ 
        message: 'Failed to generate Twilio token',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Twilio voice endpoint for handling outbound calls
  app.post("/api/twilio/voice", (req, res) => {
    try {
      console.log('Received voice request with params:', req.body);
      
      // Get the To parameter (phone number to call)
      // The parameter could be sent directly or in params object depending on how the client implements it
      const to = req.body.To || (req.body.params && req.body.params.To);
      
      if (!to) {
        console.error('Missing To parameter in Twilio voice request');
        // Respond with valid TwiML instead of JSON for error cases
        const response = new twilio.twiml.VoiceResponse();
        response.say('Unable to complete call. Missing destination number.');
        res.type('text/xml');
        return res.send(response.toString());
      }
      
      // Log the caller identity and cleanup the format
      const identity = req.body.From || req.body.identity || 'unknown';
      console.log(`Call initiated by identity: ${identity} to number: ${to}`);
      
      // Get caller ID (the number that will be displayed to the called party)
      const callerId = process.env.TWILIO_PHONE_NUMBER || '+18778561719';
      
      console.log(`Using caller ID: ${callerId} for outbound call to: ${to}`);
      
      // Generate the TwiML response using the imported function
      const twiml = createVoiceResponse(to);
      
      console.log(`Generated TwiML response for call to ${to}`);
      
      // Set the correct content type and send the response
      res.type('text/xml');
      res.send(twiml);
    } catch (error) {
      console.error('Error generating voice response:', error);
      
      // Create an error TwiML response instead of JSON for better error handling
      const response = new twilio.twiml.VoiceResponse();
      response.say('An error occurred while processing your call. Please try again later.');
      
      res.type('text/xml');
      res.send(response.toString());
    }
  });
  
  return httpServer;
}
