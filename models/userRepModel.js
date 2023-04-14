const mongoose = require("mongoose");
const userRepSchema = mongoose.Schema(
  {
    // userID: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    userID: { type: String, ref: "user", required: true },
    videoID: { type: String, ref: "Video", required: true },
    // videoID: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
    liftType: { type: String, required: true },
    attemptedReps: { type: Number, required: true },
    goodReps: { type: Number, required: true },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const userRep = mongoose.model("userRep", userRepSchema);
module.exports = userRep;
