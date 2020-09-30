//jshint esversion:6

require('dotenv').config(); ///////////// first thing to do when creating project. before committing to git hub to not publish secret keys
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs")
const mongoose = require("mongoose");
const session = require("express-session");   //// USED FOR COOKIES WITH passport AND passportLocalMongoose
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");     //COOKIES  AT npmjs.com
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');
// const encrypt = require("mongoose-encryption");              1              //////// to encrypt password
var md5 = require("md5"); // FOR PASSWORD HASHING (SECURE PASSWORDS)
// const bcrypt = require("bcrypt");
// const saltRounds = 10;


const app = express();

// console.log(process.env.API_KEY);   ///////////// to log the API KEY from the .env file

app.use(express.static("public")); ////// Public folder as a static resource
app.set('view engine', 'ejs'); ///// setting view engine to be ejs
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({                    ////////// set up sessions
  secret: "Shesaiddoit",
  resave: false,
  saveUninitialized: false
})); //session should be the first to be declared

app.use(passport.initialize()); /// use passport to initialize the package
app.use(passport.session()); /// used passport for managing the session
mongodb://localhost:27017/userDatabase
mongoose.connect("mongodb+srv://admin:Baboin619@cluster0.s7zsg.mongodb.net/userDatabase", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);

userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose); // set up userSchema to use passportLocalMongoose as a plugin
userSchema.plugin(findOrCreate);




// userSchema.plugin(encrypt, {secret:process.env.SECRET,  encryptedFields:["password"] });       2

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());           //// used passportLocalMongoose to create a local strategy to serialize and deserialize the User.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});



passport.use(new GoogleStrategy({
    clientID: 676372769110-uh3ck9k9pjvqbkhbj0hi59k3g29mma87.apps.googleusercontent.com, //process.env.CLIENT_ID,
    clientSecret: Mwb6L8yZqyPVOZt4ehHJC2G9, //process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: 328086198378495,//process.env.APP_ID,
    clientSecret: 69475167444ffbb4ef25b4dbc2da7a32,//process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({
      facebookId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));


//////////////////// HOME ROUTE
app.get("/", function(req, res) {
  //////////////////// res.send("Home") will display home on the screen
  /////////////////// res.render("home") renders the page in the views folder (directory)
  res.render("home");
});


///////////////////////// GOOGLE AUTHENTICATION ROUTE
app.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile"]
  })
);

app.get('/auth/google/secrets',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });



//////////////////////// FACEBOOK AUTHENTICATION route
app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });



///////////////////// LOGIN ROUTE
app.route("/login")
  .get(function(req, res) {

    res.render("login");

  })
  .post(function(req, res) {

    const user = new User({
      username: req.body.username,
      password: req.body.password
    });

    req.login(user, function(err){
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function(){
          res.redirect("/secrets");
        });
      }
    });
    // const useremail = req.body.username;
    // const password = req.body.password;                   // md5(req.body.password);
    //
    // User.findOne({email:useremail}, function(err,foundUser){
    //   if(err){
    //     console.log(err);
    //   } else {
    //     if(foundUser){
    //       // if(foundUser.password === password){
    //       //   res.render("secrets");  for md5
    //
    //       bcrypt.compare(password,foundUser.password, function(err, result){
    //         if(result === true){
    //           res.render("secrets");
    //         }
    //       });
    //       }
    //     }
    // });

  });



////////////////////////// REGISTER ROUTE
app.get("/register", function(req, res) {

  res.render("register");

});

app.post("/register", function(req, res) {

  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets"); //////////////  we put the secrets route with the slash /secrets because if the cookies successfully autheticated the user password they should be able to directly go to the page because their session has been saved by cookies
      })
    }
  })

  // bcrypt.hash(req.body.password, saltRounds, function(err, hashes){
  //   const newUser = new User({
  //     email:req.body.username,
  //     password:hashes                  ///////md5(req.body.password)        USING MD5 WILL TURN YOUR PASSWORD INTO A HASH. MAKING IT ALLMOST IMPOSSIBLE TO DECRYPT.   md5(parameter);
  //   });
  //
  //   newUser.save(function(err){
  //     if(!err){
  //       res.render("secrets");
  //     } else {
  //       console.log(err);
  //     }
  //   });
  // });

});



//////////////////////////// SECRETS ROUTE AFTER AUTHENTICATION
app.get("/secrets", function(req, res) {
  ///////// DSPLAY PAGE FOR EVERYBODY.
  User.find({"secret": {$ne:null}}, function(err, foundSecrets){              //// secret field has to be in quotation since we're looking into our database
    if(err){
      console.log(err);
    } else {
      if(foundSecrets){
        res.render("secrets", {usersWithSecrets: foundSecrets});
      }
    }
  });






  //////// CODE BELOW IS IF YOU WANT THE PAGE TO BE DISPLAYED ONLY FOR REGISTERED/LOGGED IN USERS.
  // if (req.isAuthenticated()) {
  //   res.render("secrets");
  // } else {
  //   res.redirect("/login");
  // }
});



////////////////////////// LOG OUT route

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});



/////////////////////////// SUBMIT ROUTE

app.get("/submit", function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function(req,res){
  const secretsubmit = req.body.secret;

  console.log(req.user._id);
  User.findById(req.user._id, function(err, foundUser){
    if(err){
      console.log(err);
    } else {
      if(foundUser){
        foundUser.secret = secretsubmit;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.listen(port, function() {
  console.log("Server running");
});
