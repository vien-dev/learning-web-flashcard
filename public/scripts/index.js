let currentFlashCard = {};
let isEditing = false;

function queryWord(filter) {
    fetch('/ajax/flash-card?' + new URLSearchParams(filter))
    .then(response => response.json())
    .then(data => showFlashCardUI(data))
}

function showFlashCardUI(flashCard) {
    if (!jQuery.isEmptyObject(flashCard)) {
        currentFlashCard = flashCard;
        $(".customized-navbar").removeClass("large-bottom-margin");
        $(".customized-navbar").addClass("normal-bottom-margin");

        if (flashCard.wordType != '') {
            $(".flashcard-current.flashcard-front .card-text").html(`<span class="flashcard-word">${flashCard.word}</span> (<span class="flashcard-word-type">${flashCard.wordType}</span>)`);
        } else {
            $(".flashcard-current.flashcard-front .card-text").html(`<span class="flashcard-word">${flashCard.word}</span>`);
        }
        let extraInfoHtlmString = flashCard.extraInfo.reduce(function(finalString, info, idx, arr) {
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

        $(".flashcard-current.flashcard-back p:first-child").text(`Definition: ${flashCard.definition}`);
        $(".flashcard-current.flashcard-back p:first-child+p").text(`Example: ${flashCard.example}`);

        $(".current-word-container.view-only").removeClass("d-none");
        $(".flashcard-current.flashcard-front").removeClass("d-none");
        $(".flashcard-current.flashcard-back").addClass("d-none");

        $(".search > input").val("");
        $(".search").removeClass("medium-bottom-margin");
        $(".search").addClass("normal-bottom-margin");
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

function enterEditMode(flashCard) {
    isEditing = true;

    $(".current-word-container.view-only").addClass("d-none");
    $(".current-word-container.edit").removeClass("d-none");

    resetEditModeUI();

    if (!jQuery.isEmptyObject(flashCard)) {
        $("#inputWordInEdit").val(flashCard.word);
        $("#inputCategoryInEdit").val(flashCard.category);
        $("#inputWordTypeInEdit").val(flashCard.wordType);
        flashCard.extraInfo.forEach(function(extraInfo) {
            editModeAddExtraInfo(extraInfo);
        });
        $("#inputDefinitionInEdit").val(flashCard.definition);
        $("#inputExampleInEdit").val(flashCard.example);
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
    console.log(extraInfoInEdit);
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
            word: jQuery.isEmptyObject(currentFlashCard)?'':currentFlashCard.word,
            wordType: jQuery.isEmptyObject(currentFlashCard)?'':currentFlashCard.wordType
        }
    }
    const flashCardInEdit = {
        filter: filterInUse,
        flashCard: {
            word: wordInEdit,
            category: categoryInEdit,
            wordType: wordTypeInEdit,
            extraInfo: extraInfoInEdit,
            definition: definitionInEdit,
            example: exampleInEdit
        }
    }

    fetch("/ajax/flash-card", {
        method: methodInUse,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(flashCardInEdit),
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
        console.log(clickedWordType);
        const filter = {
            word: clickedWord,
            wordType: clickedWordType
        }
        console.log(filter);

        if (checkAndLeaveEditMode()) {
            queryWord(filter);
        }
    })
});