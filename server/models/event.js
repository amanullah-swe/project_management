const mongoose = require("mongoose");
const express = require("express");

const RegistrationFieldSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ["text", "number", "email", "date"],
    required: true,
  },
});

const EventSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Auto-generate unique IDs
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to User model
  name: { type: String, required: true },
  date: { type: String, required: true }, // Store date as a string (or use Date type)
  time: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  registrationForm: { type: [RegistrationFieldSchema], default: [] },
  registrations: { type: [], default: [] },
  registrationLink: { type: String },
  isRegistrationRequired: { type: Boolean, default: false },
});

const Event = mongoose.model("Event", EventSchema);

module.exports = Event;
