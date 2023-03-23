const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.set("view engine", 'ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.get("/", function(req, res) {
    res.render("home");
})

app.get("/about", function(req, res) {
    res.render("about");
});

app.get("/game", function(req, res) {
    res.render("game");
});

app.get("*", function(req, res) {
    res.status(404).send("Page not found!!!");
})

app.listen((process.env.PORT | 3000), function() {
    console.log("FlashCard server started at port 3000!");
});
