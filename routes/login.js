const express = require("express");
const axios = require("axios");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const signUpModel = require("../models/signUpModel");
const router = express.Router();
const tokenEndpoint =
  "https://customer-console-prod.auth.us-west-2.amazoncognito.com/oauth2/token";
const scope = "https://api.getguru.fitness/default";

router.route("/").post(async (req, res) => {
  try {
    const user = await signUpModel.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).send({ error: "Invalid email or password" });
    }
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword) {
      return res.status(400).send({ error: "Invalid email or password" });
    }
    const idToken = jwt.sign(
      { _id: user._id, firstName: user.firstName, lastName: user.lastName },
      process.env.FITX_SECRET_KEY
    );
    const accessToken = await getToken();

    return res.send({
      data: {
        user: _.pick(user, ["_id", "firstName", "lastName", "email"]),
        idToken: idToken,
        accessToken: accessToken,
      },
    });
  } catch (error) {
    return res.send({ error: error.message });
  }
});

async function getToken() {
  const body = `grant_type=client_credentials&client_id=${process.env.GURU_Client_ID}&client_secret=${process.env.GURU_Client_Secret}&scope=${scope}`;

  try {
    const response = await axios.post(tokenEndpoint, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return response.data.access_token;
  } catch (error) {
    return error;
  }
}

module.exports = router;
