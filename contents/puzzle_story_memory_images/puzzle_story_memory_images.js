// Define the list of image sources
const imageDir = "../.."
const imageSources = [
    "images/image26.jpg",
    "images/image23.jpg",
    "images/image15.jpg",
    "images/image17.jpg",
    "images/image12.jpg",
    "images/image3.jpg",
    "images/image21.jpg",
    "images/image8.jpg",
    "images/image33.png",
    "images/image35.png",
    "images/image20.jpg",
    "images/image11.jpg",
    "images/image5.jpg",
    "images/image34.jpg",
    "images/image30.png",
    "images/image32.jpg",
    "images/image1.png",
    "images/image24.png",
    "images/image25.jpg",
    "images/image22.jpg",
    "images/image28.jpg",
    "images/image18.jpg",
    "images/image6.jpg",
    "images/image29.jpg",
    "images/image10.jpg",
    "images/image9.jpg",
    "images/image19.jpg",
    "images/image13.png",
    "images/image7.png",
    "images/image31.png",
    "images/image16.png",
    "images/image36.png",
    "images/image27.png",
    "images/image14.png",
    "images/image2.jpg",
    "images/image4.jpg"
];
numImagesSelect = 8



document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    const resetButton = document.getElementById('reset-button');

    // Array of image paths
    const symbols = shuffleSelectArray([...imageSources]);

    let cards = [];
    let flippedCards = [];
    let matchedPairs = 0;

    // Initialize the game
    function initializeGame() {
        gameContainer.innerHTML = '';
        cards = createCardDeck();
        shuffleArray(cards);

        cards.forEach(imagePath => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.symbol = `${imageDir}/${imagePath}`;

            const img = document.createElement('img');
            img.src = `${imageDir}/${imagePath}`;
            card.appendChild(img);

            card.addEventListener('click', handleCardClick);
            gameContainer.appendChild(card);
        });

        matchedPairs = 0;
        flippedCards = [];
    }

    // Handle card click event
    function handleCardClick(event) {
        const card = event.target.closest('.card');

        if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
        if (flippedCards.length === 2) return;

        card.classList.add('flipped');
        flippedCards.push(card);

        if (flippedCards.length === 2) {
            checkForMatch();
        }
    }

    // Check if the flipped cards match
    function checkForMatch() {
        const [card1, card2] = flippedCards;

        if (card1.dataset.symbol === card2.dataset.symbol) {
            card1.classList.add('matched');
            card2.classList.add('matched');
            matchedPairs++;

            if (matchedPairs === symbols.length) {
                setTimeout(() => alert('You matched all pairs!'), 300);
            }
        } else {
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
            }, 1000);
        }

        flippedCards = [];
    }

    // Create a deck of cards (duplicate image paths for pairs)
    function createCardDeck() {
        return [...symbols, ...symbols];
    }

    // Function to select and shuffle a number of elements from the array
    function shuffleSelectArray(images) {
        shuffleArray(images);
        return images.slice(0, numImagesSelect);
    }


    // Shuffle the array of cards
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Reset the game
    resetButton.addEventListener('click', initializeGame);

    // Start the game on load
    initializeGame();
});
