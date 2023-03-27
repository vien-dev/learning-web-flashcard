const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.set("view engine", 'ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

let topPickFlashCards = [
    { word:'hej',
      category: '',
      wordType: '',
      extraInfo: [],
      definition: 'A way to say hi',
      example: 'Hej! hur mår du?'},
    { word: 'hej då',
      category: '',
      wordType: '',
      extraInfo: [],
      definition: 'Goodbye!',
      example: 'hej då! vi ses i morgon!'},
    { word:'nej',
      category: '',
      wordType: '',
      extraInfo: [],
      definition: 'A way to say no',
      example: 'Nej! Jag vill inte äta dem.'},
    { word: 'titta',
      category: '',
      wordType: 'verb',
      extraInfo: ['tittade, tittat, titta, tittar'],
      definition: 'Look!',
      example: 'Titta! Bakom dig! (look! behind you!)'},
    { word: 'sitta',
      category: '',
      wordType: 'verb',
      extraInfo: ['satt, suttit, sitt, sitta, sitter'],
      definition: 'Sit!',
      example: 'Sitta här! (sit down here!)'},
    { word:'äpple',
      category: '',
      wordType: 'noun',
      extraInfo: ['ett', 'äpplet, äpplen, äpplena'],
      definition: 'Apple',
      example: 'Titta! ett äpple!'}];

app.get("/", function(req, res) {
    res.render("home", {
        homeEJSTopPickFlashCards: topPickFlashCards
    });
})

app.get("/ajax/flashcard", function(req, res) {
  let wordInConcern = req.query.word;

  let foundedWord = topPickFlashCards.find(function(flashCard) {
    return flashCard.word === wordInConcern;
  });

  if (foundedWord != null) {
    res.json(foundedWord);
  } else {
    res.json({}); //not found
  }
});

app.post("/ajax/flashcard", bodyParser.json({type: 'application/json'}), function(req, res) {
  const flashCardInEdit = req.body;

  topPickFlashCards.push(flashCardInEdit.flashCard);

  res.json({status: "ok"});
  //res.json({status: "nok", error: "simply nok"});
});

app.put("/ajax/flashcard", bodyParser.json({type: 'application/json'}), function(req, res) {
  const flashCardInEdit = req.body;

  const foundIdx = topPickFlashCards.findIndex(function(flashCard) {
    return (flashCard.word === flashCardInEdit.filter.word &&
        flashCard.wordType === flashCardInEdit.filter.wordType);
  });

  if (foundIdx != -1) {
    topPickFlashCards[foundIdx] = flashCardInEdit.flashCard;
  }

  res.json({status: "ok"});
  //res.json({status: "nok", error: "simply nok"});
});

app.delete("/ajax/flashcard", bodyParser.json({type: 'application/json'}), function(req, res) {
  const filter = req.body;

  const foundIdx = topPickFlashCards.findIndex(function(flashCard) {
    return (flashCard.word === filter.word && flashCard.wordType === filter.wordType);
  });

  if (foundIdx != -1) {
    topPickFlashCards.splice(foundIdx, 1);
    res.json({status: "ok"});
  } else {
    res.json({status: "nok", error: `no flashcard matches for the filter: {word: ${filter.word}, wordType: ${filter.wordType}}`});
  }
});

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
