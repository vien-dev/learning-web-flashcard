import {queryFlashcardSetMetaData} from './common.mjs'

let currentFlashcard = {};
let isEditing = false;

function queryWord(filter) {
    fetch('/ajax/flashcard?' + new URLSearchParams(filter))
    .then(response => response.json())
    .then(function(queriedFlashcardData) {
        showFlashcardUI(queriedFlashcardData)
    })
}

let openAIFetchAbortController = null;
async function queryDynamicContentFromOpenAI() {
    if (null === openAIFetchAbortController) {
        openAIFetchAbortController = new AbortController();
    } else {
        if (false === openAIFetchAbortController.signal.aborted) {
            openAIFetchAbortController.abort();

            openAIFetchAbortController = new AbortController();
        }
    }

    const filter = {
        word: currentFlashcard.word,
        wordType: currentFlashcard.wordType
    };

    let queriedOpenAIDynamicContent = {};
    queriedOpenAIDynamicContent = await fetch('/ajax/dynamic-content-from-openai?' 
                                                + new URLSearchParams(filter),
                                            {signal : openAIFetchAbortController.signal})
                                            .then(response => response.json())
                                            .catch(function(err) {
                                                console.log(err);
                                            });
    
    if (!jQuery.isEmptyObject(queriedOpenAIDynamicContent)) {
        updateFlashcardDynamicContentFromOpenAI(queriedOpenAIDynamicContent);
    }
}

function updateFlashcardDynamicContentFromOpenAI(dynamicContentFromOpenAI) {
    if (dynamicContentFromOpenAI.flashcardImage != "") {
        $(".flashcard-image").attr("src", dynamicContentFromOpenAI.flashcardImage);
    }
}

function showFlashcardUI(flashcard) {
    if (!jQuery.isEmptyObject(flashcard)) {
        currentFlashcard = flashcard;
        $(".customized-navbar").removeClass("large-bottom-margin");
        $(".customized-navbar").addClass("normal-bottom-margin");

        if (flashcard.wordType != '') {
            $(".flashcard-current .flashcard-word").html(`${flashcard.word} <span class="flashcard-word-type">(${flashcard.wordType})</span>`);
        } else {
            $(".flashcard-current .flashcard-word").text(flashcard.word);
        }
        let extraInfoHtlmString = flashcard.extraInfo.reduce(function(finalString, info, idx, arr) {
            if (0 === idx) {
                finalString += '<p class="flashcard-extra-info">';
            } else {
                finalString += '<br/>';
            }

            finalString += `${info}`;

            if (arr.len === idx+1) {
                finalString += '</p>';
            }

            return finalString;
        }, '');
        $(".flashcard-current .flashcard-extra-info").remove();
        if (extraInfoHtlmString != '') {
            $(".flashcard-current .flashcard-word").after(extraInfoHtlmString);
        }

        $(".flashcard-current .flashcard-image").attr("src", "/images/flashcard_placeholder.png");

        let converter = new showdown.Converter({simpleLineBreaks: true});

        let definitionHTML = converter.makeHtml(flashcard.definition);
        $(".flashcard-current .flashcard-word-definition").html(`${definitionHTML}`);

        
        let exampleHTML = converter.makeHtml(flashcard.example);
        $(".flashcard-current .flashcard-word-example").html(`${exampleHTML}`);

        $("#view-section").removeClass("d-none");
        $(".flashcard-current .flashcard-front").removeClass("d-none");
        $(".flashcard-current .flashcard-back").addClass("d-none");

        $(".search > input").val("");
        $(".search").removeClass("medium-bottom-margin");
        $(".search").addClass("normal-bottom-margin");

        queryDynamicContentFromOpenAI();
    } else {
        currentFlashcard = {};
        enterEditMode(currentFlashcard);
    }
}

function showStartScreen() {
    $(".customized-navbar").removeClass("normal-bottom-margin");
    $(".customized-navbar").addClass("large-bottom-margin");

    $("#view-section").addClass("d-none");
    $("#edit-section").addClass("d-none");

    $(".search").removeClass("normal-bottom-margin");
    $(".search").addClass("medium-bottom-margin");
}

function checkAndLeaveEditMode() {
    const warningString = `You are navigating away from editing mode.
    All unsubmitted work will be lost.
    Are you sure?`;
    let retVal = true;

    if (isEditing) {
        retVal = confirm(warningString);

        if (retVal) {
            exitEditMode();
        }
    }

    return retVal;
}

function resetEditModeUI() {
    $("#inputWordInEdit").val("");
    $("#inputCategoryInEdit").val("");
    $("#inputWordTypeInEdit").val("");
    $(".extra-info").remove();
    $("#inputDefinitionInEdit").val("");
    $("#inputExampleInEdit").val("");
}

function exitEditMode() {
    isEditing = false;

    resetEditModeUI();

    showStartScreen();
}

async function enterEditMode(flashcard) {
    isEditing = true;

    $("#view-section").addClass("d-none");
    $("#edit-section").removeClass("d-none");

    resetEditModeUI();

    if (!jQuery.isEmptyObject(flashcard)) {
        $("#inputWordInEdit").val(flashcard.word);
        $("#inputCategoryInEdit").val(flashcard.category);
        $("#inputWordTypeInEdit").val(flashcard.wordType);
        flashcard.extraInfo.forEach(function(extraInfo) {
            editModeAddExtraInfo(extraInfo);
        });
        console.log(flashcard.definition);
        $("#inputDefinitionInEdit").val(flashcard.definition);
        $("#inputExampleInEdit").val(flashcard.example);

        $("#btnRemoveWord").removeClass("d-none");
    } else {
        $("#btnRemoveWord").addClass("d-none");
    }

    let queriedFlashcardMetaData = await queryFlashcardSetMetaData();
    editModeUpdateFlashcardMetaData(queriedFlashcardMetaData);
}

function editModeAddExtraInfo(extraInfo) {
    let template = document.createElement('template');
    let inputTextString = "";
    if (extraInfo != "") {
        inputTextString = `<input type="text" class="col-8 text-start" value="${extraInfo}">`
    } else {
        inputTextString = `<input type="text" class="col-8 text-start" placeholder="Extra info for the word...">`;
    }

    let extraInfoHtmlString = `
        <div class="row extra-info">
            <div class="col-4 text-end">
                <button class="btn btn-outline-secondary bg-white rounded-circle" type="button">
                    <i class="bi bi-dash"></i>
                </button>
            </div>
            ${inputTextString}
        </div>`.trim();
    
    template.innerHTML = extraInfoHtmlString;
    let newlyCreatedExtraInfo = template.content.firstChild;

    newlyCreatedExtraInfo.querySelector("button").addEventListener('click', function(e) {
        let divExtraInfo = e.target.closest(".extra-info");
        divExtraInfo.remove();
    });

    if ($(".extra-info").length == 0) {
        $(".extra-info-header").after(newlyCreatedExtraInfo);
    } else if ($(".extra-info").length != 0 && $(".extra-info").length < 3) {
        $(".extra-info").last().after($(newlyCreatedExtraInfo));
    } else {
        alert("We don't support more than 3 extra info field!");
    }
}

function editModeUpdateFlashcardMetaData(flashcardMetaData) {
    $("#flashcard-categories").html("");
    flashcardMetaData.categories.forEach(function(category) {
        $("#flashcard-categories").append(`<option value="${category}">`);
    });

    $("#flashcard-word-types").html("");
    flashcardMetaData.wordTypes.forEach(function(wordType) {
        $("#flashcard-word-types").append(`<option value="${wordType}">`);
    });
}

$("#btnAddExtraInfo").click(function() {editModeAddExtraInfo("")});

$("#btnEditWord").click(function() {
    enterEditMode(currentFlashcard);
});

$("#btnSubmitEditWord").click(function() {
    const wordInEdit = $("#inputWordInEdit").val();
    const categoryInEdit = $("#inputCategoryInEdit").val();
    const wordTypeInEdit = $("#inputWordTypeInEdit").val();
    const extraInfoInEdit = $(".extra-info input").map(function() {return this.value;}).get();
    const definitionInEdit = $("#inputDefinitionInEdit").val();
    const exampleInEdit = $("#inputExampleInEdit").val();

    if ('' === wordInEdit) {
        alert("The word cannot be empty");
        return;
    }
    if ('' === definitionInEdit) {
        alert("The word's definition cannot be empty");
        return;
    }
    if ('' === exampleInEdit) {
        alert("The word's example cannot be empty");
        return;
    }

    let methodInUse="POST";
    let filterInUse={};
    if (!jQuery.isEmptyObject(currentFlashcard)) {
        methodInUse="PUT";
        filterInUse={
            word: currentFlashcard.word,
            wordType: currentFlashcard.wordType
        }
    }
    const flashcardInEdit = {
        filter: filterInUse,
        flashcard: {
            word: wordInEdit,
            category: categoryInEdit,
            wordType: wordTypeInEdit,
            extraInfo: extraInfoInEdit,
            definition: definitionInEdit,
            example: exampleInEdit
        }
    }

    fetch("/ajax/flashcard", {
        method: methodInUse,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(flashcardInEdit),
    })
    .then(response => response.json())
    .then(function(data) {
        if (data.status === "nok") {
            alert(`Cannot submit changes to server due to error: ${data.error}`);
        } else if (data.status === "ok") {
            const filter = {
                word: wordInEdit,
                wordType: wordTypeInEdit
            }
            exitEditMode();
            queryWord(filter);
        } else {
            console.log(`unknown status string ${data.status} from server`);
        }
    });
});

$("#btnRemoveWord").click(function() {
    //if current flashcard? -> remove card with filter word + wordType
    //use delete method
    //if server response is ok exit edit mode.
    //else. Stay
    if (!jQuery.isEmptyObject(currentFlashcard)) {
        const wordInConcern = currentFlashcard.word;
        const wordTypeInConcern = currentFlashcard.wordType;
        const methodInUse = "DELETE";
        const filter = {
            word: wordInConcern,
            wordType: wordTypeInConcern
        }

        fetch("/ajax/flashcard", {
            method: methodInUse,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(filter),
        })
        .then(response => response.json())
        .then(function(data) {
            if (data.status === "nok") {
                alert(`Cannot delete flash card due to error: ${data.error}`);
            } else if (data.status === "ok") {
                alert(`Flashcard is now deleted!`);
                exitEditMode();
            } else {
                console.log(`unknown status string ${data.status} from server`);
            }
        });
    }
})

$(".flashcard-current .flashcard-front").click(function(e) {
    this.classList.toggle("d-none");
    $(".flashcard-current .flashcard-back").toggleClass("d-none");
});

$(".flashcard-current .flashcard-back").click(function(e) {
    this.classList.toggle("d-none");
    $(".flashcard-current .flashcard-front").toggleClass("d-none");
});

$(".search input").keypress(function(e) {
    if (e.key === "Enter") {
        const searchedWord = $(".search > input").val();
        const filter = {
            word: searchedWord
        }

        if (checkAndLeaveEditMode()) {
            queryWord(filter);
        }
    }
})

$(".search button").click(function() {
    let searchedWord = $(".search > input").val();
    const filter = {
        word: searchedWord
    }

    if (checkAndLeaveEditMode()) {
        queryWord(filter);
    }
});

$(".carousel-item .flashcard").each(function() {
    this.addEventListener("click", function() {
        let clickedWord = $(this).find(".flashcard-word").text();
        let clickedWordType = $(this).find(".flashcard-word-type").text();
        const filter = {
            word: clickedWord,
            wordType: clickedWordType
        }

        if (checkAndLeaveEditMode()) {
            queryWord(filter);
        }
    })
});