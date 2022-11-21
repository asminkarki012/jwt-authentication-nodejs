const express = require("express");
const app = express();
const mongoose = require("mongoose");
const authRoute = require("./routes/auth");
const postquoteRoute = require("./routes/postquote");

app.use(express.json());

//DB connection

main().catch((err) => console.log(err));

async function main() {
    const dbname = "authentication-CRUD";
  const connectionString =
    `mongodb+srv://mongodb:mongodb@cluster0.dkznm.mongodb.net/${dbname}?retryWrites=true&w=majority`;
  mongoose.connect(connectionString);
  console.log("MongoDB connected");
}

app.use("/api/auth",authRoute);
app.use("/api/quote",postquoteRoute);


const PORT = 4000;
app.listen(PORT,() => {
    console.log(`Port Running at localhost:${PORT}`);
});
