const express = require("express");
const bodyParser = require("body-parser");
const flashcardDBAdapter = require(__dirname + "/flashcard-db-adapter.js");
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express();

app.set("view engine", 'ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

const swedishFlashCardCollectionName = "swedishFlashcards";
let port = 3000;
if ('PORT' in process.env) {
  port = process.env.PORT;
}

app.get("/", async function(req, res) {
    try {
      let topPickFlashCards = await flashcardDBAdapter.getFlashcards(swedishFlashCardCollectionName);
      res.render("home", {
          homeEJSTopPickFlashCards: topPickFlashCards
      });
    } catch(err) {
      console.log(err);
      res.status(500).send("You know. I'm not in a good mood to serve you.")
    }
})

app.get("/ajax/flashcard", async function(req, res) {
  try {
    let filter = {};
    filter.word = req.query.word;
    if (req.query.hasOwnProperty('wordType')) {
      filter.wordType = req.body.wordType
    }
    filter.limit = 1;
    const flashcardFilter = new flashcardDBAdapter.FlashcardFilter(filter);
    const flashcards = await flashcardDBAdapter.getFlashcards(swedishFlashCardCollectionName, 
                                                              flashcardFilter);
    let foundedWord = flashcards[0];
    res.json(foundedWord);
  } catch(err) {
    console.log(err);
    res.json({});
  };
});

app.post("/ajax/flashcard", bodyParser.json({type: 'application/json'}), async function(req, res) {
  console.log(req.body);
  const receivedFlashcard = req.body.flashcard;
  const flashCardInEdit = new flashcardDBAdapter.Flashcard(
    word =  receivedFlashcard.word,
    wordType = receivedFlashcard.wordType,
    category = receivedFlashcard.category,
    extraInfo = receivedFlashcard.extraInfo,
    definition = receivedFlashcard.definition,
    example = receivedFlashcard.example,
    lastRead = Date.now()
  );

  try {
    await flashcardDBAdapter.addFlashCard(swedishFlashCardCollectionName, flashCardInEdit)
    res.json({status: "ok"});
  } catch(err) {
    console.log(err);
    res.status(500).json({status: "nok", error: err});
  }
});

app.put("/ajax/flashcard", bodyParser.json({type: 'application/json'}), async function(req, res) {
  const flashCardInEdit = req.body;

  try {
    const flashcardFilter = new flashcardDBAdapter.FlashcardFilter({word : flashCardInEdit.filter.word,
                                                            wordType : flashCardInEdit.filter.wordType});
    const updatedFlashcard = new flashcardDBAdapter.Flashcard(
      word = flashCardInEdit.flashCard.word,
      wordType = flashCardInEdit.flashCard.wordType,
      category = flashCardInEdit.flashCard.category,
      extraInfo = flashCardInEdit.flashCard.extraInfo,
      definition = flashCardInEdit.flashCard.definition,
      example = flashCardInEdit.flashCard.example,
      lastRead = Date.now()
    );
    await flashcardDBAdapter.updateFlashcard(swedishFlashCardCollectionName, flashcardFilter, updatedFlashcard);
    res.json({status: "ok"});
  } catch(err) {
    console.log(err);
    res.status(500).json({status: "nok", error: err});
  }
});

app.delete("/ajax/flashcard", bodyParser.json({type: 'application/json'}), async function(req, res) {
  const filter = req.body;

  try {
    const flashcardFilter = new flashcardDBAdapter.FlashcardFilter({
      word : filter.word,
      wordType : filter.wordType
    });
    await flashcardDBAdapter.deleteFlashCard(swedishFlashCardCollectionName, flashcardFilter);

    res.json({status: "ok"});
  } catch(err) {
    console.log(err);
    res.status(500).json({status: "nok", error: err});
  }
});

app.get("/ajax/dynamic-content-from-openai", async function(req, res) {
  let wordInConcern = req.query.word;
  let wordTypeInConcern = req.query.wordType;

  let responseJSON = {
    flashCardImage: ""
  }

  try {
    const filter = new flashcardDBAdapter.FlashcardFilter({
                                              word: wordInConcern, 
                                              wordType: wordTypeInConcern,
                                              limit: 1});
    const result = await flashcardDBAdapter.getFlashcards(swedishFlashCardCollectionName, filter);
    
    let foundedCard = result[0];

    let prompts = [
      `Skapa en bild för begreppet "${foundedCard.word}".`,
      `Skapa en bild för begreppet "${foundedCard.definition}".`,
      foundedCard.example
    ];

    for (current_prompt of prompts) {
      try {
        let openAIResponse = await openai.createImage({
          prompt: current_prompt,
          size: "256x256"
        }, {
          timeout: 3000 //ms
        });
        responseJSON.flashCardImage = openAIResponse.data.data[0].url;
        res.json(responseJSON);
        break;
      } catch(error) {
        console.log(`Failed to generate image for promt ${current_prompt}`);
        if (error.response) {
          console.log(error.response.status);
          console.log(error.response.data);
        } else {
          console.log(error.message);
        }
      }
    }  
  } catch(err) {
    console.log(`Cannot generate image because of error ${err}`);
    res.json(responseJSON);
  };

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

app.listen(port, function() {
    console.log("FlashCard server started at port 3000!");
});
