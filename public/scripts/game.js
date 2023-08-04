import {displayFlashcard, queryFlashcardSetMetaData} from './common.mjs'

let currentPlayingFlashcards = [];
let currentPlayingFlashcardIdx = 0;
let currentPlayingCharacters = [];
let currentFillingCharacterIdx = 0;
const maxHintPerWord = 3;
let currentHintUsedForTheWord = 0;

async function loadGameSelectionView() {
    let queriedFlashcardMetaData = await queryFlashcardSetMetaData();

    $("#flashcard-categories").html("");
    $("#flashcard-categories").append(`<option value="All">`);
    queriedFlashcardMetaData.categories.forEach(function(category) {
        $("#flashcard-categories").append(`<option value="${category}">`);
    });
}

async function getFlashcards(filter) {
    let queriedFlashcardsData = await fetch('/ajax/flashcards?' + new URLSearchParams(filter))
    .then(response => response.json());

    return queriedFlashcardsData;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }

    return array;
}

function showNextWord() {
    let flashcard = currentPlayingFlashcards[currentPlayingFlashcardIdx];
    $("#in-game-progress").text(`Progress ${currentPlayingFlashcardIdx + 1}/${currentPlayingFlashcards.length}`);

    let sentences = flashcard.definition.split("\n");
    let definition = sentences.reduce((accumulator, currentValue) => accumulator + "<br>" + currentValue, "")
    $("#word-description").html(`${definition}`);

    let word = flashcard.word;
    let words = word.split(' ');
    let characters = [];
    let idx = 0;
    $("#word-to-fill").html("");
    words.forEach(function(w, i) {
        let chars = w.split("");
        chars.forEach(function(c) {
            let toBeFilledBtnHTML = `<button id="to-be-filled-btn--${idx}" class="btn btn-light border-dark game-btn to-be-filled-btn final-answer" type="button"> </button>`;
            idx++;
            $("#word-to-fill").append(toBeFilledBtnHTML);
        })
        if (i !== (words.length - 1)) {
            $("#word-to-fill").append(`<button class="btn btn-link border-0 final-answer" type="button" disabled> </button>`);
        } else {
            $("#word-to-fill").append(`<button id="remove-answer" class="btn btn-danger rounded-circle game-btn" type="button"><i class="bi bi-x"></i></button>`);
            $("#remove-answer").click(function() {
                $(".to-be-filled-btn").text(" ");
                currentFillingCharacterIdx = 0;
                loadUnorderedCharacters();
            })
        }
          
        characters = characters.concat(chars);
    });
    currentFillingCharacterIdx = 0;
    currentHintUsedForTheWord = 0;
    $("#btn-in-game-hint > span").text(`Hint(${maxHintPerWord - currentHintUsedForTheWord} left)`);

    currentPlayingCharacters = shuffleArray(characters);

    loadUnorderedCharacters();

    $("#in-game-main").removeClass("d-none");
    $("#in-game-flashcard").addClass("d-none");
}

function loadUnorderedCharacters() {
    $("#given-characters").html("");
    currentPlayingCharacters.forEach(function(c, i) {
        let unorderedCharacterBtnHTML = `<button id="btn-unordered-char--${i}" class="btn btn-info game-btn unordered-char-btn" type="button">${c}</button>`;

        $("#given-characters").append(unorderedCharacterBtnHTML);
    })
    $(".unordered-char-btn").click(function(e) {
        $(`#to-be-filled-btn--${currentFillingCharacterIdx}`).removeClass("hinted");

        let c = e.target.innerText;
        $(`#to-be-filled-btn--${currentFillingCharacterIdx}`).text(c);
        currentFillingCharacterIdx++;
        e.target.remove();

        if (currentFillingCharacterIdx === currentPlayingCharacters.length) {
            checkAnswer();
        }
    });
}

function checkAnswer() {
    let word = currentPlayingFlashcards[currentPlayingFlashcardIdx].word;
    if (word === $(".final-answer").text()) {
        showFlashcardInGame(currentPlayingFlashcards[currentPlayingFlashcardIdx]);
    } else {
        $(".to-be-filled-btn").text(" ");
        currentFillingCharacterIdx = 0;
        loadUnorderedCharacters();
    }
}

function showInfo(msg) {
    $("#info > p").text(msg);

    $("#game-selection-view").addClass("d-none");
    $("#in-game-view").addClass("d-none");
    $("#info").removeClass("d-none");

    $(".customized-navbar").addClass("large-bottom-margin");
    $(".customized-navbar").removeClass("normal-bottom-margin");
}

function showGameView() {
    $("#game-selection-view").addClass("d-none");
    $("#in-game-view").removeClass("d-none");
    $("#info").addClass("d-none");

    $(".customized-navbar").removeClass("large-bottom-margin");
    $(".customized-navbar").addClass("normal-bottom-margin");
}

function showGameSelectionView() {
    $("#game-selection-view").removeClass("d-none");
    $("#in-game-view").addClass("d-none");
    $("#info").addClass("d-none");

    $(".customized-navbar").addClass("large-bottom-margin");
    $(".customized-navbar").removeClass("normal-bottom-margin");
}

function showFlashcardInGame(flashcard) {
    displayFlashcard(flashcard);

    $("#in-game-main").addClass("d-none")
    $("#in-game-flashcard").removeClass("d-none");
}

function continueGame() {
    currentPlayingFlashcardIdx++;

    if (currentPlayingFlashcardIdx === currentPlayingFlashcards.length) {
        showInfo("Congratulations! You have finished all the word(s).");
    } else {
        showNextWord();
    }
}

async function startGame() {
    let filter = {}
    filter.category = $("#inputCategoryForGame").val();
    if (filter.category === "") {
        filter.category = "All";
    }

    filter.amount = $("#inputFlashcardAmountForGame").val();
    if (filter.amount === "") {
        filter.amount = "All";
    }
    if (filter.amount === "All") {
        filter.amount = 0;
    } else {
        filter.amount = parseInt(filter.amount, 10);
    }

    currentPlayingFlashcards = await getFlashcards(filter);

    if (currentPlayingFlashcards.length !== 0) {
        currentPlayingFlashcardIdx = 0;
        showGameView();

        showNextWord();
    } else {
        showInfo("Cannot find any flashcard with the specified criteria(s).");
    }
}

$("#btn-start-game").click(async function() {
    await startGame();
})

$("#info > button").click(function() {
    loadGameSelectionView();
    showGameSelectionView();
})

$("#btn-in-game-hint").click(function() {
    if (currentHintUsedForTheWord < maxHintPerWord) {
        let word = currentPlayingFlashcards[currentPlayingFlashcardIdx].word;
        word = word.replace(/\s/g,'');
        let characters = word.split('');
        $(`#to-be-filled-btn--${currentFillingCharacterIdx}`).text(characters[currentFillingCharacterIdx]);
        $(`#to-be-filled-btn--${currentFillingCharacterIdx}`).addClass("hinted");

        currentHintUsedForTheWord++;
        $("#btn-in-game-hint > span").text(`Hint(${maxHintPerWord - currentHintUsedForTheWord} left)`);
    } else {
        alert("You have no hint left!");
    }
});

$("#btn-in-game-next").click(function() {
    continueGame();
})

$(document).on("keydown", async function(e) {
    let found = false;
    if ($("#game-selection-view").hasClass("d-none") !== true) {
        await startGame();
    } else if ($("#in-game-main").hasClass("d-none") !== true) {
        if($(".unordered-char-btn").length !== 0 ) {
            let theCharacterElement = $(".unordered-char-btn").filter(function() {
                return $(this).text() === e.key;
            }).first();

            if (theCharacterElement.length !== 0) {
                $(`#to-be-filled-btn--${currentFillingCharacterIdx}`).removeClass("hinted");

                let c = theCharacterElement.text();
                $(`#to-be-filled-btn--${currentFillingCharacterIdx}`).text(c);
                currentFillingCharacterIdx++;

                theCharacterElement.remove();

                if (currentFillingCharacterIdx === currentPlayingCharacters.length) {
                    checkAnswer();
                }
            }
        }
    } else if ($("#in-game-flashcard").hasClass("d-none") !== true) {
        if (e.key === "Enter") {
            continueGame();
        }
    }
})

loadGameSelectionView();
