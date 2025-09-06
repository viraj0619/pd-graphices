const express = require("express");
const bodyparser = require("body-parser");
const fileUpload = require("express-fileupload");
const session = require("express-session");
const user_route = require("./routes/user_routes");
const admin_route = require("./routes/admin_routes");
const unzipper = require('unzipper');
const mysql = require('mysql2/promise');
const path = require("path");


const cors = require('cors');
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const url = require("url")
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use(bodyparser.urlencoded({ extended: true }));
app.use(
  fileUpload({
    limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB
    useTempFiles: true,
    tempFileDir: '/tmp/',
  })
);

app.use(session({
    secret: "schoolsoftware public school management software system",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
// app.use(express.static("public/"));
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: "746200466815-1flbuteen6hh299jdg9pavhl3op0oph6.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "http://localhost:1000/auth/google/callback"
},
    function (accessToken, refreshToken, profile, cb) {
        cb(null, profile);
    }
));

passport.serializeUser(function(user, cb){
    cb(null, user);
});

passport.deserializeUser(function(obj, cb){
    cb(null, obj);
});

app.use("/", user_route);
app.use("/admin", admin_route);


app.listen(1000, () => {
    console.log("Server started on http://localhost:1000");
});
