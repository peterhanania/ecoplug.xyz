const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const url = require("url");
 const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const path = require("path");
const express = require("express");
const sendgridTransport = require('nodemailer-sendgrid-transport');
const passport = require("passport");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const ms = require('ms');
const ejs = require("ejs");
const bodyParser = require("body-parser");
const { readdirSync } = require('fs');
const mongoose = require('mongoose')
const app = express();
var validator = require('validator');
const User = require("./models/user");
const multer = require("multer");
const fs = require("fs");

const deleteFile = filePath => {
  fs.unlink(filePath, err => {
    if (err) {
      throw err;
    }
  });
};

 const dataDir = path.resolve(`${process.cwd()}${path.sep}`)
 const templateDir = path.resolve(`${dataDir}${path.sep}templates`); 


app.use(session({
  secret : process.env.secret,
  resave : true,
  saveUninitialized : true,
  store :MongoStore.create({ mongoUrl: process.env.mongo })
}));


var moment = require('moment');
app.locals.moment = require('moment');

   app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
      extended: true
    }));
app.use(

  multer({
    storage: multer.diskStorage({
      destination: (req, file, callback) => {
        callback(null, "images");
      },
      filename: (req, file, callback) => {
        callback(null, new Date().toISOString() + "-" + file.originalname);
      }
    }),
    fileFilter: (req, file, callback) => {
      if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/jpeg"
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    }
  }).single("image")
);

app.use(express.static('static'));
app.use("/images", express.static(path.join(__dirname, "images")));



 app.locals.domain = "https://ecoplug.xyz".split("//")[1];
 app.engine("html", ejs.renderFile);
 app.set("view engine", "html");

 const renderTemplate = (res, req, template, data = {}) => {
  var hostname = req.headers.host;
  var pathname = url.parse(req.url).pathname;
  const baseData = {
   https: "https://",
   domain: "https://ecoplug.xyz",
   hostname: hostname,
   pathname: pathname,
   path: req.path,
   user: req.user ? req.user : null,
   url: res,
   req: req,
  };


  res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(baseData, data));
 };

 const checkAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  req.session.backURL = req.url;
  res.redirect("/login");
 }

app.use(async (req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) {
      return next();
    }
    req.user = user;
    next();
  } catch (err) {
    next(new Error(err));
  }
});
  

 const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        process.env.SENDGRID_API_KEY,
    }
  })
);

 app.get("/login", (req, res, next) => {
     
       var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
       var tag = new URL(fullUrl).searchParams.get("user")

     renderTemplate(res, req, "auth/login.ejs",{
     alert: tag === "authenticated" ? "Thank you for signing up! Please login below." : null,
    });

 });



app.post(
  '/signup',
  body('email').isEmail().withMessage('Please provide a valid email adress.'),
  body('password').isLength({ min: 6, max: 32 }).withMessage('Please provide a password (6 - 32ch)'),
  body('username').isLength({ min: 5, max: 32 }).withMessage('Please provide a username (5 - 32ch)'),
  
 async (req, res) => {
  
    const errors = validationResult(req);

    
    const email = req.body.email;
    const password = req.body.password;
    const cpassword = req.body.confirmPassword;
    const username = req.body.username

    if(!email){
      return renderTemplate(res, req, "auth/signup.ejs",{
     alert: `Please provide an email adress`,
    });
    };

    if(!password || !cpassword){
       return renderTemplate(res, req, "auth/signup.ejs",{
     alert:`Please provide a password`,
    });
    }

    if(password !== cpassword){
             return renderTemplate(res, req, "auth/signup.ejs",{
     alert:`Please provide matching passwords.`,
    });
    }
    



    if (!errors.isEmpty()) {
      return renderTemplate(res, req, "auth/signup.ejs",{
     alert: errors.array()[0].msg,
    });
    };
    
    const validateUsernameDatabase =await User.findOne({
    username: username
    });

    if(validateUsernameDatabase){
    renderTemplate(res, req, "auth/signup.ejs",{
     alert: `This username is taken. Please try another`,
    });
      return;
    }

    const validateEmailDatabase =await User.findOne({
    email: email
    });

    if(validateEmailDatabase){
    renderTemplate(res, req, "auth/signup.ejs",{
     alert: `This email is already signed up. Press login to login!`,
    });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email: email,
      password: hashedPassword,
      username: username
    });
    await user.save();


    res.redirect('/login?user=authenticated')

   
  },
);
  app.get("/signup", (req, res, next) => {

     renderTemplate(res, req, "auth/signup.ejs",{
     alert: null,
    });

 });

app.post(
  '/login',
  body('email').isEmail().withMessage('Please provide a valid email adress.'),
  body('password').isLength({ min: 6, max: 32 }).withMessage('Please provide a password (6 - 32ch)'),
  
 async (req, res) => {
   
    const errors = validationResult(req);

    
    const email = req.body.email;
    const password = req.body.password;


    if(!email){
      return renderTemplate(res, req, "auth/login.ejs",{
     alert: `Please provide an email adress`,
    });
    };

    if(!password){
       return renderTemplate(res, req, "auth/login.ejs",{
     alert:`Please provide a password`,
    });
    }


    if (!errors.isEmpty()) {
      return renderTemplate(res, req, "auth/login.ejs",{
     alert: errors.array()[0].msg,
    });
    };
    
     try {

    const user = await User.findOne({ email: email });
    if (!user) {
      return renderTemplate(res, req, "auth/login.ejs",{
     alert: `An invalid email or password was provided.`,
    });
    }
    const doMatch = await bcrypt.compare(password, user.password);
    if (doMatch) {
      req.session.isLoggedIn = true;
      req.session.user = user;
      return req.session.save(err => {
        res.redirect('/');
      });
    }
          return renderTemplate(res, req, "auth/login.ejs",{
     alert:`Invalid Email or Password Provided.`,
    });
  

  } catch (err) {
    res.send(`An error just occured. Please refresh the page.`)
  }
   
  },
);


app.post(
  '/forgot',
  body('email').isEmail().withMessage('Please provide a valid email adress.'),

  
 async (req, res) => {
   
    const errors = validationResult(req);

    
    const email = req.body.email;



    if(!email){
      return renderTemplate(res, req, "auth/forgot.ejs",{
     alert: `Please provide an email adress`,
    });
    };
    


    const user = await User.findOne({ email: email });
    if (!user) {
      return renderTemplate(res, req, "auth/forgot.ejs",{
     alert: `An invalid email was provided.`,
    });
    }
     crypto.randomBytes(32, async (err, buffer) => {
    if (err) {
      return res.redirect('/reset');
    }

      const token = buffer.toString('hex');

     
      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 3600000;
      await user.save();

      return renderTemplate(res, req, "auth/forgot.ejs",{
     alert: `An email was sent to your inbox. Please check your email!`,
    });
      
       transporter.sendMail({
        to: req.body.email,
        from: 'support@ecoplug.xyz',
        subject: 'Password reset',
        html: `
            <p>You requested a password reset</p>
            <p>Click this <a href="http://ecoplug.xyz/reset/${token}">link</a> to set a new password.</p>
          `
      });

     });
   
  },
);



 app.get("/forgot", function(req, res) {

return renderTemplate(res, req, "auth/forgot.ejs",{
      alert: null,
    });
 });

 app.get("/logout", function(req, res) {

req.session.destroy(err => {
    res.redirect('/');
  });

 });



 app.get("/", async(req, res) => {


  renderTemplate(res, req, "index.ejs",{
  });

 });



  app.get("/products", async(req, res) => {
  
  return res.send('The current feature is under development!')
  
  });


   app.post("/products", async(req, res) => {
   return res.send('The current feature is under development!')

 });

const dbOptions = {
      keepAlive: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    };

    mongoose.connect(process.env.mongo, dbOptions)

 app.listen(process.env.PORT || 5000, () => console.log(`Running Website!`));

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}