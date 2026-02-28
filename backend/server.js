require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

// ── Config ───────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/foodrescue";
const JWT_SECRET = process.env.JWT_SECRET || "foodrescue_secret_key_2026";
const PORT = process.env.PORT || 5000;

// ── Connect MongoDB (non-fatal if not available) ─────────────────
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log("🍃 MongoDB connected:", MONGO_URI.replace(/:([^@]+)@/, ':****@')))
  .catch(err => {
    console.warn("⚠️  MongoDB not available:", err.message);
    console.warn("   Serving frontend only — install MongoDB to enable login/register.");
  });

mongoose.connection.on("error", err => console.error("🍃 DB error:", err.message));

// ── Mongoose Schemas ─────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  licenseNumber: String,
  ngoId: String,
}, { timestamps: true });

const donationSchema = new mongoose.Schema({
  foodItem: { type: String, required: true },
  type: String,
  quantity: String,
  expiryTime: String,
  status: { type: String, default: "Pending AI Match" },
  session: String,
  donorId: { type: mongoose.Schema.Types.Mixed },
  donorType: { type: String, default: "verified" },
  donorName: String,
  phone: String,
  address: String,
  lat: Number,
  lon: Number,
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Donation = mongoose.model("Donation", donationSchema);

// ── App ──────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// Serve entire frontend folder at root
app.use(express.static(path.join(__dirname, "../frontend")));

// ── DB guard helper ───────────────────────────────────────────────
const dbReady = (req, res, next) => {
  if (mongoose.connection.readyState !== 1)
    return res.status(503).json({ success: false, message: "Database not connected. Please install MongoDB Community Server and restart." });
  next();
};

// ── JWT Middleware ────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const token = (req.headers["authorization"] || "").split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Access denied. No token provided." });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(403).json({ success: false, message: "Invalid or expired token." }); }
};

const optionalAuth = (req, res, next) => {
  const token = (req.headers["authorization"] || "").split(" ")[1];
  if (token) try { req.user = jwt.verify(token, JWT_SECRET); } catch (_) { }
  next();
};

// ── Time Slot ────────────────────────────────────────────────────
const getSessionInfo = () => {
  const h = new Date().getHours();
  if (h >= 7 && h < 10) return { allowed: true, session: "Breakfast" };
  if (h >= 12 && h < 14) return { allowed: true, session: "Lunch" };
  if (h >= 19 && h < 22) return { allowed: true, session: "Dinner" };
  return { allowed: false, session: "Closed" };
};

const checkDonationTime = (req, res, next) => {
  const { allowed, session } = getSessionInfo();
  if (allowed) { req.currentSession = session; next(); }
  else res.status(403).json({ success: false, message: "Donations allowed only during Breakfast (7-10 AM), Lunch (12-2 PM) or Dinner (7-10 PM)." });
};

// ══════════════════════════════════════════════════════════════
//  ROUTES
// ══════════════════════════════════════════════════════════════

// Health check
app.get("/health", (req, res) =>
  res.json({ status: "ok", db: mongoose.connection.readyState === 1 ? "mongodb:connected" : "mongodb:disconnected", time: new Date() }));

app.get("/session-status", (req, res) => res.json(getSessionInfo()));

// Register
app.post("/register", dbReady, async (req, res) => {
  try {
    const { fullName, email, password, role, licenseNumber, ngoId } = req.body;
    if (!fullName || !email || !password || !role)
      return res.status(400).json({ success: false, message: "fullName, email, password and role are required." });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ success: false, message: "An account with this email already exists." });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, email, password: hashed, role, licenseNumber, ngoId });
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      success: true, message: "Account created.", token,
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Register:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Login
app.post("/login", dbReady, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required." });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ success: false, message: "No account found with this email." });

    let match = false;
    if (user.password.startsWith("$2")) {
      match = await bcrypt.compare(password, user.password);
    } else {
      match = (user.password === password);
      if (match) { user.password = await bcrypt.hash(password, 10); await user.save(); }
    }
    if (!match) return res.status(401).json({ success: false, message: "Incorrect password." });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token, user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Login:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Quick Donate (public, no account)
app.post("/quick-donate", dbReady, async (req, res) => {
  try {
    const { phone, address, donorName, foodItem, type, quantity, expiryTime, lat, lon } = req.body;
    if (!phone || !address || !foodItem || !quantity)
      return res.status(400).json({ success: false, message: "Phone, address, food item and quantity are required." });

    const donation = await Donation.create({
      donorType: "quick_donor", donorName: donorName || "Anonymous",
      phone, address, lat, lon,
      foodItem, type: type || "Others", quantity, expiryTime: expiryTime || "",
      status: "Pending AI Match",
    });
    res.status(201).json({ success: true, message: "Quick donation submitted! NGOs near you have been notified.", id: donation._id });
  } catch (err) {
    console.error("Quick Donate:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET donations — public
app.get("/donations", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1)
      return res.json({ success: true, donations: [] }); // return empty gracefully
    const donations = await Donation.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, donations: donations.map(d => ({ id: d._id, ...d })) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST donate — time-gated, optional auth
app.post("/donate", dbReady, optionalAuth, checkDonationTime, async (req, res) => {
  try {
    const donation = await Donation.create({
      ...req.body,
      session: req.currentSession,
      donorId: req.user?.id || "anonymous",
      donorType: "verified",
      status: req.body.status || "Pending AI Match",
    });
    res.status(201).json({ success: true, message: "Donation logged.", id: donation._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH donation status — auth optional (NGO dashboard can update without login)
app.patch("/donations/:id/status", optionalAuth, dbReady, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["Pending AI Match", "Accepted", "In Transit", "Delivered"];
    if (!valid.includes(status))
      return res.status(400).json({ success: false, message: "Invalid status value." });

    const donation = await Donation.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!donation) return res.status(404).json({ success: false, message: "Donation not found." });
    res.json({ success: true, message: "Status updated.", donation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET notifications — public
app.get("/notifications", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1)
      return res.json({ success: true, notifications: [] });
    const donations = await Donation.find({ status: { $ne: "Pending AI Match" } })
      .sort({ updatedAt: -1 }).select("foodItem status updatedAt createdAt").lean();
    res.json({ success: true, notifications: donations.map(d => ({ id: d._id, foodItem: d.foodItem, status: d.status, updatedAt: d.updatedAt || d.createdAt })) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Start ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🔥 FoodRescue AI running → http://localhost:${PORT}`);
  console.log(`📡 Health check         → http://localhost:${PORT}/health`);
  console.log(`🍃 DB                   → ${MONGO_URI}\n`);
});
