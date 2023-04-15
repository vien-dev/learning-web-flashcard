let currentFlashCard = {};
let isEditing = false;

function queryWord(filter) {
    fetch('/ajax/flashcard?' + new URLSearchParams(filter))
    .then(response => response.json())
    .then(function(queriedFlashCardData) {
        showFlashCardUI(queriedFlashCardData)
    })
}

function queryDynamicContentFromOpenAI() {
    const filter = {
        word: currentFlashCard.word,
        wordType: currentFlashCard.wordType
    };

    fetch('/ajax/dynamic-content-from-openai?' + new URLSearchParams(filter))
    .then(response => response.json())
    .then(queriedOpenAIDynamicContent => updateFlashCardDynamicContentFromOpenAI(queriedOpenAIDynamicContent))
}

function updateFlashCardDynamicContentFromOpenAI(dynamicContentFromOpenAI) {
    if (dynamicContentFromOpenAI.flashcardImage != "") {
        $(".flashcard-image").attr("src", dynamicContentFromOpenAI.flashcardImage);
    }
}

function showFlashCardUI(flashcard) {
    if (!jQuery.isEmptyObject(flashcard)) {
        currentFlashCard = flashcard;
        $(".customized-navbar").removeClass("large-bottom-margin");
        $(".customized-navbar").addClass("normal-bottom-margin");

        if (flashcard.wordType != '') {
            $(".flashcard-current.flashcard-front .card-text").html(`<span class="flashcard-word">${flashcard.word}</span> (<span class="flashcard-word-type">${flashcard.wordType}</span>)`);
        } else {
            $(".flashcard-current.flashcard-front .card-text").html(`<span class="flashcard-word">${flashcard.word}</span>`);
        }
        let extraInfoHtlmString = flashcard.extraInfo.reduce(function(finalString, info, idx, arr) {
            if (0 === idx) {
                finalString += '<p class="flashcard flashcard-extra-info">Extra info: ';
            } else {
                finalString += '<br/>';
            }

            finalString += `${info}`;

            if (arr.len === idx+1) {
                finalString += '</p>';
            }

            return finalString;
        }, '');
        $(".flashcard-current.flashcard-front .flashcard-extra-info").remove();
        if (extraInfoHtlmString != '') {
            $(".flashcard-current.flashcard-front .card-text").after(extraInfoHtlmString);
        }

        $(".flashcard-image").attr("src", "/images/flashcard_placeholder.png");
        $(".flashcard-current.flashcard-back p:first-child").text(`Definition: ${flashcard.definition}`);
        $(".flashcard-current.flashcard-back p:first-child+p").text(`Example: ${flashcard.example}`);

        $(".current-word-container.view-only").removeClass("d-none");
        $(".flashcard-current.flashcard-front").removeClass("d-none");
        $(".flashcard-current.flashcard-back").addClass("d-none");

        $(".search > input").val("");
        $(".search").removeClass("medium-bottom-margin");
        $(".search").addClass("normal-bottom-margin");

        queryDynamicContentFromOpenAI();
    } else {
        currentFlashCard = {};
        enterEditMode(currentFlashCard);
    }
}

function showStartScreen() {
    $(".customized-navbar").removeClass("normal-bottom-margin");
    $(".customized-navbar").addClass("large-bottom-margin");

    $(".current-word-container.view-only").addClass("d-none");
    $(".current-word-container.edit").addClass("d-none");

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

function enterEditMode(flashcard) {
    isEditing = true;

    $(".current-word-container.view-only").addClass("d-none");
    $(".current-word-container.edit").removeClass("d-none");

    resetEditModeUI();

    if (!jQuery.isEmptyObject(flashcard)) {
        $("#inputWordInEdit").val(flashcard.word);
        $("#inputCategoryInEdit").val(flashcard.category);
        $("#inputWordTypeInEdit").val(flashcard.wordType);
        flashcard.extraInfo.forEach(function(extraInfo) {
            editModeAddExtraInfo(extraInfo);
        });
        $("#inputDefinitionInEdit").val(flashcard.definition);
        $("#inputExampleInEdit").val(flashcard.example);

        $("#btnRemoveWord").removeClass("d-none");
    } else {
        $("#btnRemoveWord").addClass("d-none");
    }
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

$("#btnAddExtraInfo").click(function() {editModeAddExtraInfo("")});

$("#btnEditWord").click(function() {
    enterEditMode(currentFlashCard);
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
    if (!jQuery.isEmptyObject(currentFlashCard)) {
        methodInUse="PUT";
        filterInUse={
            word: currentFlashCard.word,
            wordType: currentFlashCard.wordType
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
    if (!jQuery.isEmptyObject(currentFlashCard)) {
        const wordInConcern = currentFlashCard.word;
        const wordTypeInConcern = currentFlashCard.wordType;
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

$(".flashcard-current.flashcard-front").click(function(e) {
    this.classList.toggle("d-none");
    $(".flashcard-current.flashcard-back").toggleClass("d-none");
});

$(".flashcard-current.flashcard-back").click(function(e) {
    this.classList.toggle("d-none");
    $(".flashcard-current.flashcard-front").toggleClass("d-none");
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