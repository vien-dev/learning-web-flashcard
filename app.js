const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.set("view engine", 'ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

let topPickFlashCards = [
    { word:'hej',
      category: '',
      definition: 'A way to say hi',
      example: 'Hej! hur mår du?'},
    { word: 'hej då',
      category: '',
      definition: 'Goodbye!',
      example: 'hej då! vi ses i morgon!'},
    { word: 'titta',
      category: '',
      definition: 'Look!',
      example: 'Titta! Bakom dig! (look! behind you!'},
    { word: 'sitta',
      category: '',
      definition: 'Sit!',
      example: 'Sitta här! (sit down here!'},
    { word:'äpple',
      category: '',
      definition: 'Apple',
      example: 'Titta! ett äpple!'}];

app.get("/", function(req, res) {
    res.render("home", {
        homeEJSTopPickFlashCards: topPickFlashCards.map(flashCard => flashCard.word)
    });
})

app.get("/ajax", function(req, res) {
  let wordInConcern = req.query.word;

  let foundedWord = topPickFlashCards.find(function(flashCard) {
    return flashCard.word === wordInConcern;
  });

  if (foundedWord != null) {
    res.json(foundedWord);
  } else {
    res.status(404).json('word not found'); //not found
  }
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
