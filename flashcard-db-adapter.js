const mongoose = require("mongoose");

const flashCardSchema = mongoose.Schema({
    word: {
        type: String,
        required: true
    },
    wordType: String,
    category: String,
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

const flashcardSetMetaData = mongoose.Schema({
    flashcardSetName: {
        type: String,
        required: true
    },
    categoryList: [String],
    wordTypeList: [String]
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

class Flashcard {
    constructor(word, wordType, category, extraInfo, definition, example, lastRead) {
        this.dbFlashcard = {
            word : word,
            wordType : wordType,
            category : category,
            extraInfo : extraInfo,
            definition : definition,
            example : example,
            lastRead : lastRead
        };
        this.flashcard = {
            word: word,
            wordType: wordType,
            category: category,
            extraInfo: extraInfo,
            definition: definition,
            example: example,
            lastRead: lastRead
        }
    }
};
class FlashcardFilter {
    constructor({word = null, 
            wordType = null, 
            category = null, 
            extraInfo = null, 
            definition = null, 
            example = null,
            lastRead = null,
            //no limit, returns all match
            limit = 0, 
            //if true and there're more than 1 match, a random btw matches will be returned.
            //The adapter should ensure that if limit > 1 and withoutOrder is true
            //the duplicated documents should be returned when picking randomly.
            withoutOrder = false} = {}
            ) {
        this.dbFilter = {};
        if (word != null) {
            this.dbFilter.word = word;
        }
        if (wordType != null) {
            this.dbFilter.wordType = wordType;
        }
        if (category != null) {
            this.dbFilter.category = category;
        }
        if (extraInfo != null) {
            this.dbFilter.extraInfo = extraInfo;
        }
        if (definition != null) {
            this.dbFilter.definition = definition;
        }
        if (example != null) {
            this.dbFilter.example = example;
        }
        if (lastRead != null) {
            this.dbFilter.lastRead = lastRead;
        }
        this.limit = limit;
    }
};

//create
// input: flashcard of type Flashcard
// output: on ok: return nothing
//         on failure: throw error
async function addFlashcard(collectionName, flashcard) {
    // check if word exists in collection
    // if exists, don't add return nok
    // if doesn't exist, add and return result
    await mongoose.connect(uri);

    let modelName = convertCollectionNameToMongooseModelName(collectionName);

    const dbFlashcard = mongoose.model(modelName, flashCardSchema);

    let result = await dbFlashcard.countDocuments({
        word: flashcard.dbFlashcard.word,
        wordType: flashcard.dbFlashcard.wordType
    });

    if (result != 0) {
        throw new Error(
            `The flashcard with word ${flashcard.word} and word type ${flashcard.wordType} already exists in DB`);
    }

    try {
        const newDbFlashcard = new dbFlashcard(flashcard.dbFlashcard);
        await newDbFlashcard.save();
    } catch (err) {
        throw new Error(`Facing error ${err} when adding new flashcard to ${collectionName}`);
    }
}

//read
//read by word
// input: flashcard word, flashcard wordType
// output: (Obj) flashcard(s)
async function getFlashcards(collectionName, flashcardFilter = new FlashcardFilter()) {
    try {
        await mongoose.connect(uri);

        let modelName = convertCollectionNameToMongooseModelName(collectionName);

        const dbFlashcard = mongoose.model(modelName, flashCardSchema);

        const dbFlashcards = await dbFlashcard.find(flashcardFilter.dbFilter)
                                            .limit(flashcardFilter.limit)
                                            .select(["-_id"]);

        if (0 === dbFlashcards.length) {
            throw new Error("No match in DB");
        }
        const flashcards = dbFlashcards.map(function(dbFlashcard) {
            return new Flashcard(
                word = dbFlashcard.word,
                wordType = dbFlashcard.wordType,
                category = dbFlashcard.category,
                extraInfo = dbFlashcard.extraInfo,
                definition = dbFlashcard.definition,
                example = dbFlashcard.example,
                lastRead = dbFlashcard.lastRead
            ).flashcard;
        });

        return flashcards;
    } catch (err) {
        throw new Error(`Couldn't find flashcard with filter ${JSON.stringify(flashcardFilter.dbFilter)} due error: ${err}`);
    }
}

//get random flashcards
/* TODO: implement later
async function getRandomFlashcards(collectionName, limit = 9) {
    try {
        let connection = await mongoose.connect(uri);

        let modelName = convertCollectionNameToMongooseModelName(collectionName);

        const dbFlashcard = mongoose.model(modelName, flashCardSchema);
        const flashcards = await dbFlashcard.find({}).limit(limit).select(["-_id", "-lastRead"]);

        if (0 === flashcards.length) {
            throw new Error("No match in DB");
        }

        return flashcards;
    } catch (err) {
        throw new Error(`Couldn't get flashcard(s) from DB due to error ${err}`);
    }
}
*/

//read by category

//update
//input word
// update flashcard
// update lastRead
async function updateFlashcard(collectionName, flashcardFilter, updatedFlashcard) {
    try {
        await mongoose.connect(uri);

        let modelName = convertCollectionNameToMongooseModelName(collectionName);

        const dbFlashcard = mongoose.model(modelName, flashCardSchema);

        let result = await dbFlashcard.findOneAndUpdate(flashcardFilter.dbFilter, 
                                                    updatedFlashcard.dbFlashcard);

        if (null === result) {
            throw new Error("Cannot update flashcard to DB");
        }
    } catch (err) {
        throw new Error(`${err}`);
    }
}


//delete
//input word
async function deleteFlashcard(collectionName, flashcardFilter) {
    try {
        await mongoose.connect(uri);

        let modelName = convertCollectionNameToMongooseModelName(collectionName);

        const dbFlashcard = mongoose.model(modelName, flashCardSchema);

        let result = await dbFlashcard.findOneAndDelete(flashcardFilter.dbFilter);

        if (null === result) {
            throw new Error("No flashcard available in DB to delete.");
        }
    } catch (err) {
        throw new Error(`${err}`);
    }
}

async function addCategory(collectionName, category) {
    try {
        await mongoose.connect(uri);

        let modelName = convertCollectionNameToMongooseModelName(collectionName);

        modelName += 'FlashcardSetMetaData';

        const dbFlashcardSetMetaData = mongoose.model(modelName, flashcardSetMetaData);

        let result = await dbFlashcardSetMetaData
                            .find({flashcardSetName: collectionName})
                            .select(["categoryList"]);

        if (null === result) {
            throw new Error(`${collectionName} doesn't have meta data yet.`);
        }
        if (!result.includes(category)) {
            result.push(category);
        }
    } catch (err) {
        throw new Error(`${err}`);
    }
}

async function getCategories(collectionName) {
    try {
        await mongoose.connect(uri);

        let modelName = convertCollectionNameToMongooseModelName(collectionName);

        modelName += 'FlashcardSetMetaData';

        const dbFlashcardSetMetaData = mongoose.model(modelName, flashcardSetMetaData);

        let result = await dbFlashcardSetMetaData
                            .find({flashcardSetName: collectionName})
                            .select(["categoryList"]);

        if (null === result) {
            throw new Error(`${collectionName} doesn't have meta data yet.`);
        }
        
        return result;
    } catch (err) {
        throw new Error(`${err}`);
    }
}

exports.Flashcard = Flashcard;
exports.FlashcardFilter = FlashcardFilter;
exports.addFlashcard = addFlashcard;
exports.getFlashcards = getFlashcards;
exports.updateFlashcard = updateFlashcard;
exports.deleteFlashcard = deleteFlashcard;
exports.addCategory = addCategory;
exports.getCategories = getCategories;
//exports.getRandomFlashcards = getRandomFlashcards;
