// Define the list of image sources
const imageDir = "../.."
const imageSources = [
    "images/image23.jpg",
    "images/image20.jpg",
    "images/image5.jpg",
    "images/image16.jpg",
    "images/image12.jpg",
    "images/image3.jpg",
    "images/image18.jpg",
    "images/image8.jpg",
    "images/image33.png",
    "images/image35.png",
    "images/image17.jpg",
    "images/image11.jpg",
    "images/image4.jpg",
    "images/image34.jpg",
    "images/image28.png",
    "images/image31.jpg",
    "images/image1.png",
    "images/image21.png",
    "images/image22.jpg",
    "images/image19.jpg",
    "images/image26.jpg",
    "images/image29.jpg",
    "images/image6.jpg",
    "images/image27.jpg",
    "images/image10.jpg",
    "images/image9.jpg",
    "images/image32.png",
    "images/image13.png",
    "images/image7.png",
    "images/image30.png",
    "images/image15.png",
    "images/image36.png",
    "images/image25.png",
    "images/image14.png",
    "images/image2.jpg",
    "images/image24.png"
];

const imagesWithIndices = imageSources.map((src, index) => ({ src, index }));

const numImagesSelect = 6; // Number of images to display
const containerSize = 1000; // Size of the circular container
const maxImageRadius = (containerSize * Math.sin(Math.PI / numImagesSelect)) / (1 + Math.sin(Math.PI / numImagesSelect)) / 2;
const imageSize = 2 * maxImageRadius * 0.9; // Adjust image size
const centerSize = (containerSize - 2 * imageSize) * 0.9;
const centerPosition = containerSize / 2;


// Set CSS variables
document.documentElement.style.setProperty('--container-size', `${containerSize}px`);
document.documentElement.style.setProperty('--image-size', `${imageSize}px`);
document.documentElement.style.setProperty('--highlight-size', `${imageSize * 3 / 100}px`);
document.documentElement.style.setProperty('--center-size', `${centerSize}px`);
document.documentElement.style.setProperty('--center-position', `${centerPosition}px`);

const circleContainer = document.getElementById('circle-container');
const popupSolved = document.getElementById('popup-solved');
const popupFailed = document.getElementById('popup-failed');

console.log(JSON.stringify(imageSources));

// Declare variables to share between callbacks
let selectedImages; // Original set of selected images
let imagesToSelect; // Images the user needs to select in order

// Function to create and position images in a circular pattern
function createAndPositionImages() {
    // Clear previous images
    const images = document.querySelectorAll('.circle-container .image');
    images.forEach(image => image.remove());

    // Initialize and shuffle the images
    selectedImages = shuffleSelectArray([...imagesWithIndices]); // Make a copy and shuffle
    imagesToSelect = [...selectedImages]; // Copy to keep track of user selection

    console.log(JSON.stringify(selectedImages));

    // Initialize the angle and radius for positioning
    const angleIncrement = (2 * Math.PI) / selectedImages.length;
    const radius = containerSize / 2 - imageSize / 2;

    selectedImages.forEach((imageObj, position) => {
        const img = document.createElement('img');
        img.src = `${imageDir}/${imageObj.src}`;
        img.alt = `Image ${position + 1}`;
        img.classList.add('image');

        // Calculate position for the image
        const angle = angleIncrement * position;
        const x = radius * Math.cos(angle) + radius;
        const y = radius * Math.sin(angle) + radius;
        img.style.left = `${x}px`;
        img.style.top = `${y}px`;

        // Add click event listener
        img.addEventListener('click', () => handleImageClick(img, imageObj));

        circleContainer.appendChild(img);
    });
}

function handleImageClick(img, imageObj) {
    let minRemainderIndex = getMinimumIndex(imagesToSelect);
    console.log(JSON.stringify(imagesToSelect));
    console.log("imageObj.index:", imageObj.index);
    console.log("minRemainderIndex:", minRemainderIndex);

    if (imageObj.index === minRemainderIndex) {
        img.classList.add('highlight');        
    } else {
        popupFailed.classList.add('active');
    }

    imagesToSelect = removeImageByIndex(imagesToSelect, imageObj.index);
    if (imagesToSelect.length === 0) {
        popupSolved.classList.add('active');
    }
}

// Function to select and shuffle a number of elements from the array
function shuffleSelectArray(images) {
    shuffleArray(images);
    return images.slice(0, numImagesSelect);
}

// Function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Function to get the minimum index from imagesToSelect
function getMinimumIndex(images) {
    return Math.min(...images.map(imageObj => imageObj.index));
}

// Function to remove an image by index from imagesToSelect
function removeImageByIndex(images, targetIndex) {
    const indexToRemove = findIndexInImageIndexList(images, targetIndex);
    images.splice(indexToRemove, 1);
    return images;
}

// Function to find the index of an image in the array
function findIndexInImageIndexList(pairsArray, targetIndex) {
    for (let i = 0; i < pairsArray.length; i++) {
        if (pairsArray[i].index === targetIndex) {
            return i;
        }
    }
    return -1;
}

// Function to reset the puzzle (deselects images but keeps the same set)
function resetPuzzle(popupId) {
    // Remove the 'highlight' class from all images
    const images = document.querySelectorAll('.circle-container .image');
    images.forEach(image => image.classList.remove('highlight'));

    // Hide the popup message
    document.getElementById(popupId).classList.remove('active');

    // Re-initialize the imagesToSelect array to the original selectedImages
    imagesToSelect = [...selectedImages];
}

// Function to change to a new puzzle (reshuffles and selects new images)
function changePuzzle(popupId) {
    createAndPositionImages();
    document.getElementById(popupId).classList.remove('active');
}

function adjustFontSize() {
    const centerText = document.querySelector('.center-text');
    const parentWidth = centerText.offsetWidth;
    const parentHeight = centerText.offsetHeight;

    // Start with a reasonably large font size
    let fontSize = 100;

    // Reduce the font size until it fits within the container
    centerText.style.fontSize = `${fontSize}px`;
    while (
        centerText.scrollWidth > parentWidth ||
        centerText.scrollHeight > parentHeight
    ) {
        fontSize--;
        centerText.style.fontSize = `${fontSize}px`;
    }
}

// Call the function to adjust font size on load and on window resize
window.addEventListener('load', adjustFontSize);
window.addEventListener('resize', adjustFontSize);


// Initialize the puzzle
createAndPositionImages();
