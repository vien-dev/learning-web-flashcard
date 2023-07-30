export async function queryFlashcardSetMetaData() {
    let queriedFlashcardMetaData = await fetch('/ajax/flashcard-meta-data')
    .then(response => response.json());

    return queriedFlashcardMetaData;
}