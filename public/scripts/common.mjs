export async function queryFlashcardSetMetaData() {
    let queriedFlashcardMetaData = await fetch('/ajax/flashcard-meta-data')
    .then(response => response.json());

    return queriedFlashcardMetaData;
}

export function displayFlashcard(flashcard) {
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
    hljs.highlightAll();
    
    $(".flashcard-current .flashcard-front").removeClass("d-none");
    $(".flashcard-current .flashcard-back").addClass("d-none");
}

let openAIFetchAbortController = null;
export async function queryDynamicContentFromOpenAI(flashcard) {
    if (null === openAIFetchAbortController) {
        openAIFetchAbortController = new AbortController();
    } else {
        if (false === openAIFetchAbortController.signal.aborted) {
            openAIFetchAbortController.abort();

            openAIFetchAbortController = new AbortController();
        }
    }

    const filter = {
        word: flashcard.word,
        wordType: flashcard.wordType
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

$(".flashcard-current .flashcard-front").click(function(e) {
    this.classList.toggle("d-none");
    $(".flashcard-current .flashcard-back").toggleClass("d-none");
});

$(".flashcard-current .flashcard-back").click(function(e) {
    this.classList.toggle("d-none");
    $(".flashcard-current .flashcard-front").toggleClass("d-none");
});