require("dotenv").config();
const _ = require("lodash");
const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const userModel = require("./models/userModel");
const userRepsModel = require("./models/userRepModel");
const signUpModel = require("./models/signUpModel");
const login = require("./routes/login")
const mongoose = require("mongoose");
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/login', login);

const requiredEnvVariables = ['MONGODB_URL', 'FITX_SECRET_KEY', 'GURU_Client_ID', 'GURU_Client_Secret'];

requiredEnvVariables.forEach((envVar) => {
  if (!process.env.hasOwnProperty(envVar)) {
    console.error(`FATAL ERROR: ${envVar} environment variable is not defined`);
    process.exit(1);
  }
});

const port = process.env.PORT || 3000;
app.get("/", (req, res) => {
  res.status(200).send("fitxAPI is live now...");
});

//User signup
app.post("/api/signup", async (req, res) => {
  try {
    const { email } = req.body;
    const emailValid = isValidEmail(email);
    if (!emailValid) {
      return res.status(400).send({ message: `${email} is not valid email` });
    } else {
      const emailExist = await signUpModel
        .findOne({ email: email })
        .select({ email: 1 })
        .limit(1);
      if (emailExist) {
        return res
          .status(409)
          .send({ message: `'${emailExist["email"]}' is already exist` });
      } else {
        let {password} = req.body;
        const salt = await bcrypt.genSalt(10);
        password = await bcrypt.hash(password, salt);
        req.body.password = password;
        const user = await signUpModel.create(_.pick(req.body, ["firstName", "lastName", "email", "password"]));
        const idToken = jwt.sign({user: _.pick(user, ["_id", "firstName", "lastName", "email"])}, process.env.FITX_SECRET_KEY);
        res.setHeader('x-auth-token', idToken);
        res.status(201).send({ data: _.pick(user, ["firstName", "lastName", "email"]) });
      }
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// make an api api/userPatch... req body should be same like the bottom one....it should be authorized....

app.post("/api/user", async (req, res) => {
  try {
    // const token = req.header("x-auth-token");
    // if(!token) res.status(401).send("Acess denied. No token provided.");
    const { email, userID } = req.body;
    const emailValid = isValidEmail(email);
    const userExist = await userModel.findOne({ userID: userID });
    if (userExist != null) {
      return res
        .status(409)
        .send({ message: `user with ${userID} id is already exist` });
    }
    if (!emailValid) {
      return res.status(400).send({ message: `${email} is not valid email` });
    } else {
      const emailExist = await userModel
        .findOne({ email: email })
        .select({ email: 1 })
        .limit(1);
      if (emailExist) {
        return res
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
    const { videoID } = req.body;
    const videoIDExist = await userRepsModel.findOne({ videoID: videoID });
    if (videoIDExist) {
      return res
        .status(409)
        .send({ message: `video with ${videoID} id is already exist` });
    }
    const createdUserRep = await userRepsModel.create(req.body);
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
          foreignField: "userID",
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
          firstName: { $first: "$user.firstName" },
          lastName: { $first: "$user.lastName" },
        },
      },
      {
        $project: {
          userID: "$_id",
          weight: 1,
          liftType: 1,
          totalAttemptedReps: 1,
          userName: { $concat: ["$firstName", " ", "$lastName"] },
          _id: 0,
        },
      },
      {
        $sort: { totalAttemptedReps: -1 },
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
  // .connect(process.env.MONGODB_URL)
  .connect("mongodb://localhost:27017/fitx-backend")
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
