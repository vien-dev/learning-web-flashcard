let currentFlashCard = {};
let isEditing = false;

function queryWord(wordInConcern) {
    fetch('/ajax?' + new URLSearchParams({
        word: wordInConcern
    }))
    .then(response => response.json())
    .then(data => showFlashCard(data))
}

function showFlashCard(flashCard) {
    if (!jQuery.isEmptyObject(flashCard)) {
        currentFlashCard = flashCard;
        $(".customized-navbar").removeClass("large-bottom-margin");
        $(".customized-navbar").addClass("normal-bottom-margin");

        if (flashCard.wordType != '') {
            $(".flashcard-current.flashcard-front .flashcard-word").text(`${flashCard.word} (${flashCard.wordType})`);
        } else {
            $(".flashcard-current.flashcard-front .flashcard-word").text(`${flashCard.word}`);
        }
        let extraInfoHtlmString = flashCard.extraInfo.reduce(function(finalString, info, idx, arr) {
            console.log(`final string: ${finalString}`);
            if (0 === idx) {
                finalString += '<p class="flashcard flashcard-current flashcard-front flashcard-extra-info">Extra info: ';
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
            $(".flashcard-current.flashcard-front .flashcard-word").after(extraInfoHtlmString);
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

function exitEditMode() {
    isEditing = false;

    $("#inputWordInEdit").val("");
    $("#inputCategoryInEdit").val("");
    $("#inputWordTypeInEdit").val("");
    $(".extra-info").remove();
    $("#inputDefinitionInEdit").val("");
    $("#inputExampleInEdit").val("");

    showStartScreen();
}

function enterEditMode(flashCard) {
    isEditing = true;
    $(".current-word-container.view-only").addClass("d-none");
    $(".current-word-container.edit").removeClass("d-none");

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

$(".flashcard-current.flashcard-front").click(function(e) {
    this.classList.toggle("d-none");
    $(".flashcard-current.flashcard-back").toggleClass("d-none");
});

$(".flashcard-current.flashcard-back").click(function(e) {
    console.log(e);
    this.classList.toggle("d-none");
    $(".flashcard-current.flashcard-front").toggleClass("d-none");
});

$(".search input").keypress(function(e) {
    if (e.key === "Enter") {
        let searchedWord = $(".search > input").val();

        if (checkAndLeaveEditMode()) {
            queryWord(searchedWord);
        }
    }
})

$(".search button").click(function() {
    let searchedWord = $(".search > input").val();

    if (checkAndLeaveEditMode()) {
        queryWord(searchedWord);
    }
});

$(".carousel-item .flashcard").each(function() {
    this.addEventListener("click", function() {
        let clickedWord = $(this).find(".flashcard-word").text();

        if (checkAndLeaveEditMode()) {
            queryWord(clickedWord);
        }
    })
});