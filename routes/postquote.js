const verifyToken = require("../controllers/middleware");
const router = require("express").Router();
const Quote = require("../models/Quote");
const fs = require("fs");
//perform crud operation here

//create
router.post("/", verifyToken, async (req, res) => {
  try {
    // jwt.verify(req.token, "secretkey", async (err, authData) => {

    const { email } = req.user.user;

    // console.log(req.user);
    // console.log(req.user);

    console.log(email);
    // if (err) {
    //   res.status(403).json("Forbidden");
    // } else {
    // authData contains user info
    const newQuote = new Quote({
      email: email,
      name: req.body.name,
      quote: req.body.quote,
    });

    const quote = await newQuote.save();
    res.status(200).json({ quote, email, msg: "JWT working" });
  } catch (err) {
    // });
    // }
    res.status(500).json(err);
  }
});

//update

router.put("/:id", verifyToken, async (req, res) => {
  if (req.body.userId === req.params.id) {
    try {
      const updatedQuote = await Quote.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        { new: true }
      );

      res.status(200).json(updatedQuote);
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(401).json("Not allowed input userId not found");
  }
});

//Delete
router.delete("/:id", verifyToken, async (req, res) => {
  if (req.body.userId === req.params.id) {
    try {
      const quote = await Quote.findById(req.params.id);
      console.log(quote.email);
      if (quote) {
        const deletedQuote = await Quote.findByIdAndDelete(req.params.id);
        res.status(200).json("Quote has been deleted:", deletedQuote);
      } else {
        res.status(404).json("User not found");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(401).json("cannot delete input UserId not matched");
  }
});

//GET

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    console.log(quote.name);
    fs.writeFile(`../outputfile/${quote.name}quote.txt`, quote, (err) => {
      if (err) throw err;
      console.log("file saved");
    });
    res.status(200).json(quote);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
