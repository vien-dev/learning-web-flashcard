function queryWord(wordInConcern) {
    fetch('/ajax?' + new URLSearchParams({
        word: wordInConcern
    }))
    .then(response => response.json())
    .then(data => showFlashCard(data))
}

function showFlashCard(flashCard) {
    if (!jQuery.isEmptyObject(flashCard)) {
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

        $(".flashcard-current.flashcard-back p:first-child").text(`Meaning: ${flashCard.definition}`);
        $(".flashcard-current.flashcard-back p:first-child+p").text(`Example: ${flashCard.example}`);

        $(".current-word-container.view-only").removeClass("d-none");
        $(".flashcard-current.flashcard-front").removeClass("d-none");
        $(".flashcard-current.flashcard-back").addClass("d-none");

        $(".search > input").val("");
        $(".search").removeClass("medium-bottom-margin");
        $(".search").addClass("normal-bottom-margin");
    } else {
        $(".customized-navbar").removeClass("normal-bottom-margin");
        $(".customized-navbar").addClass("large-bottom-margin");

        $(".current-word-container.view-only").addClass("d-none");

        $(".search").removeClass("normal-bottom-margin");
        $(".search").addClass("medium-bottom-margin");
    }
}
$(".flashcard-current.flashcard-front").click(function() {
    this.classList.toggle("d-none");
    $(".flashcard-current.flashcard-back").toggleClass("d-none");
});

$(".flashcard-current.flashcard-back").click(function() {
    this.classList.toggle("d-none");
    $(".flashcard-current.flashcard-front").toggleClass("d-none");
});

$(".search input").keypress(function(e) {
    if (e.key === "Enter") {
        let searchedWord = $(".search > input").val();

        queryWord(searchedWord);
    }
})

$(".search button").click(function() {
    let searchedWord = $(".search > input").val();

    queryWord(searchedWord);
});

$(".carousel-item .flashcard").each(function() {
    this.addEventListener("click", function() {
        let clickedWord = $(this).find(".flashcard-word").text();

        queryWord(clickedWord);
    })
});