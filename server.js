// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var Promise = require("bluebird");
var request = require("request");
var cheerio = require("cheerio");

var Note = require("./models/Note.js");
var Article = require("./models/Article.js");


mongoose.Promise = Promise;

// Initialize Express
var app = express();

app.use(bodyParser.urlencoded({
    extended: false
}));

//make public a static dir
app.use(express.static("public"));

mongoose.connect("mongodb://localhost/articles");
var db = mongoose.connection;

db.on("error", function(error){
    console.log("Mongoose Error", error);
});

db.once("open", function(){
    console.log("Mongoose connection successful.");
});

//Routes
app.get("/", function(req, res){
    res.send(index.html);
});

app.get("/scrape", function(req, res){
    request("http://www.echojs.com/", function(error, response, html){
        var $ = cheerio.load(html);

        $("article h2").each(function(i, element){
            var result = {};
            result.title = $(this).children("a").text();
            result.link = $(this).children("a").attr("href");

            var entry = new Article(result);
            entry.save(function(err, doc){
                if(err){
                    console.log(err);
                }
            });
        });
    });

    res.send("Scrape Complete.");
});

app.get("/articles", function(req, res){
    Article.find({}, function(error, doc){
        if(error){
            console.log(error);
        }else{
            res.json(doc);
        }
    });
});

app.get("/articles/:id", function(req, res){
    Article.findOne({"_id": req.params.id})
    .populate("note")
    .exec(function(error, doc){
        if(error){
            console.log(error);
        }else{
            res.json(doc);
        }
    });
});

app.post("/articles/:id", function(req, res){
    var newNote = new Note(req.body);

    newNote.save(function(error, doc){
        if(error){
            console.log(error);
        }else{
            Article.findOneAndUpdate({"_id": req.params.id},{"note": doc._id})
            .exec(function(err, doc){
                if(error){
                    console.log(error);
                }else{
                    res.json(doc);
                }
            });
        }
    });
});

app.listen(8080, function() {
  console.log("App running on port 8080!");
});
