// import express, {
//   type Request,
//   type Response,
//   type NextFunction,
// } from "express";
// import cors from "cors";
// import helmet from "helmet";
// import morgan from "morgan";
// import { config } from "dotenv";
// import { initAWS } from "./config/aws";
// import routes from "./routes";

// // Load environment variables
// config();

// // Initialize AWS SDK
// initAWS();

// // Create Express app
// const app = express();

// // Middleware
// app.use(cors());
// app.use(helmet());
// app.use(morgan("dev"));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // API routes
// app.use("/api", routes);

// // Health check endpoint
// app.get("/health", (req: Request, res: Response) => {
//   res.status(200).json({ status: "ok" });
// });

// // Error handling middleware
// app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
//   console.error("Unhandled error:", err);
//   res.status(500).json({ message: "Internal server error" });
// });

// // 404 handler
// app.use((req: Request, res: Response) => {
//   res.status(404).json({ message: "Not found" });
// });

// export default app;
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "dotenv";
import routes from "./routes";

// Load environment variables
config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api", routes);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Not found" });
});

export default app;
