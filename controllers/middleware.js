const jwt = require("jsonwebtoken");

//format of token
// authorization: Bearer <access_token>

const verifyToken =  (req, res, next) => {
  try {
    //GEt auth header value
    const bearerHeader = req.headers["authorization"];
    console.log(bearerHeader);

    //check if bearer is undefined
    if (bearerHeader) {
      //split at the space
      const bearer = bearerHeader.split(" ");
      
      // Get token
      const bearerToken = bearer[1];
      console.log(bearerToken);
      
      //set token
      jwt.verify(bearerToken, "secretkey", (err, payload) => {
        if (err) {
          res.status(403).send(err.message);
        } else {
          req.user = payload;

          next();
        }
      });
      // const payload = await jwt.verify(k)
      // res.status(403).json("Forbidden");
    }else{
      res.status(403).send("invalid bearer header");
    }
  } catch (err) {
    res.status(400).json(err);
  }
};

module.exports = verifyToken;
