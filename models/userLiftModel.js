const mongoose = require('mongoose');
const userLiftSchema = mongoose.Schema(
{
  userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  liftType: {type: String, required: true},
},
{
  timestamps: true
});

const userLift = mongoose.model('userLift', userLiftSchema);
module.exports = userLift;