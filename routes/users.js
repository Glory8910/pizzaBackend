var express = require('express');
var router = express.Router();
var mongoose = require('mongoose')
var bcrypt = require('bcrypt')
let jwt = require('jsonwebtoken')
const nodemailer = require("nodemailer");
const { google } = require('googleapis')
require('dotenv').config();
var { nanoid } = require("nanoid");
var ids = nanoid(5);

const { receiptscopy } = require('../models/tranactionrecipts')

const { userdata } = require('../models/dataformat')


const uri = `mongodb+srv://seeli:${process.env.PASS}@bytes.olk9c.mongodb.net/cookit?retryWrites=true&w=majority`

var client = mongoose.connect(uri, { useNewUrlParser: true }, { useUnifiedTopology: true });

console.log(process.env.KEY_ID)

var Razorpay = require("razorpay");
const { errorMonitor } = require('events');
var razorpay = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SEC

});


let jwtsecret = process.env.JWT_SECRET
let CLIENT_ID = process.env.ID
let CLIENT_SECRET = process.env.SECRET
let REDIRECT_URI = process.env.URI
let REFRESH_TOKEN = process.env.TOKEN
let key = process.env.PASSWORD

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN })

const acessToken = oAuth2Client.getAccessToken()

const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: "oAuth2",
    user: "workatalltimemail@gmail.com",
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    refreshToken: REFRESH_TOKEN,
    accessToken: acessToken
  }
})


async function sendMail(a) {
  try {


    if (a.id) {
      console.log(`https://pizzabytes.herokuapp.com/users/checkmail/${a.id}/${a.email}`)
      const opt = {
        from: "workatalltimemail@gmail.com",
        to: a.email,
        subject: "Reset link",
        text: "you can clik the link for resetting you password",


        html: `<a href="https://pizzabytes.herokuapp.com/users/checkmail/${a.id}/${a.email}""> reset password </a>`
      }

      const result1 = await transport.sendMail(opt)
      return result1
    }
    else {

      const mailoptions = {
        from: "workatalltimemail@gmail.com",
        to: a,
        subject: "hii hello and we are glad you are here",
        text: "Greetings",
        html: "<h1>welcome</h1>"
      }


      const mailtoadmin = {
        from: "workatalltimemail@gmail.com",
        to: "workatalltimemail@gmail.com",
        subject: "new user have registered",
        text: `${a} has registered`
      }

      const result = await transport.sendMail(mailoptions)


      const alertnotify = await transport.sendMail(mailtoadmin)


      return result, alertnotify
    }


  } catch (err) {
    console.log(err)
  }
}





router.post("/reg", async function (req, res) {
  try {

    await mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });


    console.log(req.body.name, req.body.password, req.body.email)

    let salt = await bcrypt.genSalt(10);
    console.log(salt);
    let hash = await bcrypt.hash(req.body.password, salt)
    console.log(hash)
    req.body.password = hash;

    let user = await new userdata({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      roles: ["user"],
      resetid: "",
      transactionId: " ",
      transactionAmount: 0
     

    });

    await user.save();



    res.status(200).json({ "message": "added user" });
    await mongoose.disconnect();


  }
  catch (error) {
    res.status(404).json({ "error": "failed added user" });
    console.log(error)
  }


})


// router.post("/admin/reg", async function (req, res) {
//   try {

//     await mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });


//     console.log(req.body.name, req.body.password, req.body.email)

//     let salt = await bcrypt.genSalt(10);
//     console.log(salt);
//     let hash = await bcrypt.hash(req.body.password, salt)
//     console.log(hash)
//     req.body.password = hash;

//     let user = new userdata({
//       name: req.body.name,
//       email: req.body.email,
//       password: req.body.password,
//       roles: ["user", "admin"],
//       resetid: "",
//       transactionId: " ",
//       transactionAmount: 0,
//       transactionCount: 0
//     });
//     user.save();


//     res.json({ "message": "added user" });

//     await mongoose.disconnect();


//   }
//   catch (error) {
//     console.log(error)
//   }

// })


router.post("/login", async (req, res) => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });

    console.log(req.body.email, "mail")

    let user = await userdata.findOne({ email: req.body.email })
    console.log(user);


    if (user) {

      let comp = await bcrypt.compare(req.body.password, user.password);
      console.log(comp, "value")
      if (comp) {

        let token = jwt.sign({ userid: user._id }, jwtsecret, { expiresIn: '1h' })

        console.log(token)

        res.json({ token: token, role: user.roles })



      }
      else {
        res.json({ "mess": "invalid credentials" })
      }

    } else {
      console.log("user not found")
    }

    await mongoose.disconnect()
  }
  catch (err) {
    console.log(err)
  }

})



router.post("/reset", async (req, res) => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });

    console.log(req.body)
    let user = await userdata.findOne({ email: { $eq: req.body.email } })
    console.log(user)
    if (user) {
      console.log(ids)
      let identity = {};
      identity.id = ids;
      identity.email = req.body.email;

      let updated = await userdata.findOneAndUpdate(
        { email: req.body.email },
        { resetid: ids });
     

      console.log(updated)
      await sendMail(identity)
        .then((result) => console.log("mail sent", result))
        .catch((error) => console.log(error))

      res.status(200).json({ "mess": "reset ready" })
    }
    else {
      res.status(404).json({ "mess": "user not found" })
    }
    await mongoose.disconnect();

  } catch (err) {
    res.status(404)
    console.log(err)
  }
})


router.get("/checkmail/:splid/:emailid", async (req, res) => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
    let user = await userdata.findOne({ email: { $eq: req.params.emailid } })
    if (user.resetid == req.params.splid) {
      res.redirect("https://pizzabytes.netlify.app/resetpassword")


    }
    else {
      res.status(404).json({ 'mess': "invalid details" })
    }
    await mongoose.disconnect();

  }
  catch (error) {
    res.status(404).json({ 'mess': "invalid details" })
    console.log(error)
  }
})





router.post("/resetpassword", async (req, res) => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });

    console.log(req.body, "given data");


    let user = await userdata.findOne({ email: { $eq: req.body.email } })

    console.log(user);


    if (user) {

      const salt = bcrypt.genSaltSync(10);

      let hash = await bcrypt.hash(req.body.password, salt)
      console.log(salt, hash)


      let doc = await userdata.updateOne({ _id: user._id }, {
        $set: { password: hash }
      });

      userdata.updateOne({ _id: user._id }, { $set: { resetid: "" } })




      res.status(200).json({ "mess": "password is reset" })

    }
    else {
      res.status(400).json({ "mess": "invalid credentials" })
    }
    await mongoose.disconnect()

  }
  catch (err) {
    console.log(err)
    res.status(400).json({ "mess": "invalid credentials" })

  }

})



function authenticate(req, res, next) {
  console.log(req.headers.authorization, "SEE", req.body)
  try {
    if (req.headers.authorization) {

      jwt.verify(req.headers.authorization, jwtsecret, function (err, data) {
        console.log(data)
        if (err) {
          console.log(err)
          res.status(500).json({ message: err })
        }
        if (data) {
          console.log("first data", data)
          next();
        }
      }
      );


    }
    else {
      res.json({ "mess": "invalid creditials" })
    }
  }
  catch (err) {
    console.log(err)
  }
}





router.post("/isauthenticated", authenticate, async (req, res) => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });

    console.log(req.header, "given data");



    jwt.verify(req.headers.authorization, jwtsecret, async function (err, data) {
      if (err) {
        res.status(500).json({ message: err })
      }
      if (data) {
        console.log(data.userid)

        let user = await userdata.findOne({ _id: { $eq: (data.userid) } })

        console.log(user);



        res.json({ userdetails: user.email, token: req.headers.authorization, role: user.roles })

      }
      await mongoose.disconnect()

    })



  }
  catch (err) {
    console.log(err)
  }

})




router.post("/razorid", async (req, res) => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });

    console.log(req.body.email, "mail")



    let t = nanoid(10).toString()

    let useradd = await userdata.updateMany({ email: req.body.email }, ({ transactionId: t, transactionAmount: req.body.amountpayable }))
    const payment_capture = 1;
    console.log("amo", req.body.amountpayable)
    let options = ({
      amount: (req.body.amountpayable * 100).toString(),
      currency: "INR",
      receipt: t,
      payment_capture
    })

    const response = await razorpay.orders.create(options)
    console.log(response)

    console.log(useradd)
    res.status(200).json({ "transactionId": t })

    await mongoose.disconnect()




  }




  catch (err) {
    res.status(400)
    console.log(err)
  }

})



router.post('/verifyrazor', async (req, res) => {


  try {

    await mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });

    const secret = process.env.RAZORSECRET
    console.log(req.header)
    const crypto = require('crypto')


    const shasum = crypto.createHmac("sha256", secret)
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");


    console.log(digest, req.headers['x-razorpay-signature'])

    if (req.headers['x-razorpay-signature'] === digest) {
      let details = new receiptscopy({
        receipts: req.body
      });
      details.save();






      console.log("legid");

      await mongoose.disconnect()

    }
    else {
      console.log("false")
    }

    console.log(req.body, "iam response");
    res.json({ status: 'ok' })
  } catch (error) {
    
    console.log(error)
  }




})


router.get("/", (req, res) => {
  res.json({ "message": "hello" })
})

module.exports = router;
