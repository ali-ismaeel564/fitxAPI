require("dotenv").config();
const express = require("express");
const cors = require("cors");
const userModel = require("./models/userModel");
const userRepsModel = require("./models/userRepModel");
const mongoose = require("mongoose");
const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;
app.get("/", (req, res) => {
  res.status(200).send("fitxAPI is live now...");
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
        res.status(201).send({ data: user });
      }
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

app.post("/api/userReps", async (req, res) => {
  try {
    // const userReps = await userRepsModel.create(req.body);
    // res.status(201).send({ status: "success", data: { userReps } });
    const { userID, videoID, ...rest } = req.body;
    const userRep = {
      userID: new mongoose.Types.ObjectId(userID),
      videoID: new mongoose.Types.ObjectId(videoID),
      ...rest,
    };
    const createdUserRep = await userRepsModel.create(userRep);
    res
      .status(201)
      .send({ status: "success", data: { userRep: createdUserRep } });
  } catch (error) {
    res.status(400).send({ status: "error", message: error.message });
  }
});

app.get("/api/userLift/:userID", async (req, res) => {
  try {
    const { userID } = req.params;
    const { liftType } = req.query;
    const { date } = req.query;
    if (!date) {
      return res.status(400).send({
        message:
          "Date is required in the format yyyy-mm-dd (2023-05-21T12:00:00.000Z)",
      });
    }
    const curr = new Date(date);
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

    if (!userReps || userReps.length === 0) {
      return res.status(404).send({ message: "User reps not found" });
    }

    // calculate the sum of attempted reps
    const sumAttemptedReps = userReps.reduce((total, userRep) => {
      return total + userRep.attemptedReps;
    }, 0);

    // console.log(
    //   `Total attempted reps for user ${userID}, lift type ${liftType}, and week starting from ${firstday} are ${sumAttemptedReps}`
    // );
    res.status(200).send({
      status: "success",
      data: { userID: userID, total_attemtedReps: sumAttemptedReps },
    });
  } catch (error) {
    res.status(505).send({ status: "error", message: error.message });
  }
});

app.get("/api/leaderboards", async (req, res) => {
  try {
    const { liftType, limit } = req.query;
    const userReps = await userRepsModel.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userID",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $match: { liftType: liftType },
      },
      {
        $unwind: "$user",
      },
      {
        $group: {
          _id: "$userID",
          totalAttemptedReps: { $sum: "$attemptedReps" },
          weight: { $first: "$user.weight_kg" },
          liftType: { $first: "$liftType" },
          firstName: {$first: "$user.firstName"},
          lastName: {$first: "$user.lastName"}
        },
      },
      {
        $project: {
          userID: "$_id",
          weight: 1,
          liftType: 1,
          totalAttemptedReps: 1,
          userName: { $concat: [ "$firstName", " ", "$lastName" ] },
          _id: 0,
        },
      },
      {
        $sort: { weight: -1, totalAttemptedReps: -1 },
      },
      {
        $limit: parseInt(limit) || 1000,
      },
    ]);
    if (userReps.length > 0) {
      res.status(200).send({ status: "success", data: userReps });
    } else {
      res.status(404).send({ status: "error", message: "No user Reps found" });
    }
  } catch (error) {
    res.status(505).send({ status: "error", message: error.message });
  }
});

mongoose
  .connect(process.env.MONGODB_URL)
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
