// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  users;
  employees;
  currentUserId;
  currentEmployeeId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.employees = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentEmployeeId = 1;
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  // Employee methods
  async getEmployees() {
    return Array.from(this.employees.values());
  }
  async getEmployee(id) {
    return this.employees.get(id);
  }
  async getEmployeeByEmployeeId(employeeId) {
    return Array.from(this.employees.values()).find(
      (employee) => employee.employeeId === employeeId
    );
  }
  async getEmployeeByEmail(email) {
    return Array.from(this.employees.values()).find(
      (employee) => employee.email === email
    );
  }
  async createEmployee(insertEmployee) {
    const id = this.currentEmployeeId++;
    const employee = { ...insertEmployee, id };
    this.employees.set(id, employee);
    return employee;
  }
};
var storage = new MemStorage();

// server/routes.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
var JWT_SECRET = process.env.JWT_SECRET || "idms-infotech-secret-key";
var SESSION_SECRET = process.env.SESSION_SECRET || "idms-session-secret";
var loginSchema = z.object({
  employeeId: z.string(),
  password: z.string()
});
async function registerRoutes(app2) {
  const SessionStore = MemoryStore(session);
  app2.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    },
    store: new SessionStore({
      checkPeriod: 864e5
      // prune expired entries every 24h
    })
  }));
  await seedEmployees();
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const employee = await storage.getEmployeeByEmployeeId(validatedData.employeeId);
      if (!employee) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isPasswordValid = await bcrypt.compare(validatedData.password, employee.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.employeeId = employee.employeeId;
      const token = jwt.sign(
        { id: employee.id, employeeId: employee.employeeId },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
      const { password, ...employeeWithoutPassword } = employee;
      res.status(200).json({
        ...employeeWithoutPassword,
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });
  app2.get("/api/auth/session", (req, res) => {
    if (req.session.employeeId) {
      res.status(200).json({ authenticated: true });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
  app2.get("/api/employee/me", async (req, res) => {
    if (!req.session.employeeId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const employee = await storage.getEmployeeByEmployeeId(req.session.employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      const { password, ...employeeWithoutPassword } = employee;
      res.status(200).json(employeeWithoutPassword);
    } catch (error) {
      console.error("Get employee error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
async function seedEmployees() {
  try {
    const existingEmployees = await storage.getEmployees();
    if (existingEmployees.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword1 = await bcrypt.hash("password123", salt);
      const hashedPassword2 = await bcrypt.hash("adminpass123", salt);
      await storage.createEmployee({
        employeeId: "IDMS123",
        password: hashedPassword1,
        name: "John Smith",
        email: "john.smith@idms.com",
        role: "Developer"
      });
      await storage.createEmployee({
        employeeId: "IDMS456",
        password: hashedPassword2,
        name: "Sarah Johnson",
        email: "sarah.johnson@idms.com",
        role: "Manager"
      });
      const simplePassword = await bcrypt.hash("123", salt);
      await storage.createEmployee({
        employeeId: "123",
        password: simplePassword,
        name: "Test User",
        email: "test@idms.com",
        role: "Employee"
      });
      console.log("Sample employees created successfully");
    }
  } catch (error) {
    console.error("Error seeding employees:", error);
  }
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var repoName = "AI_28_MasterBaiters_PS02";
var vite_config_default = defineConfig({
  // Set base path for GitHub Pages
  base: process.env.NODE_ENV === "production" ? `/${repoName}/` : "/",
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : [],
    {
      name: "html-transform",
      transformIndexHtml(html) {
        return html.replace(
          /%BASE_URL%/g,
          process.env.NODE_ENV === "production" ? `/${repoName}/` : "/"
        );
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000");
  server.listen({
    port,
    host: "0.0.0.0"
  }, () => {
    log(`serving on port ${port}`);
  });
})();
