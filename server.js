const express = require("express");
const cors = require('cors');
const userModel = require("./models/userModel");
const userRepsModel = require("./models/userRepModel");
const userLiftModel = require("./models/userLiftModel");
const mongoose = require("mongoose");
const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;
app.get("/", (req, res) => {
  const curr = new Date("2023-03-04T12:00:00.000Z");
  const first = curr.getDate() - curr.getDay();
  console.log(curr.getDate());
  console.log(curr.getDay());
  const last = first + 6;

  var firstday = new Date(curr.setDate(first)).toUTCString();
  var lastday = new Date(curr.setDate(last)).toUTCString();

  res
    .status(200)
    .send({ currentDate: curr, startDate: firstday, endDate: lastday });
});

app.post("/api/user", async (req, res) => {
  try {
    const { email } = req.body;
    const emailValid = isValidEmail(email);
    if (!emailValid) {
      res.status(400).send({ message: `${email} is not valid email` });
    } else {
      const emailExist = await userModel
        .findOne({ email: email })
        .select({ email: 1 })
        .limit(1);
      if (emailExist) {
        res
          .status(409)
          .send({ message: `'${emailExist["email"]}' is already exist` });
      } else {
        const user = await userModel.create(req.body);
        res.status(200).send(user);
      }
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

app.post("/api/userReps", async (req, res) => {
  try {
    const userReps = await userRepsModel.create(req.body);
    res.status(200).send(userReps);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

app.get("/api/userLift/:userID", async (req, res) => {
  try {
    const { userID } = req.params;
    const { liftType } = req.query;
    const curr = new Date("2023-03-05T12:00:00.000Z");
    const first = curr.getDate() - curr.getDay();
    const last = first + 6;

    var firstday = new Date(curr.setDate(first)).toUTCString();
    var lastday = new Date(curr.setDate(last)).toUTCString();

    const userReps = await userRepsModel.find({
      userID: userID,
      liftType: liftType,
      date: {
        $gte: firstday,
        $lte: lastday,
      },
    });

    // calculate the sum of attempted reps
    const sumAttemptedReps = userReps.reduce((total, userRep) => {
      return total + userRep.attemptedReps;
    }, 0);

    console.log(
      `Total attempted reps for user ${userID}, lift type ${liftType}, and week starting from ${firstday} are ${sumAttemptedReps}`
    );
  } catch (error) {
    res.status(505).send({ message: error.message });
  }
});

mongoose
  .connect("mongodb://127.0.0.1:27017/fitX")
  .then(() => {
    console.log("Connected!");
    app.listen(port, () => {
      console.log(`App is listening on port ${port}...`);
    });
  })
  .catch((error) => {
    console.log(error);
  });

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
