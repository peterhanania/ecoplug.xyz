const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const url = require("url");
const nodemailer = require('nodemailer');
const {
    body,
    validationResult
} = require('express-validator');
const path = require("path");
const express = require("express");
const sendgridTransport = require('nodemailer-sendgrid-transport');
const passport = require("passport");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const ms = require('ms');
const ejs = require("ejs");
const bodyParser = require("body-parser");
const {
    readdirSync
} = require('fs');
const emailCooldown = new Set();
const fs = require('fs');
const mongoose = require('mongoose')
const app = express();
const change_password_cooldown = new Set();
var validator = require('validator');
const User = require("./models/user");
const multer = require("multer");
const Recipient = require("mailersend").Recipient;
const EmailParams = require("mailersend").EmailParams;
const MailerSend = require("mailersend");


function isFile(pathItem) {
try{

fs.lstatSync(pathItem).isDirectory();

}catch(e){
   if(e.code == 'ENOENT'){
     return false;
   } else {
     return true;
   }
}
};

const mailersend = new MailerSend({
    api_key: process.env.mail,
});

const deleteFile = filePath => {
    try{
    if(typeof(isFile(filePath)) === "undefined" || isFile(filePath)){
    fs.unlink(filePath, err => {
        if (err) {
            throw err;
        }
    });  
    };
    } catch (error) {
      throw error;
    }
};

const dataDir = path.resolve(`${process.cwd()}${path.sep}`)
const templateDir = path.resolve(`${dataDir}${path.sep}templates`);


app.use(session({
    secret: process.env.secret,
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.mongo
    })
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


                callback(null, new Date().toISOString() + file.originalname);
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
    if (req.user) return next();
    req.session.backURL = req.url;
    res.redirect("/login?user=not_authenticated");
}

app.use(async (req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    try {
        const user = await User.findById(req.session.user._id);
        if (!user) {
            return next();
        };
        const doMatch = user.password === req.session.user.password;
        if (!doMatch) return next();
        req.user = user;
        next();
    } catch (err) {
        next(new Error(err));
    }
});

app.get("/add", checkAuth, function(req, res) {

      renderTemplate(res, req, "products/add.ejs", {
        alert: null,
    });

});


app.get("/login", (req, res, next) => {

    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    let tag = new URL(fullUrl).searchParams.get("user");

    let alert = false;
    if (tag && tag === "authenticated") alert = "Thank you for signing up! Please login below.";
    if (tag && tag === "not_authenticated") alert = "Please login to view this Page.";



    renderTemplate(res, req, "auth/login.ejs", {
        alert: alert ? alert : null,
    });

});

app.get("/about", (req, res, next) => {

    renderTemplate(res, req, "other/about.ejs", {
        alert: null,
    });

});
app.get("/contact", checkAuth, (req, res, next) => {

    renderTemplate(res, req, "other/contact.ejs", {
        alert: null,
    });

});


app.post("/contact", checkAuth, (req, res, next) => {


    renderTemplate(res, req, "other/contact.ejs", {
        alert: `Submitted`,
    });

});



app.get("/profile", checkAuth, (req, res, next) => {

    renderTemplate(res, req, "user/profile.ejs", {
        alert: null,
    });

});

app.post("/profile/notification_settings", checkAuth, async (req, res, next) => {

    const user = await User.findOne({
        email: req.user.email
    });

    if (user) {
        if (req.body.noti1) {
            user.profile.settings.news_and_updates = true
        } else {
            user.profile.settings.news_and_updates = false
        };


        if (req.body.noti2) {
            user.profile.settings.product_updates = true
        } else {
            user.profile.settings.product_updates = false
        };


        if (req.body.noti3) {
            user.profile.settings.account_changes = true
        } else {
            user.profile.settings.account_changes = false
        };


        if (req.body.noti4) {
            user.profile.settings.weekly_statistics = true
        } else {
            user.profile.settings.weekly_statistics = false
        };

        await user.save();

    }
});




app.post("/profile/change_profile_picture", checkAuth, async (req, res, next) => {


    const user = await User.findOne({
        email: req.user.email
    });

    if (user) {


        if (req && req.file && req.file.path) {
            if (user.profile.image) {
                await deleteFile(user.profile.image)
            };
            user.profile.image = req.file.path;
            await user.save();

            return renderTemplate(res, req, "user/profile.ejs", {
                alert: null,
            });
        };



        renderTemplate(res, req, "user/profile.ejs", {
            alert: `Image format not supported. Supported Formats: /png - /jpeg`,
            path: null,
        });

    };




});

app.post("/profile/change_password",
    checkAuth,
    body('oldpassword').isLength({
        min: 6,
        max: 32
    }).withMessage('Please provide a password (6 - 32ch)'),
    body('newpassword').isLength({
        min: 6,
        max: 32
    }).withMessage('Please provide a password (6 - 32ch)'),
    async (req, res, next) => {


        const user = await User.findOne({
            email: req.user.email
        });

        if (user) {

            const oldpass = req.body.oldpassword;
            const newpass = req.body.newpassword;


            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return renderTemplate(res, req, "user/profile.ejs", {
                    alert: errors.array()[0].msg,
                });
            };
            if (!oldpass || !newpass) {
                return res.redirect('/profile')
            }
            const doMatch = await bcrypt.compare(oldpass, user.password);
            if (!doMatch) {
                return renderTemplate(res, req, "user/profile.ejs", {
                    alert: `Invalid old Password provided.`
                });
            };

            if (change_password_cooldown.has(user._id.toString())) {
                return renderTemplate(res, req, "user/profile.ejs", {
                    alert: `You recently changed your password. Please come back later. (default cooldown: 1 hour)`
                });
            }


            const newUserPassword = await bcrypt.hash(newpass, 12);
            user.password = newUserPassword;
            await user.save();

            req.user = null;
            req.session.destroy(err => {



                renderTemplate(res, req, "auth/login.ejs", {
                    alert: `Successfully changed passwords! Please login`,
                });
                change_password_cooldown.add(user._id.toString());
                setTimeout(() => {
                    change_password_cooldown.delete(user._id.toString());
                }, 3600000);




                try {
                    if (user.profile.settings.account_changes) {
                        const recipients = [new Recipient(user.email, user.username)];

                        const emailParams = new EmailParams()
                            .setFrom("support@ecoplug.xyz")
                            .setFromName("Ecoplug")
                            .setRecipients(recipients)
                            .setSubject(`${user.username} | Password Change`)
                            .setHtml(`
<!doctype html>
<html lang="en-US">

<head>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <title>Reset Password</title>
    <meta name="description" content="Hey ${user.username}, someone just reset the password!">
    <style type="text/css">
        a:hover {text-decoration: underline !important;}
    </style>
</head>

<body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
    <!--100% body table-->
    <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
        style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
        <tr>
            <td>
                <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
                    align="center" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="height:80px;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td style="text-align:center;">
                          <a href="https://ecoplug.xyz" title="logo" target="_blank">
                            <img width="120px" height="120px" src="https://ecoplug.xyz/logo.png" title="logo" alt="logo">
                          </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="height:20px;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td>
                            <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                <tr>
                                    <td style="height:40px;">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="padding:0 35px;">
                                        <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">Hey ${user.username}, Your password has changed. </h1>
                                        <span
                                            style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                        <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                           Hey ${user.username}, the password on your account was changed, if it was you ignore this email.<b> Not you? Click on the button below to reset your password!</b>
                                        </p>
                                        <a href="https://ecoplug.xyz/forgot/"
                                            style="background:#20e277;text-decoration:none !important; font-weight:500; margin-top:35px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Reset
                                            Password</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="height:40px;">&nbsp;</td>
                                </tr>
                            </table>
                        </td>
                    <tr>
                        <td style="height:20px;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td style="text-align:center;">
                            <p style="font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;"><strong>www.ecoplug.xyz</strong></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="height:80px;">&nbsp;</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    <!--/100% body table-->
</body>

</html>`)
                            .setText("Passoword change on your account");
                        mailersend.send(emailParams);
                    }
                } catch (error) {
                    return
                }




            });



        }
    });


app.post(
    '/signup',
    body('email').isEmail().withMessage('Please provide a valid email adress.'),
    body('password').isLength({
        min: 6,
        max: 32
    }).withMessage('Please provide a password (6 - 32ch)'),
    body('username').isLength({
        min: 5,
        max: 32
    }).withMessage('Please provide a username (5 - 32ch)'),

    async (req, res) => {

        const errors = validationResult(req);


        const email = req.body.email;
        const password = req.body.password;
        const cpassword = req.body.confirmPassword;
        const username = req.body.username

        if (!email) {
            return renderTemplate(res, req, "auth/signup.ejs", {
                alert: `Please provide an email adress`,
            });
        };

        if (!password || !cpassword) {
            return renderTemplate(res, req, "auth/signup.ejs", {
                alert: `Please provide a password`,
            });
        }

        if (password !== cpassword) {
            return renderTemplate(res, req, "auth/signup.ejs", {
                alert: `Please provide matching passwords.`,
            });
        }




        if (!errors.isEmpty()) {
            return renderTemplate(res, req, "auth/signup.ejs", {
                alert: errors.array()[0].msg,
            });
        };

        const validateUsernameDatabase = await User.findOne({
            username: username.toLowerCase()
        });

        if (validateUsernameDatabase) {
            renderTemplate(res, req, "auth/signup.ejs", {
                alert: `This username is taken. Please try another`,
            });
            return;
        }

        const validateEmailDatabase = await User.findOne({
            email: email.toLowerCase()
        });

        if (validateEmailDatabase) {
            renderTemplate(res, req, "auth/signup.ejs", {
                alert: `This email is already signed up. Press login to login!`,
            });
            return;
        };

        if (req.user) {
            renderTemplate(res, req, "auth/signup.ejs", {
                alert: `You are already logged in as ${req.user.username}!`,
            });
            return;
        };

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            email: email.split(" ").join("").toLowerCase(),
            password: hashedPassword,
            username: username.split(" ").join("").toLowerCase(),
            joinedAt: Date.now()
        });
        await user.save();


        res.redirect('/login?user=authenticated')

        try {


            const recipients = [new Recipient(user.email, user.username)];

            const emailParams = new EmailParams()
                .setFrom("support@ecoplug.xyz")
                .setFromName("Ecoplug")
                .setRecipients(recipients)
                .setSubject(`${user.username} |  Welcome to Ecoplug`)
                .setHtml(`<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title></title>

    <!--[if !mso]><!-->
    <style type="text/css">
        @import url('https://fonts.googleapis.com/css?family=Inter:400,600');
    </style>
    <!--<![endif]-->

    <style type="text/css" rel="stylesheet" media="all">
        @media only screen and (max-width: 640px) {

            .ms-header {
                display: none !important;
            }
            .ms-content {
                width: 100% !important;
                border-radius: 0;
            }
            .ms-content-body {
                padding: 30px !important;
            }
            .ms-footer {
                width: 100% !important;
            }
            .mobile-wide {
                width: 100% !important;
            }
            .info-lg {
                padding: 30px;
            }
        }
    </style>
    <!--[if mso]>
    <style type="text/css">
    body { font-family: Arial, Helvetica, sans-serif!important  !important; }
    td { font-family: Arial, Helvetica, sans-serif!important  !important; }
    td * { font-family: Arial, Helvetica, sans-serif!important  !important; }
    td p { font-family: Arial, Helvetica, sans-serif!important  !important; }
    td a { font-family: Arial, Helvetica, sans-serif!important  !important; }
    td span { font-family: Arial, Helvetica, sans-serif!important  !important; }
    td div { font-family: Arial, Helvetica, sans-serif!important  !important; }
    td ul li { font-family: Arial, Helvetica, sans-serif!important  !important; }
    td ol li { font-family: Arial, Helvetica, sans-serif!important  !important; }
    td blockquote { font-family: Arial, Helvetica, sans-serif!important  !important; }
    th * { font-family: Arial, Helvetica, sans-serif!important  !important; }
    </style>
    <![endif]-->
</head>
<body style="font-family:'Inter', Helvetica, Arial, sans-serif; width: 100% !important; height: 100%; margin: 0; padding: 0; -webkit-text-size-adjust: none; background-color: #f4f7fa; color: #4a5566;" >

<div class="preheader" style="display:none !important;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;" ></div>

<table class="ms-body" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;background-color:#f4f7fa;width:100%;margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;" >
    <tr>
        <td align="center" style="word-break:break-word;font-family:'Inter', Helvetica, Arial, sans-serif;font-size:16px;line-height:24px;" >

            <table class="ms-container" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;" >
                <tr>
                    <td align="center" style="word-break:break-word;font-family:'Inter', Helvetica, Arial, sans-serif;font-size:16px;line-height:24px;" >

                        <table class="ms-header" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;" >
                            <tr>
                                <td height="40" style="font-size:0px;line-height:0px;word-break:break-word;font-family:'Inter', Helvetica, Arial, sans-serif;" >
                                    &nbsp;
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>
                <tr>
                    <td align="center" style="word-break:break-word;font-family:'Inter', Helvetica, Arial, sans-serif;font-size:16px;line-height:24px;" >

                        <table class="ms-content" width="640" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;width:640px;margin-top:0;margin-bottom:0;margin-right:auto;margin-left:auto;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;background-color:#FFFFFF;border-radius:6px;box-shadow:0 3px 6px 0 rgba(0,0,0,.05);" >
                            <tr>
                                <td class="ms-content-body" style="word-break:break-word;font-family:'Inter', Helvetica, Arial, sans-serif;font-size:16px;line-height:24px;padding-top:40px;padding-bottom:40px;padding-right:50px;padding-left:50px;" >

                                    <p class="logo" style="margin-right:0;margin-left:0;line-height:28px;font-weight:600;font-size:21px;color:#111111;text-align:center;margin-top:0;margin-bottom:40px;" ><span style="color:#0052e2;font-family:Arial, Helvetica, sans-serif;font-size:30px;vertical-align:bottom;" ><img style="height: 20px; width: 20px;"src="https://ecoplug.xyz/logo.png" />&nbsp;</span>Ecoplug</p>

                                    <h1 style="margin-top:0;color:#111111;font-size:24px;line-height:36px;font-weight:600;margin-bottom:24px;" >Welcome, ${user.username}!</h1>

                                    <p style="color:#4a5566;margin-top:20px;margin-bottom:20px;margin-right:0;margin-left:0;font-size:16px;line-height:28px;" >Thanks for trying Ecoplug. We’re thrilled to have you on board. To get the most out of ${user.username}, Customise your profile here:</p>

                                    <table width="100%" align="center" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;" >
                                        <tr>
                                            <td align="center" style="padding-top:20px;padding-bottom:20px;padding-right:0;padding-left:0;word-break:break-word;font-family:'Inter', Helvetica, Arial, sans-serif;font-size:16px;line-height:24px;" >

                                                <table class="mobile-wide" border="0" cellspacing="0" cellpadding="0" role="presentation" style="border-collapse:collapse;" >
                                                    <tr>
                                                        <td align="center" class="btn" style="word-break:break-word;font-family:'Inter', Helvetica, Arial, sans-serif;font-size:16px;line-height:24px;background-color:#0052e2;box-shadow:0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -1px rgba(0,0,0,.06);border-radius:3px;" >
                                                            <a href="https://ecoplug.xyz/profile" target="_blank" style="background-color:#0052e2;padding-top:14px;padding-bottom:14px;padding-right:30px;padding-left:30px;display:inline-block;color:#FFF;text-decoration:none;border-radius:3px;-webkit-text-size-adjust:none;box-sizing:border-box;border-width:0px;border-style:solid;border-color:#0052e2;font-weight:600;font-size:15px;line-height:21px;letter-spacing:0.25px;" >Customise</a>
                                                        </td>
                                                    </tr>
                                                </table>

                                            </td>
                                        </tr>
                                    </table>

                                    <p style="color:#4a5566;margin-top:20px;margin-bottom:20px;margin-right:0;margin-left:0;font-size:16px;line-height:28px;" >For reference, here's your login information:</p>

                                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;" >
                                        <tr>
                                            <td class="info" style="word-break:break-word;font-family:'Inter', Helvetica, Arial, sans-serif;font-size:16px;line-height:24px;padding-top:20px;padding-bottom:20px;padding-right:20px;padding-left:20px;border-radius:4px;background-color:#f4f7fa;" >

                                                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;" >
                                                    <tr>
                                                        <td style="word-break:break-word;font-family:'Inter', Helvetica, Arial, sans-serif;font-size:16px;line-height:24px;" >
                                                            <strong style="font-weight:600;" >Login Page:</strong> https://ecoplug.xyz/login
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="word-break:break-word;font-family:'Inter', Helvetica, Arial, sans-serif;font-size:16px;line-height:24px;" >
                                                            <strong style="font-weight:600;" >Username:</strong> ${user.username}
                                                        </td>
                                                    </tr>
                                                </table>

                                            </td>
                                        </tr>
                                    </table>

                                

                                    <p style="color:#4a5566;margin-top:20px;margin-bottom:20px;margin-right:0;margin-left:0;font-size:16px;line-height:28px;" ><b>Cheers,</b>
                                        <br>The Ecoplug Team!</p>

                              

                                    <table width="100%" style="border-collapse:collapse;" >
                                        <tr>
                                            <td height="20" style="font-size:0px;line-height:0px;word-break:break-word;font-family:'Inter', Helvetica, Arial, sans-serif;" >
                                                &nbsp;
                                            </td>
                                        </tr>
                                        <tr>
                                            <td height="20" style="font-size:0px;line-height:0px;border-top-width:1px;border-top-style:solid;border-top-color:#e2e8f0;word-break:break-word;font-family:'Inter', Helvetica, Arial, sans-serif;" >
                                                &nbsp;
                                            </td>
                                        </tr>
                                    </table>

                                    <p class="small" style="color:#4a5566;margin-top:20px;margin-bottom:20px;margin-right:0;margin-left:0;font-size:14px;line-height:21px;" >If you're unsure of your password you can reset it <a href="https://ecoplug.xyz/forgot/"> by clicking here</a>.</p>

                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>
            </table>

        </td>
    </tr>
</table>

</body>
</html>
`)
                .setText(`Hey ${user.username}, Welcome to ecoplug!!`);
            mailersend.send(emailParams);
        } catch (error) {
            return;
        }

    },
);
app.get("/signup", (req, res, next) => {

    renderTemplate(res, req, "auth/signup.ejs", {
        alert: null,
    });

});


app.post(
    '/login',
    body('email').isEmail().withMessage('Please provide a valid email adress.'),
    body('password').isLength({
        min: 6,
        max: 32
    }).withMessage('Please provide a password (6 - 32ch)'),

    async (req, res) => {

        const errors = validationResult(req);


        const email = req.body.email;
        const password = req.body.password;


        if (!email) {
            return renderTemplate(res, req, "auth/login.ejs", {
                alert: `Please provide an email adress`,
            });
        };

        if (!password) {
            return renderTemplate(res, req, "auth/login.ejs", {
                alert: `Please provide a password`,
            });
        }


        if (!errors.isEmpty()) {
            return renderTemplate(res, req, "auth/login.ejs", {
                alert: errors.array()[0].msg,
            });
        };

        try {

            const user = await User.findOne({
                email: email.toLowerCase()
            });
            if (!user) {
                return renderTemplate(res, req, "auth/login.ejs", {
                    alert: `An invalid email or password was provided.`,
                });
            };

            if (req.user) {
                renderTemplate(res, req, "auth/signup.ejs", {
                    alert: `You are already logged in as ${req.user.username}!`,
                });
                return;
            };

            const doMatch = await bcrypt.compare(password, user.password);
            if (doMatch) {
                req.session.isLoggedIn = true;
                req.session.user = user;
                return req.session.save(err => {
                    res.redirect(req.session.backURL ? req.session.backURL : '/profile');
                });
            }
            return renderTemplate(res, req, "auth/login.ejs", {
                alert: `Invalid Email or Password Provided.`,
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



        if (!email) {
            return renderTemplate(res, req, "auth/forgot.ejs", {
                alert: `Please provide an email adress`,
            });
        };



        const user = await User.findOne({
            email: email.toLowerCase()
        });
        if (!user) {
            return renderTemplate(res, req, "auth/forgot.ejs", {
                alert: `An invalid email was provided.`,
            });
        };

        if (emailCooldown.has(user._id.toString())) {
            return renderTemplate(res, req, "auth/forgot.ejs", {
                alert: `We already sent an email. Please check your inbox/junk/spam folder!`,
            });
        };

        crypto.randomBytes(32, async (err, buffer) => {
            if (err) {
                return res.redirect('/forgot');
            }

            const token = buffer.toString('hex');


            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            await user.save();


            renderTemplate(res, req, "auth/forgot.ejs", {
                alert: `An email was sent to your inbox. Please check your email!`,
            });

            const recipients = [new Recipient(user.email, user.username)];

            const emailParams = new EmailParams()
                .setFrom("support@ecoplug.xyz")
                .setFromName("Ecoplug")
                .setRecipients(recipients)
                .setSubject(`${user.username} | Password Reset`)
                .setHtml(`
<!doctype html>
<html lang="en-US">

<head>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <title>Reset Password</title>
    <meta name="description" content="Hey ${user.username}, You requested a password reset!">
    <style type="text/css">
        a:hover {text-decoration: underline !important;}
    </style>
</head>

<body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
    <!--100% body table-->
    <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
        style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
        <tr>
            <td>
                <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
                    align="center" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="height:80px;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td style="text-align:center;">
                          <a href="https://ecoplug.xyz" title="logo" target="_blank">
                            <img width="120px" height="120px" src="https://ecoplug.xyz/logo.png" title="logo" alt="logo">
                          </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="height:20px;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td>
                            <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                <tr>
                                    <td style="height:40px;">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="padding:0 35px;">
                                        <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">Hey ${user.username}, You have
                                            requested to reset your password</h1>
                                        <span
                                            style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                        <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                           To reset your password, click the
                                            following link and enter your new Password. <b>This will expire in 1 hour</b>
                                        </p>
                                        <a href="https://ecoplug.xyz/forgot/${token}"
                                            style="background:#20e277;text-decoration:none !important; font-weight:500; margin-top:35px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Reset
                                            Password</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="height:40px;">&nbsp;</td>
                                </tr>
                            </table>
                        </td>
                    <tr>
                        <td style="height:20px;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td style="text-align:center;">
                            <p style="font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;"><strong>www.ecoplug.xyz</strong></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="height:80px;">&nbsp;</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    <!--/100% body table-->
</body>

</html>`)
                .setText("You requested a password reset.");
            mailersend.send(emailParams);
            emailCooldown.add(user._id.toString());
            setTimeout(() => {
                emailCooldown.delete(user._id.toString());
            }, 3600000)
        });

    },
);


app.post(
    "/new-password",
    body('password').isLength({
        min: 6,
        max: 32
    }).withMessage('Please provide a password (6 - 32ch)'),
    async (req, res) => {
        const newPassword = req.body.password;
        const userId = req.body.userId;
        const passwordToken = req.body.passwordToken;

        if (!newPassword) {
            renderTemplate(res, req, "auth/newpass.ejs", {
                alert: `Please provide a password!`,
                userId: userId,
                passwordToken: passwordToken,
            });

        };

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return renderTemplate(res, req, "auth/newpass.ejs", {
                alert: errors.array()[0].msg,
                userId: userId,
                passwordToken: passwordToken,
            });
        };


        if (!userId || !passwordToken) return res.redirect('/forgot')



        let resetUser;
        const user = await User.findOne({
            resetToken: passwordToken,
            resetTokenExpiration: {
                $gt: Date.now()
            },
            _id: userId
        });

         
        resetUser = user;
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        await resetUser.save();


        return renderTemplate(res, req, "auth/login.ejs", {
            alert: `Password Changed. Please login!`,
        });
    },
);

app.get('/forgot/:token', async function(req, res) {


    const token = req.params.token;
    const user = await User.findOne({
        resetToken: token,
        resetTokenExpiration: {
            $gt: Date.now()
        }
    });
    if (!user) {
        return renderTemplate(res, req, "auth/forgot.ejs", {
            alert: `Invalid Reset token was provided..`,
        });
    
    } else {
      
        return renderTemplate(res, req, "auth/newpass.ejs", {
            alert: null,
            userId: user._id.toString(),
            passwordToken: token
        });
    }
});




app.get("/forgot", function(req, res) {

    return renderTemplate(res, req, "auth/forgot.ejs", {
        alert: null,
    });
});

app.get("/logout", function(req, res) {

    req.session.destroy(err => {
        res.redirect('/');
    });

});



app.get("/", async (req, res) => {


    renderTemplate(res, req, "index.ejs", {});

});



app.get("/products", async (req, res) => {

    return res.send('The current feature is under development!')

});


app.post("/products", async (req, res) => {
    return res.send('The current feature is under development!')

});


app.get("*", async (req, res) => {
    renderTemplate(res, req, "other/404.ejs", {});

});

const dbOptions = {
    keepAlive: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
};

mongoose.connect(process.env.mongo, dbOptions)

app.listen(process.env.PORT || 5003, () => console.log(`Running Website!`));

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}