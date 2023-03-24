const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.set("view engine", 'ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

let topPickFlashCards = [
    { word:'hej',
      defintion: 'A way to say hi',
      example: 'Hej! hur mår du?'},
    { word: 'hej då',
      defintion: 'Goodbye!',
      example: 'hej då! vi ses i morgon!'},
    { word: 'titta',
      defintion: 'Look!',
      example: 'Titta! Bakom dig! (look! behind you!'},
    { word: 'sitta',
      defintion: 'Sit!',
      example: 'Sitta här! (sit down here!'},
    { word:'äpple',
      defintion: 'Apple',
      example: 'Titta! ett äpple!'}];

app.get("/", function(req, res) {
    res.render("home", {
        homeEJSTopPickFlashCards: topPickFlashCards.map(flashCard => flashCard.word)
    });
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
