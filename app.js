const express = require("express");
const bodyParser = require("body-parser");
const flashcardDBAdapter = require(__dirname + "/flashcard-db-adapter.js");

const app = express();

app.set("view engine", 'ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

const swedishFlashcardCollectionName = "swedishFlashcards";
let port = 3000;
if ('PORT' in process.env) {
  port = process.env.PORT;
}

app.get("/", async function(req, res) {
    try {
      let topPickFlashcards = await flashcardDBAdapter.getFlashcards(swedishFlashcardCollectionName);
      res.render("home", {
          homeEJSTopPickFlashcards: topPickFlashcards
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
    const flashcards = await flashcardDBAdapter.getFlashcards(swedishFlashcardCollectionName, 
                                                              flashcardFilter);
    let foundedWord = flashcards[0];
    res.json(foundedWord);
  } catch(err) {
    console.log(err);
    res.json({});
  };
});

app.post("/ajax/flashcard", bodyParser.json({type: 'application/json'}), async function(req, res) {
  const receivedFlashcard = req.body.flashcard;
  const flashcardInEdit = new flashcardDBAdapter.Flashcard(
    word =  receivedFlashcard.word,
    wordType = receivedFlashcard.wordType,
    category = receivedFlashcard.category,
    extraInfo = receivedFlashcard.extraInfo,
    definition = receivedFlashcard.definition,
    example = receivedFlashcard.example,
    lastRead = Date.now()
  );

  try {
    await flashcardDBAdapter.addFlashcard(swedishFlashcardCollectionName, flashcardInEdit)
    await flashcardDBAdapter.addCategory(swedishFlashcardCollectionName, receivedFlashcard.category);
    await flashcardDBAdapter.addWordType(swedishFlashcardCollectionName, receivedFlashcard.wordType);
    res.json({status: "ok"});
  } catch(err) {
    console.log(err);
    res.status(500).json({status: "nok", error: err});
  }
});

app.put("/ajax/flashcard", bodyParser.json({type: 'application/json'}), async function(req, res) {
  const flashcardInEdit = req.body;

  try {
    const flashcardFilter = new flashcardDBAdapter.FlashcardFilter({word : flashcardInEdit.filter.word,
                                                            wordType : flashcardInEdit.filter.wordType});
    const updatedFlashcard = new flashcardDBAdapter.Flashcard(
      word = flashcardInEdit.flashcard.word,
      wordType = flashcardInEdit.flashcard.wordType,
      category = flashcardInEdit.flashcard.category,
      extraInfo = flashcardInEdit.flashcard.extraInfo,
      definition = flashcardInEdit.flashcard.definition,
      example = flashcardInEdit.flashcard.example,
      lastRead = Date.now()
    );

    let oldFlashcards = await flashcardDBAdapter.getFlashcards(swedishFlashcardCollectionName, flashcardFilter);
    let oldFlashcard = oldFlashcards[0];

    await flashcardDBAdapter.updateFlashcard(swedishFlashcardCollectionName, flashcardFilter, updatedFlashcard);

    if (flashcardInEdit.flashcard.category) {
        await flashcardDBAdapter.addCategory(swedishFlashcardCollectionName, flashcardInEdit.flashcard.category);
    }
    if (flashcardInEdit.flashcard.wordType) {
        await flashcardDBAdapter.addWordType(swedishFlashcardCollectionName, flashcardInEdit.flashcard.wordType);
    }
    
    try {
        let categoryFilter = new flashcardDBAdapter.FlashcardFilter({category: oldFlashcard.category});
        await flashcardDBAdapter.getFlashcards(swedishFlashcardCollectionName, categoryFilter);
    } catch(err) {
        //no flashcards found for category, remove the category from meta data collection
        await flashcardDBAdapter.deleteCategory(swedishFlashcardCollectionName, oldFlashcard.category);
    }
    try {
        let wordTypeFilter = new flashcardDBAdapter.FlashcardFilter({wordType: oldFlashcard.wordType});
        await flashcardDBAdapter.getFlashcards(swedishFlashcardCollectionName, wordTypeFilter);
    } catch(err) {
        //no flashcards found for word type, remove the word type from meta data collection
        await flashcardDBAdapter.deleteWordType(swedishFlashcardCollectionName, oldFlashcard.wordType);
    }
    res.json({status: "ok"});
  } catch(err) {
    console.log(err);
    res.status(500).json({status: "nok", error: JSON.stringify(err)});
  }
});

app.delete("/ajax/flashcard", bodyParser.json({type: 'application/json'}), async function(req, res) {
  const filter = req.body;

  try {
    const flashcardFilter = new flashcardDBAdapter.FlashcardFilter({
      word : filter.word,
      wordType : filter.wordType
    });
    await flashcardDBAdapter.deleteFlashcard(swedishFlashcardCollectionName, flashcardFilter);

    res.json({status: "ok"});
  } catch(err) {
    console.log(err);
    res.status(500).json({status: "nok", error: err});
  }
});

app.get("/ajax/flashcard-meta-data", async function(req, res) {
    try {
      const categories = await flashcardDBAdapter.getCategories(swedishFlashcardCollectionName);
      const wordTypes = await flashcardDBAdapter.getWordTypes(swedishFlashcardCollectionName);
      res.json({categories: categories,
                wordTypes: wordTypes
                });
    } catch(err) {
      console.log(err);
      res.json({categories: [],
                wordTypes: []
                });
    };
});

app.get("/ajax/dynamic-content-from-openai", async function(req, res) {
  let wordInConcern = req.query.word;
  let wordTypeInConcern = req.query.wordType;

  let responseJSON = {
    flashcardImage: ""
  }

  try {
    const filter = new flashcardDBAdapter.FlashcardFilter({
                                              word: wordInConcern, 
                                              wordType: wordTypeInConcern,
                                              limit: 1});
    const result = await flashcardDBAdapter.getFlashcards(swedishFlashcardCollectionName, filter);
    
    let foundedCard = result[0];

    let prompts = [
      foundedCard.example,
      foundedCard.definition,
      `Skapa en bild för begreppet "${foundedCard.word}".`
    ];

    for (current_prompt of prompts) {
      try {
        let openAIResponse = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            prompt: current_prompt,
            n: 1,
            size: "256x256",
            response_format: "url"
          })
        })
        .then(result => result.json());
        
        responseJSON.flashcardImage = openAIResponse.data[0].url;
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
    console.log(`Flashcard server started at port ${port}!`);
});
