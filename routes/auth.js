const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verifyToken = require("../controllers/middleware");
const { response } = require("express");
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
    //password is not displayed
    const { password, ...other } = user._doc;
    //payload should not contain password
    // console.log(other);
    const token = jwt.sign({ user: other }, "secretkey",{expiresIn:"50s"});
    const refreshToken = jwt.sign({user:other},"refreshtokensecret",{expiresIn:'1h'});
    const response = {
      "token":token,
      "refreshToken":refreshToken
    }
    tokenList[refreshToken] = response;
    // console.log(tokenList);
    res.status(200).json({response,other});

  } catch (err) {
    res.status(500).json(err);
  }
});

//refresh token
router.post('/token', async (req,res) => {
  const postData = req.body;
  const user = await User.findOne({email:postData.email});
  const {password,...other} = user._doc;
  console.log(tokenList);

  if((postData.refreshToken) && (postData.refreshToken in tokenList)){
    const token = jwt.sign({user:other},'secretkey',{expiresIn:'50s'});
    const response = {
      "token":token
    };
  tokenList[postData.refreshToken].token = token;
  console.log(tokenList);
  res.status(200).json({response,msg:"Refresh JWT working"});
  }else{
    res.status(403).json('Forbidden')
  }

})





//password change

router.put("/changepassword",verifyToken,async (req, res) => {
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
    if(newpassword!==confirmpassword){
      res.status(400).json("newpassword and confirm password doesnot match")
    }
    const salt = await bcrypt.genSalt(10);
    const newhashedPass = await bcrypt.hash(newpassword, salt);
    console.log(req.body.email);
    const updatedPassword = await User.findOneAndUpdate(
      {email:user.email},
      { $set:{password: newhashedPass}},
      { new: true }
    );
    console.log(updatedPassword);
    res.status(200).json(updatedPassword);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
