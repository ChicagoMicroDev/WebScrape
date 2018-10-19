var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");
var axios = require("axios");
var cheerio = require("cheerio");
var exphbs = require("express-handlebars");
var Note = require("./models/note.js");
// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({extended: true}));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost/mongoHeadlines", { useNewUrlParser: true });



app.use(express.static("public"));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));

// parse application/json
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/public')));
// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");

// app.engine("handlebars", exphbs({defaultLayout: "main", layoutsDir: __dirname + "/views/layouts"}));
// app.set("view engine", "handlebars");
// A GET route for scraping the echoJS website

app.get("/", function (req,res) {
    db.Article.find({})
        .then(function (dbArticles) {
            res.render("index", {
                articles: dbArticles
            })

        })
        .catch(function (err) {
            res.json(err)

        })

});

app.get("/scrape", function(req, res) {
    // First, we grab the body of the html with request
    axios.get("https://www.chicagobusiness.com/").then(function(response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);


        // Now, we grab every h2 within an article tag, and do the following:
        $("a h1").each(function(i, element) {
            // Save an empty result object
            var result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(this).text();
                // .children().first()
                // .data;
            result.link = $(this).parent("a").attr("href");
                // .children("a")
                // .attr("href");
            console.log(result);

            // Create a new Article using the `result` object built from scraping
            db.Article.create(result)
                .then(function(dbArticle) {
                    // View the added result in the console
                    console.log(dbArticle);
                })
                .catch(function(err) {
                    // If an error occurred, send it to the client
                    return res.json(err);
                });
        });

        // If we were able to successfully scrape and save an Article, send a message to the client
        res.redirect("/");
    });
});

app.get("/articles/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
        .populate("note")
        .then(function(dbArticle) {
            // If we were able to successfully find an Article with the given id, send it back to the client
            res.json(dbArticle);
        })
        .catch(function(err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});


app.post("/notesaved/:id", function (req,res) {
    var  newnNote = new Note(req.body);
    newnNote.save(function (error, doc) {
        if(error){
            console.log(error)
        }else{
            console.log()
        }
    })




})

app.listen(PORT, function () {
    console.log("App now listening at localhost:" + PORT);
});

