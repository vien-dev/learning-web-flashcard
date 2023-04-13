const mongoose = require("mongoose");

const flashCardSchema = mongoose.Schema({
    word: {
        type: String,
        required: true
    },
    category: String,
    wordType: {
        type: String,
        required: true
    },
    extraInfo: [String],
    definition: {
        type: String,
        required: true
    },
    example: {
        type: String,
        required: true
    },
    lastRead: {
        type: Date,
        default: Date.now()
    }
});

let uri = "mongodb://127.0.0.1:27017/flashcardDBDev";
if ('DB_URI' in process.env) {
    uri = process.env.DB_URI;
}

//create / read / update / delete flashcard (one at a time)

function convertCollectionNameToMongooseModelName(collectionName) {
    //Since naming convention for mongoDB collection Nam is camelCase
    //First capitalize the first letter.
    //Then, remove the last 's' character from the string
    return collectionName[0].toUpperCase() + collectionName.slice(1,-1); 
}

//create
// input: flashcard
// output: on ok: return _id
//         on failure: throw error
async function addFlashCard(collectionName, flashcard) {
    // check if word exists in collection
    // if exists, don't add return nok
    // if doesn't exist, add and return result
    await mongoose.connect(uri);

    let modelName = convertCollectionNameToMongooseModelName(collectionName);

    const Flashcard = mongoose.model(modelName, flashCardSchema);

    let result = await Flashcard.countDocuments({
        word: flashcard.word,
        wordType: flashcard.wordType
    });

    if (result != 0) {
        throw new Error(
            `The flashcard with word ${flashcard.word} and word type ${flashcard.wordType} already exists in DB`);
    }

    try {
        const newFlashCard = new Flashcard({
            word: flashcard.word,
            category: flashcard.category,
            wordType: flashcard.wordType,
            extraInfo: flashcard.extraInfo,
            definition: flashcard.definition,
            example: flashcard.example
        });
        await newFlashCard.save();

        return current_count; //return _id of newly added flashcard.
    } catch (err) {
        throw new Error(`Facing error ${err} when adding new flashcard to ${collectionName}`);
    }
}

//read
//read by word
// input: flashcard word, flashcard wordType
// output: (Obj) flashcard(s)
async function findFlashcards(collectionName, wordInConcern, wordTypeInConcern = null, returnArray = false) {
    let filter = { word: wordInConcern };
    if ( wordTypeInConcern != null ) {
        filter.wordType = wordTypeInConcern;
    }

    try {
        let connection = await mongoose.connect(uri);

        let modelName = convertCollectionNameToMongooseModelName(collectionName);

        const Flashcard = mongoose.model(modelName, flashCardSchema);
        const flashcards = await Flashcard.find(filter).limit(returnArray?0:1).select(["-_id", "-lastRead"]);

        if (null === flashcards || 0 === flashcards.length) {
            throw new Error("No match in DB");
        }

        return flashcards;
    } catch (err) {
        if (wordTypeInConcern != null ) {
            throw new Error(`Couldn't find flashcard with word: ${wordInConcern} and word type: ${wordTypeInConcern} due to error ${err}`);
        } else {
            throw new Error(`Couldn't find flashcard with word: ${wordInConcern} due to error ${err}`);
        }
    }
}

//read by category

//update
//input word
// update flashcard
// update lastRead
async function updateFlashCard(collectionName, flashcardInConcern) {
    try {
        await mongoose.connect(uri);

        let modelName = convertCollectionNameToMongooseModelName(collectionName);

        const Flashcard = mongoose.model(modelName, flashCardSchema);

        let result = await Flashcard.findOneAndUpdate({
            word: flashcardInConcern.word,
            wordType: flashcardInConcern.wordType
        }, {
            word: flashcardInConcern.word,
            category: flashcardInConcern.category,
            wordType: flashcardInConcern.wordType,
            extraInfo: flashcardInConcern.extraInfo,
            definition: flashcardInConcern.definition,
            example: flashcardInConcern.example,
            lastRead: Date.now()
        });

        if (null === result) {
            throw new Error("Cannot update flashcard to DB");
        }
    } catch (err) {
        throw new Error(`${err}`);
    }
}

async function updateFlashCardLastRead(collectionName, flashcardInConcern) {
    try {
        await mongoose.connect(uri);

        let modelName = convertCollectionNameToMongooseModelName(collectionName);

        const Flashcard = mongoose.model(modelName, flashCardSchema);

        let result = await Flashcard.findOneAndUpdate({
            word: flashcardInConcern.word,
            wordType: flashcardInConcern.wordType
        }, {
            lastRead: Date.now()
        });

        if (null === result) {
            throw new Error("Cannot update flashcard's lastRead to DB");
        }
    } catch (err) {
        throw new Error(`${err}`);
    }
}

//delete
//input word
async function deleteFlashCard(collectionName, flashcardInConcern) {
    try {
        await mongoose.connect(uri);

        let modelName = convertCollectionNameToMongooseModelName(collectionName);

        const Flashcard = mongoose.model(modelName, flashCardSchema);

        let result = await Flashcard.findOneAndDelete({
            word: flashcardInConcern.word,
            wordType: flashcardInConcern.wordType
        });

        if (null === result) {
            throw new Error("No flashcard available in DB to delete.");
        }
    } catch (err) {
        throw new Error(`${err}`);
    }
}

exports.addFlashCard = addFlashCard;
exports.findFlashcards = findFlashcards;
exports.updateFlashCard = updateFlashCard;
exports.updateFlashCardLastRead = updateFlashCardLastRead;
exports.deleteFlashCard = deleteFlashCard;
