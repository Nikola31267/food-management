import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const corsOptions = {
  origin: ["http://localhost:3000"],
  credentials: true,
};

app.get("/", (req, res) => {
  res.redirect(process.env.WEBSITE_URL);
});

app.use("/api/auth", cors(corsOptions), authRoutes);

if (process.env.NODE_ENV !== "production") {
  app.listen(8000, () => {
    console.log("Server is running on port 8000");
    connectDB();
  });
}

if (process.env.NODE_ENV === "production") {
  connectDB();
}
export default app;
