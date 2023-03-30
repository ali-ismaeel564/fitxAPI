const mongoose = require("mongoose");
const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Please enter your email"],
    },
    firstName: {
      type: String,
      required: [true, "Please enter your firstname"],
    },
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
