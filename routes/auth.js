const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verifyToken = require("../controllers/middleware");
const { response, json } = require("express");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
require("dotenv").config();
const tokenList = {};

// 401 Unauthorized
// 400 Bad Request
// 403 Forbidden
// 404 Not Found
// 500 Internal Server Error

//Register
router.post("/register", async (req, res) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPass = await bcrypt.hash(req.body.password, salt);
  // req.body = JSON.parse(req.body);
  try {
    const userExists = await User.findOne({ email: req.body.email });
    if (!userExists) {
      const newUser = new User({
        email: req.body.email,
        password: hashedPass,
      });

      const user = await newUser.save();

      const generatedOtp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false,
      });

      const hashedotp = await bcrypt.hash(generatedOtp, salt);

      const updateotp = await User.findOneAndUpdate(
        { email: req.body.email },
        {
          $set: { otp: hashedotp },
        },
        { new: true }
      );

      //send otp mail to user
      mailer(`${req.body.email}`, `${generatedOtp}`);
      const { otp, password, ...other } = user._doc;
      res.status(200).json({ message: "Register Successfully", data: other });
    } else {
      res.status(400).json("User already exist");
    }
  } catch (err) {
    res.status(400).json(err);
  }
});

//login
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    console.log(req.body);
    if (!user) {
      res.status(400).json("wrong credential!");
    }
    const validated = await bcrypt.compare(req.body.password, user.password);
    if (!validated) {
      res.status(400).json("wrong credential!");
    }
    if (user.status != "Active") {
      res
        .status(401)
        .json({ message: "Pending Account.Please Verify your Email" });
    }
    // console.log(user);
    //password is not displayed
    const { password, ...other } = user._doc;
    //payload should not contain password
    // console.log(other);
    const token = jwt.sign({ user: other }, "secretkey", { expiresIn: "50s" });
    const refreshToken = jwt.sign({ user: other }, "refreshtokensecret", {
      expiresIn: "1h",
    });
    const response = {
      token: token,
      refreshToken: refreshToken,
    };
    tokenList[refreshToken] = response;
    // console.log(tokenList);
    res
      .status(200)
      .json({ message: "Login Successfully", response, data: other });
    console.log("login successfully");
  } catch (err) {
    res.status(500).json(err);
  }
});

//refresh token
router.post("/token", async (req, res) => {
  const postData = req.body;
  const user = await User.findOne({ email: postData.email });
  const { password, ...other } = user._doc;
  console.log(tokenList);

  if (postData.refreshToken && postData.refreshToken in tokenList) {
    const token = jwt.sign({ user: other }, "secretkey", { expiresIn: "50s" });
    const response = {
      token: token,
    };
    tokenList[postData.refreshToken].token = token;
    console.log(tokenList);
    res.status(200).json({ response, msg: "Refresh JWT working" });
  } else {
    res.status(403).json("Forbidden");
  }
});

//password change

router.put("/changepassword", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    console.log(user);
    if (!user) {
      res.status(400).json("wrong credential");
    }
    const oldpassword = req.body.oldpassword;
    const validated = await bcrypt.compare(oldpassword, user.password);
    if (!validated) {
      res.status(400).json("old password incorrect");
    }
    const newpassword = req.body.newpassword;
    const confirmpassword = req.body.confirmpassword;
    if (newpassword !== confirmpassword) {
      res.status(400).json("newpassword and confirm password doesnot match");
    }
    const salt = await bcrypt.genSalt(10);
    const newhashedPass = await bcrypt.hash(newpassword, salt);
    console.log(req.body.email);
    const updatedPassword = await User.findOneAndUpdate(
      { email: user.email },
      { $set: { password: newhashedPass } },
      { new: true }
    );
    console.log(updatedPassword);
    res.status(200).json({ message: "Password Updated Successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
});

//email verification
router.post("/verifyotp", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      //check if otp have expired or not 300000 = 5minutes
      const expiredOtp = Date.now() - user.expiresAt;
      if (expiredOtp <= 300000) {
        //check if otp is valid or not
        const validatedOtp = bcrypt.compare(req.body.otp, user.otp);
        if (!validatedOtp) {
          res.status(401).json({ message: "Invalid OTP" });
        } else {
          const updateotp = await User.findOneAndUpdate(
            { email: user.email },
            {
              $set: { status: "Active" },
            },
            { new: true }
          );
          res.status(200).json({ message: "Email Verification Completed" });
        }
      } else {
        res.status(401).json({ message: "OTP time have expired" });
      }
    } else {
      res.status(404).json({ message: "User doesnot exists" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//resend OTP after it expires
router.post("/resendotp", async (req, res) => {
  try {
    console.log("resendotproute");
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      //check if otp is valid or not
      const generatedOtp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false,
      });

      const salt = await bcrypt.genSalt(10);
      const hashedotp = await bcrypt.hash(generatedOtp, salt);

      const updateotp = await User.findOneAndUpdate(
        { email: req.body.email },
        {
          $set: { otp: hashedotp, expiresAt: Date.now() },
        },
        { new: true }
      );
      mailer(`${req.body.email}`, `${generatedOtp}`);
      res.status(200).json({message:"Resend OTP successful"});
    } else {
      res.status(404).json({ message: "User doesnot exists" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

const mailer = async (recepient, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    secure: false,
    auth: {
      user: `${process.env.GMAIL_ACC}`,
      pass: process.env.APP_PASS, //app password
    },
  });

  const mailOptions = {
    from: `${process.env.GMAIL_ACC}`,
    to: `${recepient}`,
    subject: "OTP",
    text: `Your OTP code is ${otp} \n Expires in 5 minutes`,
  };
  await transporter.verify();

  //send email
  transporter.sendMail(mailOptions, function (err, res) {
    if (err) {
      return res.status(400).send({ Status: "Failure", Details: err });
    } else {
      return res.send({ Status: "Success", Details: encoded });
    }
  });
};

//hashing function
// const hashHandler = async (tohash) => {
//   const salt = await bcrypt.genSalt(10);
//   const hashedinfo = await bcrypt.hash(tohash, salt);
//   return hashedinfo;
// }
//comparing hashing function
// const hashChecker = async(unhashedinfo,hashedinfo)=>{

//     const validated = await bcrypt.compare(unhashedinfo, hashedinfo);
//     return validated;
// }
module.exports = router;
