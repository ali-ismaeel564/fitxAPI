const mongoose = require("mongoose");
const userpatchupSchema = mongoose.Schema(
  {
    height_cm: { type: Number },
    weight_kg: { type: Number },
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

const userpatchup = mongoose.model("userpatchup", userpatchupSchema);
module.exports = userpatchup;
