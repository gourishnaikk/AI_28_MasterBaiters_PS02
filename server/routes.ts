import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { employeeSchema } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";

// Extend the session interface to include our custom properties
declare module 'express-session' {
  interface Session {
    employeeId?: string;
  }
}

// JWT secret key - in production this should be an env var
const JWT_SECRET = process.env.JWT_SECRET || "idms-infotech-secret-key";
const SESSION_SECRET = process.env.SESSION_SECRET || "idms-session-secret";

// Login validation schema
const loginSchema = z.object({
  employeeId: z.string(),
  password: z.string(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware setup
  const SessionStore = MemoryStore(session);
  
  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));
  
  // Seed some employee data if it doesn't exist
  await seedEmployees();
  
  // API routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);
      
      // Find employee by employeeId
      const employee = await storage.getEmployeeByEmployeeId(validatedData.employeeId);
      
      if (!employee) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Check password
      const isPasswordValid = await bcrypt.compare(validatedData.password, employee.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Create session
      req.session.employeeId = employee.employeeId;
      
      // Create JWT token
      const token = jwt.sign(
        { id: employee.id, employeeId: employee.employeeId },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Send response without password
      const { password, ...employeeWithoutPassword } = employee;
      
      res.status(200).json({
        ...employeeWithoutPassword,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: 'Invalid request' });
    }
  });
  
  app.get('/api/auth/session', (req, res) => {
    if (req.session.employeeId) {
      res.status(200).json({ authenticated: true });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });
  
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      
      res.clearCookie('connect.sid');
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
  
  app.get('/api/employee/me', async (req, res) => {
    if (!req.session.employeeId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const employee = await storage.getEmployeeByEmployeeId(req.session.employeeId);
      
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      // Return employee without password
      const { password, ...employeeWithoutPassword } = employee;
      
      res.status(200).json(employeeWithoutPassword);
    } catch (error) {
      console.error('Get employee error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to seed some initial employee data
async function seedEmployees() {
  try {
    // Check if we already have some employees
    const existingEmployees = await storage.getEmployees();
    
    if (existingEmployees.length === 0) {
      // Hash passwords
      const salt = await bcrypt.genSalt(10);
      const hashedPassword1 = await bcrypt.hash('password123', salt);
      const hashedPassword2 = await bcrypt.hash('adminpass123', salt);
      
      // Create sample employees
      await storage.createEmployee({
        employeeId: 'IDMS123',
        password: hashedPassword1,
        name: 'John Smith',
        email: 'john.smith@idms.com',
        role: 'Developer'
      });
      
      await storage.createEmployee({
        employeeId: 'IDMS456',
        password: hashedPassword2,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@idms.com',
        role: 'Manager'
      });
      
      // Add special employee with ID 123 and password 123
      const simplePassword = await bcrypt.hash('123', salt);
      await storage.createEmployee({
        employeeId: '123',
        password: simplePassword,
        name: 'Test User',
        email: 'test@idms.com',
        role: 'Employee'
      });
      
      console.log('Sample employees created successfully');
    }
  } catch (error) {
    console.error('Error seeding employees:', error);
  }
}
