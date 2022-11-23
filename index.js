const { application } = require("express");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require('path');
const bodyParser = require('body-parser')
const authRoute = require("./routes/auth");
const postquoteRoute = require("./routes/postquote");


app.use(bodyParser.urlencoded({extended: true}));
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
// app.use('/static',express.static(path.join(__dirname,'public')));
app.use(express.static('public'));
// app.set('view engine','ejs');


// app.get('/', (req,res) => {

//   res.render('index.ejs',{});

// })

const PORT = 4000;
app.listen(PORT,() => {
    console.log(`Port Running at localhost:${PORT}`);
});
