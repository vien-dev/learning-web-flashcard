function queryWord(wordInConcern) {
    fetch('/ajax?' + new URLSearchParams({
        word: wordInConcern
    }))
    .then(response => response.json())
    .then(data => showFlashCard(data))
}

function showFlashCard(flashCard) {
    $(".flashcard-current.flashcard-front .flashcard-word").text(flashCard.word);
    $(".flashcard-current.flashcard-back p:first-child").text(`Meaning: ${flashCard.definition}`);
    $(".flashcard-current.flashcard-back p:last-child").text(`Example: ${flashCard.example}`);

    $(".flashcard-current.flashcard-front").removeClass("d-none");
    $(".flashcard-current.flashcard-back").addClass("d-none");

    $(".search > input").val("");
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