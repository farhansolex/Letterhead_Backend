const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();


// Middlewares
app.use(cors());
app.use(express.json());

// 👉 Logger should go BEFORE routes
app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

// 👉 Serve uploaded logos statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 👉 Letterhead API routes
const letterheadRoutes = require("./routes/letterheadRoutes");
app.use("/api/letterheads", letterheadRoutes);
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
