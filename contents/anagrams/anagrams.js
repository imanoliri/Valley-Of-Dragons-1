// List of words
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
const words = Object.keys(wordCounts);
let currentWord = "";
let anagramWord = "";



// Function to shuffle letters to create an anagram
function shuffle(word) {
    return word.split('').sort(() => 0.5 - Math.random()).join('');
}

// Function to select a new word and create an anagram
function selectNewWord() {
    currentWord = words[Math.floor(Math.random() * words.length)];
    anagramWord = shuffle(currentWord);
    document.getElementById('anagram').textContent = anagramWord;
    document.getElementById('guess').value = "";
    document.getElementById('guess').className = "";
}

// Function to check if the user's guess is correct
function checkGuess() {
    const guess = document.getElementById('guess').value;
    if (cleanWord(guess) === cleanWord(currentWord)) {
        document.getElementById('guess').className = "correct";
    } else {
        document.getElementById('guess').className = "wrong";
    }
}

function cleanWord(word) {
    return charsToIgnore.reduce((cleanedWord, sep) => {
        return cleanedWord.replace(new RegExp(`\\${sep}`, 'g'), '');
    }, word).toLowerCase();
}

// Event listeners
document.getElementById('guess').addEventListener('input', checkGuess);
document.getElementById('next').addEventListener('click', selectNewWord);

// Initialize the first word
selectNewWord();
