var express     =   require("express");
var app         =   express();
var bodyParser  =   require("body-parser");
var logger      = require('morgan');
var jwt    = require('jsonwebtoken');
var config = require('./config/config');
var Users     =   require("./models/user");
var Stripe     =   require("./models/sprite");
var router      =   express.Router();
var stripe = require("stripe")(
    config.spritekey
);

app.set('secret', config.secret);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended" : false}));

router.get("/",function(req,res){
    res.sendFile(__dirname+"/public/index.html");

});

router.get("/app.js",function(req,res){
    res.sendFile(__dirname+"/public/app.js");

});


router.post("/payment",function(req,res){

    stripe.charges.create({
        amount: req.body.amount,
        currency: "usd",
        source: req.body.stripeToken, // obtained with Stripe.js
        description: "Charge for test@node-test.com"
    }, function(err, charge) {
        if(err){
            throw err;
        }
        var response = {};
        var stripeObj = new Stripe();
        stripeObj.id = charge.id;
        stripeObj.amount = charge.amount;
        stripeObj.balance_transaction = charge.balance_transaction;
        stripeObj.paid = charge.paid;
        stripeObj.status = charge.status;
        stripeObj.save(function(err){
            if(err) {
                response = {"error" : true,"message" : "Error making payment"};
            } else {
                response = {"error" : false,"message" : "Payment succeeded"};
            }
            res.json(response);

        });

    });

});


router.post("/users", function(req,res){
    var db = new Users();
    var response = {};
    db.userEmail = req.body.email;
    db.userPassword = require('crypto').createHash('sha1').update(req.body.password).digest('base64');
    db.save(function(err){
        if(err) {
            response = {"error" : true,"message" : "Error adding data"};
        } else {
            response = {"error" : false,"message" : "Data added"};
        }
        res.json(response);
    });
});

router.post('/authenticate', function(req, res) {

    Users.findOne({
        userEmail: req.body.email
    }, function(err, user) {

        if (err) throw err;

        if (!user) {
            res.json({ success: false, message: 'Authentication failed. User not found.' });
        } else if (user) {


            if (user.userPassword !== require('crypto').createHash('sha1').update(req.body.password).digest('base64')) {
                res.json({ success: false, message: 'Authentication failed. Wrong password.' });
            } else {


                var token = jwt.sign(user, app.get('secret'), {
                    expiresIn: 1440 //24 hours
                });

                res.json({
                    success: true,
                    message: 'Received token!',
                    token: token
                });
            }

        }

    });
});

router.use(function(req, res, next) {

    var token = req.body.token || req.query.token || req.headers["authorization"];

    if (token) {

        jwt.verify(token, app.get('secret'), function(err, decoded) {
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {

                req.decoded = decoded;
                next();
            }
        });

    } else {

        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }
});



router.get("/users", function(req,res){
        var response = {};
        Users.find({},function(err,data){
            if(err) {
                response = {"error" : true,"message" : "Error fetching data"};
            } else {
                response = {"error" : false,"message" : data};
            }
            res.json(response);
        });
    });

router.route("/users/:email")
    .get(function(req,res){
        var response = {};
        Users.findOne({
            userEmail: req.params.email },function(err,data){
            if(err) {
                response = {"error" : true,"message" : "Error fetching data"};
            } else {
                response = {"error" : false,"message" : data};
            }
            res.json(response);
        });
    })
    .put(function(req,res){
        var response = {};
        Users.findOne({
            userEmail: req.params.email },function(err,data){
            if(err) {
                response = {"error" : true,"message" : "Error fetching data"};
            } else {
                if(req.body.userEmail !== undefined) {
                    data.userEmail = req.body.userEmail;
                }
                if(req.body.password !== undefined) {
                    data.userPassword = require('crypto').createHash('sha1').update(req.body.password).digest('base64');
                }
                data.save(function(err){
                    if(err) {
                        response = {"error" : true,"message" : "Error updating data"};
                    } else {
                        response = {"error" : false,"message" : "Data is updated for "+req.params.email};
                    }
                    res.json(response);
                })
            }
        });
    })
    .delete(function(req,res){
        var response = {};
        Users.findOne({
            userEmail: req.params.email },function(err,data){
            if(err) {
                response = {"error" : true,"message" : "Error fetching data"};
            } else {
                Users.remove({userEmail : req.params.email},function(err){
                    if(err) {
                        response = {"error" : true,"message" : "Error deleting data"};
                    } else {
                        response = {"error" : true,"message" : "Data associated with "+req.params.email+"is deleted"};
                    }
                    res.json(response);
                });
            }
        });
    })

app.use('/',router);

app.listen(process.env.PORT || 3000);
console.log("Listening to PORT "+process.env.PORT +" or "+ 3000);
