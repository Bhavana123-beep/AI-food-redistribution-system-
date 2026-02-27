const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const serviceAccount = require("./serviceAccountKey.json");

// ── Firebase Init ──────────────────────────────────────────────────
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://foodbridge-dae8f-default-rtdb.firebaseio.com"
});

const db = admin.database();
const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "foodrescue_secret_key_2026";

// ── Middleware ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve web frontend at root (React Native app uses API endpoints directly)
const path = require("path");
app.use(express.static(path.join(__dirname, "../frontend")));


// ── JWT Auth Middleware ───────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>
  if (!token) return res.status(401).json({ success: false, message: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: "Invalid or expired token." });
  }
};

// ── Time Slot Middleware ──────────────────────────────────────────
const getSessionInfo = () => {
  const now = new Date();
  const h = now.getHours();
  if (h >= 7 && h < 10) return { allowed: true, session: "Breakfast" };
  if (h >= 12 && h < 14) return { allowed: true, session: "Lunch" };
  if (h >= 19 && h < 22) return { allowed: true, session: "Dinner" };
  return { allowed: false, session: "Closed" };
};

const checkDonationTime = (req, res, next) => {
  const { allowed, session } = getSessionInfo();
  if (allowed) {
    req.currentSession = session;
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Food donation is allowed only during Breakfast (7-10 AM), Lunch (12-2 PM), and Dinner (7-10 PM)."
    });
  }
};

// ══════════════════════════════════════════════════════════════════
//  PUBLIC ROUTES
// ══════════════════════════════════════════════════════════════════

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Session status (frontend polls this to enable/disable button)
app.get("/session-status", (req, res) => {
  res.json(getSessionInfo());
});

// ── Quick Donate (no auth, no account needed) ─────────────────
app.post("/quick-donate", async (req, res) => {
  try {
    const { phone, address, donorName, foodItem, type, quantity, expiryTime } = req.body;
    if (!phone || !address || !foodItem || !quantity) {
      return res.status(400).json({ success: false, message: "Phone, address, food item and quantity are required." });
    }
    const donation = {
      donorType: 'quick_donor',
      donorName: donorName || 'Anonymous',
      phone, address,
      foodItem, type: type || 'Others', quantity, expiryTime: expiryTime || '',
      status: 'Pending AI Match',
      createdAt: new Date().toISOString()
    };
    const ref = db.ref("donations").push();
    await ref.set(donation);
    res.status(201).json({ success: true, message: "Quick donation submitted! NGOs near you have been notified.", id: ref.key });
  } catch (error) {
    console.error("Quick Donate Error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
});

// Register
app.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, role, licenseNumber, ngoId } = req.body;

    if (!email || !password || !role || !fullName) {
      return res.status(400).json({ success: false, message: "fullName, email, password, and role are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    // Check existing user
    const existing = await db.ref("users").orderByChild("email").equalTo(email).once("value");
    if (existing.exists()) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserRef = db.ref("users").push();
    const userData = {
      id: newUserRef.key,
      fullName,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString()
    };
    if (licenseNumber) userData.licenseNumber = licenseNumber;
    if (ngoId) userData.ngoId = ngoId;

    await newUserRef.set(userData);

    const token = jwt.sign({ id: newUserRef.key, email, role }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: { id: newUserRef.key, fullName, email, role }
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const snapshot = await db.ref("users").orderByChild("email").equalTo(email).once("value");
    if (!snapshot.exists()) {
      return res.status(401).json({ success: false, message: "No account found with this email." });
    }

    const usersData = snapshot.val();
    const userId = Object.keys(usersData)[0];
    const user = usersData[userId];

    // Support both bcrypt hashed (new) and plain-text (legacy) passwords
    let passwordMatch = false;
    const isHashed = user.password && user.password.startsWith('$2');
    if (isHashed) {
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      // Legacy plain-text comparison
      passwordMatch = (user.password === password);
      if (passwordMatch) {
        // Auto-upgrade to bcrypt for security
        const upgraded = await bcrypt.hash(password, 10);
        await db.ref(`users/${userId}`).update({ password: upgraded });
      }
    }
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Incorrect password." });
    }

    const token = jwt.sign({ id: userId, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      token,
      user: { id: userId, fullName: user.fullName, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
});

// ══════════════════════════════════════════════════════════════════
//  PROTECTED ROUTES (require valid JWT)
// ══════════════════════════════════════════════════════════════════

// Get all donations — PUBLIC (no auth required so web frontend can load listings)
app.get("/donations", async (req, res) => {
  try {
    const snapshot = await db.ref("donations").once("value");
    const data = snapshot.val() || {};
    const list = Object.entries(data).map(([id, val]) => ({ id, ...val })).reverse();
    // Support both { donations: [...] } (mobile) and plain object (web legacy)
    res.json({ success: true, donations: list, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.toString() });
  }
});

// Optional auth middleware — attaches user if token present, but doesn't block if missing
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch (_) {}
  }
  next();
};

// Add donation (time-gated; auth optional — stores donorId if logged in)
app.post("/donate", optionalAuth, checkDonationTime, async (req, res) => {
  try {
    const data = {
      ...req.body,
      session: req.currentSession,
      donorId: req.user?.id || 'anonymous',
      createdAt: new Date().toISOString()
    };
    const ref = db.ref("donations").push();
    await ref.set(data);
    res.status(201).json({ success: true, message: "Donation logged successfully.", id: ref.key });
  } catch (error) {
    res.status(500).json({ success: false, message: error.toString() });
  }
});

// Update donation status
app.patch("/donations/:id/status", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ["Pending AI Match", "Accepted", "In Transit", "Delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }
    await db.ref(`donations/${id}`).update({ status, updatedAt: new Date().toISOString() });
    res.json({ success: true, message: "Status updated." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.toString() });
  }
});

// Get notifications — PUBLIC
app.get("/notifications", async (req, res) => {
  try {
    const snapshot = await db.ref("donations").once("value");
    const data = snapshot.val() || {};
    const all = Object.entries(data).map(([id, val]) => ({ id, ...val })).reverse();
    // Build notification events from status changes
    const notifications = all
      .filter(d => d.status && d.status !== "Pending AI Match")
      .map(d => ({
        id: d.id,
        foodItem: d.foodItem,
        status: d.status,
        updatedAt: d.updatedAt || d.createdAt
      }));
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.toString() });
  }
});

// ── Start ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 FoodRescue API running on port ${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/health`);
});
