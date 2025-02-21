const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("./models/user");
const cors = require("cors");
const Event = require("./models/event");
const morgan = require("morgan");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied. No token provided." });
  }

  try {
    const secretKey = process.env.JWT_SECRET || "your_secret_key"; // Use env variable in production
    const decoded = jwt.verify(token.replace("Bearer ", ""), secretKey);
    console.log(decoded.id);
    req.body.userId = decoded?.id; // Attach user payload to request
    next(); // Move to next middleware
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Invalid Token" });
  }
};
// Middleware
app.use(
  cors({
    origin: [process.env.FRONTEND_ROUT1, process.env.FRONTEND_ROUT1],
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// for testing purpose
app.get("/", (req, res) => {
  res.json({ message: "hello it's working" });
});
// Registration Route
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user
    user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Login Route
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1y",
    });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get user
app.get("/api/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.body.userId; // Extract user ID from decoded token

    // Find user by ID in the database
    const user = await User.findById(userId); // Exclude password field

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user); // Send user details as response
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// Update usere
app.put("/api/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.body.userId; // Extract user ID from the decoded token
    const { name, email, gender, phoneNumber } = req.body; // Get new user details

    // Create an object to store fields to update
    const updatedFields = {};
    if (name) updatedFields.name = name;
    if (email) updatedFields.email = email;
    if (gender) updatedFields.gender = gender;
    if (phoneNumber) updatedFields.phoneNumber = phoneNumber;

    // If password is provided, hash it before updating

    // Find user by ID and update
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedFields }, // Set new values
      { new: true, select: "-password" } // Return updated user, exclude password
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create Event
app.post("/api/events", verifyToken, async (req, res) => {
  try {
    const { registrationFields } = req.body;
    const event = new Event({
      ...req.body,
      registrationForm: registrationFields,
    });
    await event.save();
    const registrationLink = "http://localhost:3000/register/" + event._id;
    res.status(201).json({ ...event, registrationLink });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
});

// Read All Events
app.get("/api/events", verifyToken, async (req, res) => {
  try {
    const userId = req.body.userId;
    const events = await Event.find({ userId });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read Single Event by ID
app.get("/api/events/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Event
app.put("/api/events/:id", async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register User for Event
app.post("/api/events/register/:id", async (req, res) => {
  try {
    const reg_data = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    event.registrations.push({ ...reg_data });
    await event.save();

    res.status(200).json({ message: "Registration successful", event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Event
app.delete("/api/events/:id", async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
