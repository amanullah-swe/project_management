const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, default: "Not available" },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
