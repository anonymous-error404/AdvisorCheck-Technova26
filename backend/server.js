import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import advisorRegistrationRoutes from "./routes/advisor_auth.route.js";
import investorRegistrationRoutes from "./routes/invester_auth.route.js";
import tradePublishRoutes from "./routes/tradePublish.route.js";
import subscriptionRoutes from "./routes/subscription.route.js";
import performanceRoutes from "./routes/performance.route.js";
import trustRoutes from "./routes/trust.route.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api/advisor", advisorRegistrationRoutes, tradePublishRoutes, performanceRoutes, trustRoutes);
app.use("/api/investor", investorRegistrationRoutes, subscriptionRoutes);


// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
