const jwt = require("jsonwebtoken");

//format of token
// authorization: Bearer <access_token>

const verifyToken = async (req, res, next) => {
  try {
    //GEt auth header value
    const bearerHeader = req.headers["authorization"];

    //check if bearer is undefined
    if (typeof bearerHeader !== "undefined") {
      //split at the space
      const bearer = bearerHeader.split(" ");
      // Get token
      const bearerToken = bearer[1];
      //set token
       const payload = jwt.verify(bearerToken, "secretkey");     
       req.user =  payload;
      //  console.log(req.user);
    // const payload = await jwt.verify(k)
      next();
    } else {
      res.sendStatus(403);
      // res.status(403).json("Forbidden");
    }
  } catch (err) {
    res.status(400).json(err);
  }
};

module.exports = verifyToken;
