const mongoose = require("mongoose");
const userSchema = mongoose.Schema(
  {
    userID: { type: String, required: [true, "Please enter userID"] },
    email: {
      type: String,
      required: [true, "Please enter your email"],
    },
    firstName: { type: String },
    lastName: { type: String },
    height_cm: { type: Number },
    weight_kg: { type: Number },
  },
  {
    timestamps: true,
  }
);

const user = mongoose.model("user", userSchema);

module.exports = user;
