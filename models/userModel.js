const mongoose = require("mongoose");
const userSchema = mongoose.Schema(
  {
    userID: {type: String},
    email: {
      type: String,
      required: [true, "Please enter your email"],
    },
    firstName: {
      type: String,
      required: [true, "Please enter your firstname"]
    },
    lastName: { type: String,
      required: [true, "Please enter your lastname"] },
    height_cm: { type: Number },
    weight_kg: { type: Number, required: [true, "weight is required"] },
  },
  {
    timestamps: true,
  }
);

const user = mongoose.model("user", userSchema);

module.exports = user;
