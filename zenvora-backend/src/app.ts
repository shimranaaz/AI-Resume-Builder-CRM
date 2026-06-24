import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import { apiRateLimiter } from "./middleware/rateLimit.middleware";
import { errorMiddleware } from "./middleware/error.middleware";
import leadRoutes from "./routes/lead.routes";
import callRoutes from "./routes/call.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import auditRoutes from "./routes/audit.routes";

dotenv.config();

const app: Application = express();

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(apiRateLimiter);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/leads", leadRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit", auditRoutes);

// Health Check
app.get("/", (req, res) => {
  res.json({ success: true, message: "Zenvora CRM API is running" });
});

// Error Middleware
app.use(errorMiddleware);

export default app;