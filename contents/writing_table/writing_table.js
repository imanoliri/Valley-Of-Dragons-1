const wordCounts = {
    "dragon": 74,
    "knight": 68,
    "dark": 57,
    "valley": 53,
    "rider": 45,
    "god": 39,
    "battle": 23,
    "human": 18,
    "forest": 18,
    "day": 16,
    "magic": 14,
    "army": 14,
    "elves": 13,
    "three": 13,
    "river": 13,
    "friend": 13,
    "felt": 13,
    "fierce": 12,
    "life": 12,
    "chapter": 11,
    "time": 11,
    "grew": 11,
    "cities": 10,
    "home": 10,
    "new": 10,
    "young": 10,
    "other": 9,
    "mountain": 9,
    "filled": 9,
    "power": 9,
    "shared": 8,
    "training": 8,
    "finally": 8,
    "knew": 8,
    "attack": 7,
    "take": 7,
    "first": 7,
    "arrived": 7,
    "knowledge": 7,
    "long": 7,
    "made": 7,
    "sky": 7,
    "become": 7,
    "ranks": 7,
    "peace": 6,
    "ancient": 6,
    "simple": 6,
    "deep": 6,
    "came": 6,
    "ready": 6,
    "sense": 6,
    "undead": 6,
    "word": 5,
    "part": 5,
    "lived": 5,
    "different": 5,
    "tree": 5,
    "world": 5,
    "form": 5,
    "face": 5
};

const charsToIgnore = [" ", ",", "-", "—", ";", ".", "'", "`", "´"];

function getWordsForGrid(words, numberOfColumns) {
    return words.filter(word => word.length <= numberOfColumns - 2);
}

function cleanWord(word) {
    return charsToIgnore.reduce((cleanedWord, sep) => {
        return cleanedWord.replace(new RegExp(`\\${sep}`, 'g'), '');
    }, word).toLowerCase();
}


let speakLettersWhenDropped = true;
let speakWhenCorrectSolution = true;
document.getElementById("checkSpeakLettersWhenDropped").checked = speakLettersWhenDropped;
document.getElementById("checkSpeakWordsWhenCorrect").checked = speakWhenCorrectSolution;

function refreshChecboxes() {
    speakLettersWhenDropped = document.getElementById("checkSpeakLettersWhenDropped").checked;
    speakWhenCorrectSolution = document.getElementById("checkSpeakWordsWhenCorrect").checked;
}


numberOfColumns = 7
const words = getWordsForGrid(Object.keys(wordCounts).map(cleanWord), numberOfColumns);
document.documentElement.style.setProperty('--number-of-columns', numberOfColumns);


function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    if (ev.target.classList.contains("delete-cell")) {
        ev.dataTransfer.setData("text", ""); // Transfer an empty string for deletion
    } else {
        ev.dataTransfer.setData("text", ev.target.innerHTML);
    }
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    if (speakLettersWhenDropped) {
        speak(data)
    }

    if (data === "") {
        ev.target.innerHTML = ""; // Clear the content
    } else if (ev.target.innerHTML === "") {
        ev.target.innerHTML = data; // Place content if the target is empty
    }

    // Find the input box in the same row and call checkMatch
    let currentElement = ev.target;
    while (currentElement && !currentElement.classList.contains("word-input")) {
        currentElement = currentElement.nextElementSibling;
    }
    if (currentElement && currentElement.classList.contains("word-input")) {
        checkMatch(currentElement); // Call checkMatch on the found input box
    }
}


let selectedLetter = null; // Variable to store the selected letter element

function handleClickLetter(ev) {
    // Check if a letter is already selected
    if (selectedLetter) {
        selectedLetter.classList.remove("selected"); // Remove selection highlight
    }

    // Set the clicked letter as the selected letter
    selectedLetter = ev.target;
    selectedLetter.classList.add("selected"); // Highlight the selected letter
}

function handleClickCell(ev) {
    if (selectedLetter && ev.target.innerHTML === "") { // Only proceed if a letter is selected and the cell is empty
        ev.target.innerHTML = selectedLetter.innerHTML; // Place the selected letter in the cell
        selectedLetter.classList.remove("selected"); // Remove selection highlight
        selectedLetter = null; // Reset the selected letter

        // Find the input box in the same row and call checkMatch
        let currentElement = ev.target;
        while (currentElement && !currentElement.classList.contains("word-input")) {
            currentElement = currentElement.nextElementSibling;
        }
        if (currentElement && currentElement.classList.contains("word-input")) {
            checkMatch(currentElement); // Call checkMatch on the found input box
        }
    }
}

// Function to clear the content of a cell on double-click
function handleDoubleClick(ev) {
    ev.target.innerHTML = ""; // Clear content on double-click

    // Find the input box in the same row and call checkMatch
    let currentElement = ev.target;
    while (currentElement && !currentElement.classList.contains("word-input")) {
        currentElement = currentElement.nextElementSibling;
    }
    if (currentElement && currentElement.classList.contains("word-input")) {
        checkMatch(currentElement); // Call checkMatch on the found input box
    }
}

// Function to check for matches and convert to uppercase
function checkMatch(input) {
    input.value = input.value.toUpperCase(); // Convert input to uppercase

    // Get the consonant letter, which is the first sibling in the same row
    const rowLetter = input.previousElementSibling.textContent;

    // Get all the cells in the same row by traversing backwards from the input
    let currentElement = input.previousElementSibling;
    const rowCells = [];

    // Traverse backwards until we reach the consonant letter at the start of the row
    while (currentElement && !currentElement.classList.contains("letter")) {
        if (!currentElement.classList.contains("delete-cell")) {
            rowCells.unshift(currentElement.textContent); // Collect cell content
        }
        currentElement = currentElement.previousElementSibling;
    }

    // Construct the word from the row cells
    const constructedWord = rowCells.join("");

    // Check if the constructed word matches the input value
    if (constructedWord === input.value) {
        input.style.backgroundColor = "lightgreen"; // Light up the input if it matches
    } else {
        input.style.backgroundColor = ""; // Remove background color if it doesn't match
    }
}

// Function to fill text boxes with random words from the words array
function fillTextBoxes() {
    // Get all word-input elements
    const textInputs = document.querySelectorAll(".word-input");
    const numberOfWords = Math.min(words.length, textInputs.length);
    
    // Shuffle the words array and take the first numberOfWords items
    const shuffledWords = words.sort(() => 0.5 - Math.random()).slice(0, numberOfWords);

    // Fill the text boxes with the selected words
    shuffledWords.forEach((word, index) => {
        textInputs[index].value = word;
    });
}


// Function to clear the content of a cell on double-click
function handleDoubleClick(ev) {
    ev.target.innerHTML = ""; // Clear content on double-click

    // Find the input box in the same row and call checkMatch
    let currentElement = ev.target;
    while (currentElement && !currentElement.classList.contains("word-input")) {
        currentElement = currentElement.nextElementSibling;
    }
    if (currentElement && currentElement.classList.contains("word-input")) {
        checkMatch(currentElement); // Call checkMatch on the found input box
    }
}

// Function to clear all droppable cells
function clearAllCells() {
    const droppableCells = document.querySelectorAll(".grid div:not(.letter):not(.delete-cell)");
    droppableCells.forEach(cell => {
        cell.innerHTML = ""; // Clear the content of each droppable cell
    });
}

// Function to check for matches and convert to uppercase
// Function to check for matches and convert to uppercase
function checkMatch(input) {
    input.value = input.value.toUpperCase(); // Convert input to uppercase

    // Get the consonant letter, which is the first sibling in the same row
    const rowLetter = input.previousElementSibling.textContent;

    // Get all the cells in the same row by traversing backwards from the input
    let currentElement = input.previousElementSibling;
    const rowCells = [];

    // Traverse backwards until we reach the consonant letter at the start of the row
    while (currentElement && !currentElement.classList.contains("letter")) {
        if (!currentElement.classList.contains("delete-cell")) {
            rowCells.unshift(currentElement.textContent); // Collect cell content
        }
        currentElement = currentElement.previousElementSibling;
    }

    // Construct the word from the row cells
    const constructedWord = rowCells.join("");

    // Check if the constructed word matches the input value
    if (constructedWord === input.value) {
        input.style.backgroundColor = "lightgreen"; // Light up the input if it matches
        if (speakWhenCorrectSolution) {
            speak(constructedWord)
        }

    } else {
        input.style.backgroundColor = ""; // Remove background color if it doesn't match
    }
}

// Function to fill text boxes with random words from the words array
function fillTextBoxes() {
    // Get all word-input elements
    const textInputs = document.querySelectorAll(".word-input");
    const numberOfWords = Math.min(words.length, textInputs.length);
    
    // Shuffle the words array and take the first numberOfWords items
    const shuffledWords = words.sort(() => 0.5 - Math.random()).slice(0, numberOfWords);

    // Fill the text boxes with the selected words
    shuffledWords.forEach((word, index) => {
        textInputs[index].value = word.toUpperCase();
    });
}
function speak(text, lang = 'english') {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
}



// Add event listeners for drag-and-drop interactions
window.onload = function() {

    // DRAG AND DROP
    const allCells = document.querySelectorAll(".grid div");
    allCells.forEach(cell => {
        cell.addEventListener("dragover", allowDrop);
        cell.addEventListener("drop", drop);
        cell.addEventListener("dblclick", handleDoubleClick);
    });

    // CLICK AND CLICK
    const letterElements = document.querySelectorAll(".letter");
    letterElements.forEach(letter => {
        letter.addEventListener("click", handleClickLetter); // Add click event to letters
    });

    const droppableCells = document.querySelectorAll(".grid div:not(.letter):not(.delete-cell)");
    droppableCells.forEach(cell => {
        cell.addEventListener("click", handleClickCell); // Add click event to droppable cells
        cell.addEventListener("dblclick", handleDoubleClick); // Double-click to clear
    });

    // Make the first cell (trash bin) draggable
    const emptyCell = document.querySelector(".delete-cell");
    emptyCell.setAttribute("draggable", "true");
    emptyCell.addEventListener("dragstart", drag);
    fillTextBoxes();
};


// Add event listeners for click interactions
window.onload = function() {
    const letterElements = document.querySelectorAll(".letter");
    letterElements.forEach(letter => {
        letter.addEventListener("click", handleClickLetter); // Add click event to letters
    });

    const droppableCells = document.querySelectorAll(".grid div:not(.letter):not(.delete-cell)");
    droppableCells.forEach(cell => {
        cell.addEventListener("click", handleClickCell); // Add click event to droppable cells
        cell.addEventListener("dblclick", handleDoubleClick); // Double-click to clear
    });

    fillTextBoxes();
};

