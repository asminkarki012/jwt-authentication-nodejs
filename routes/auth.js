const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// 401 Unauthorized
// 400 Bad Request
// 403 Forbidden
// 404 Not Found
// 500 Internal Server Error

//Register
router.post("/register", async (req, res) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPass = await bcrypt.hash(req.body.password, salt);

  try {
    const newUser = new User({
      email: req.body.email,
      password: hashedPass,
    });

    const user = await newUser.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(200).json(err);
  }
});

//login

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      res.status(400).json("wrong credential!");
    }
    const validated = await bcrypt.compare(req.body.password, user.password);
    if (!validated) {
      res.status(400).json("wrong credential!");
    }
    // console.log(user);
    const { password, ...other } = user._doc;
    const token =  jwt.sign({ user: user }, "secretkey");

    res.status(200).json({token,other});
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
