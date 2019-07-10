const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mailer = require("../src/modules/mailer");

const User = require("../models/User");
const authConfig = require("../config/auth");
const router = express.Router();

const genToken = payload =>
  jwt.sign(payload, authConfig.secret, { expiresIn: 86400 });

router.post("/register", async (req, res) => {
  const { email } = req.body;

  try {
    if (await User.findOne({ email }))
      return res.status(400).send({ error: "User already Exists." });

    const user = await User.create(req.body);

    user.password = undefined;

    const payload = {
      user: {
        id: user.id
      }
    };

    return res.send({ user, token: genToken(payload) });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Server Error During Registration" });
  }
});

router.post("/authenticate", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) return res.status(404).send({ error: "User not Found" });

  if (!(await bcrypt.compare(password, user.password)))
    return res.status(400).send({ error: "Invalid Password" });

  user.password = undefined;

  const payload = {
    user: {
      id: user.id
    }
  };

  res.send({ user, token: genToken(payload) });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).send({ error: "User not Found" });

    const token = crypto.randomBytes(20).toString("hex");

    const now = new Date();
    now.setHours(now.getHours() + 1);

    await User.findByIdAndUpdate(user.id, {
      $set: {
        passwordResetToken: token,
        passwordResetExpiration: now
      }
    });

    mailer.sendMail(
      {
        to: email,
        from: "rzoch@selfmail.com",
        template: "auth/forgot_password",
        context: { token }
      },
      err => {
        if (err)
          return res
            .status(400)
            .send({ error: "Could not send Forgot-Password mail." });

        return res.send();
      }
    );
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send({ error: "Server Error During Forgot Password" });
  }
});

router.post("/reset-password", async (req, res) => {
    const { email, token, password } = req.body;

    try {
        const user = await User.findOne({ email })
            .select("+passwordResetToken passwordResetExpiration");
        
        if (!user) return res.status(404).send({ error: "User not Found" });

        if (token !== user.passwordResetToken) return res.status(400).send({ error: "Your Token is not Valid" });

        const now = new Date;

        if (now > user.passwordResetExpiration) return res.status(400).send({ error: "Your Token is Expired" });

        user.password = password;

        await user.save();

        res.send();
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .send({ error: "Server Error During Reset Password" });
    }
});

module.exports = router;
