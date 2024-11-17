import json
import os
import re
import string


from bs4 import BeautifulSoup
from collections import Counter
from jinja2 import Template
from pathlib import Path
from PIL import Image

from interactive_book_words_to_ignore import function_words, particles_to_ignore


# Read the HTML content
def read_html_book(html_file_path: str):
    with open(html_file_path, "r", encoding="utf-8") as file:
        return file.read()


def read_json(filepath):
    with open(filepath, "r") as file:
        return json.load(file)


def parse_html_book(html_content):

    soup = BeautifulSoup(html_content, "html.parser")

    chapters = []
    tab_names = []
    current_chapter = []
    default_intro_tab_name = "Intro"
    last_text = None
    last_image = None
    last_name = None

    for element in soup.find_all(["h1", "h2", "p", "div", "span", "img"]):

        if element.name in ["h1", "h2"]:
            if current_chapter:
                chapters.append(current_chapter)
                if not tab_names:
                    tab_names.append(default_intro_tab_name)
            current_chapter = [str(element)]
            tab_names.append(element.get_text(strip=True))
            last_text = element.get_text(strip=True)  # Update last_text
            last_name = element.name

        elif element.name == "img":
            img_src = element.get("src")
            if img_src != last_image:  # Check for image duplication
                if last_name != "img":
                    current_chapter.append("<br>")
                png_suffix = ".png"
                str_element = str(element)
                if img_src.endswith(png_suffix):
                    str_element = str_element.replace(png_suffix, ".jpg")
                current_chapter.append(str_element)
                last_name = element.name
                last_image = img_src
        else:
            text_content = element.get_text(strip=True)
            if text_content and text_content != last_text:  # Check for text duplication
                if last_name == "img":
                    current_chapter.append("<br>")
                current_chapter.append(str(element))
                last_name = element.name
                last_text = text_content

    if current_chapter:
        chapters.append(current_chapter)

    # Return chapters as a list of HTML strings and tab names
    return ["".join(chapter) for chapter in chapters], tab_names


def add_feedback_box_to_each_chapter(chapters):
    feedback_box_html = """<table id="feedbackTable" border="1"><tr><th>Chapter</th><th>Overall</th><th>World-Building</th><th>Plot</th><th>Pacing</th><th>Dialogue</th><th>Character Development</th><th>Conflict/Tension</th><th>Themes</th><th>Emotional Impact</th></tr><tr><td class='chapter-title'>Rating</td><td contenteditable='true'></td><td contenteditable='true'></td><td contenteditable='true'></td><td contenteditable='true'></td><td contenteditable='true'></td><td contenteditable='true'></td><td contenteditable='true'></td><td contenteditable='true'></td><td contenteditable='true'></td></tr><tr><td class='chapter-title'>Comments</td><td contenteditable='true'></td><td contenteditable='true'></td><td contenteditable='true'></td><td contenteditable='true'></td><td contenteditable='true'></td><td contenteditable='true'></td><td contenteditable='true'></td><td contenteditable='true'></td><td contenteditable='true'></td></tr></table><button class="feedbackButton" onclick="sendChapterFeedback()">Send Feedback</button>"""
    return [c + feedback_box_html for c in chapters]


def extract_media(html_content):

    soup = BeautifulSoup(html_content, "html.parser")

    media_list = []
    for element in soup.find_all(["img", "audio", "video"]):
        src = element.get("src")
        if src:
            media_list.append({"type": element.name, "src": src})

    return media_list


def extract_images(html_content):

    soup = BeautifulSoup(html_content, "html.parser")

    image_list = []
    for img in soup.find_all("img"):
        src = img.get("src")
        if src:
            suffix = ".png"
            if src.endswith(suffix):
                src = f"{src[:-len(suffix)]}.jpg"
            image_list.append(src)
    return image_list


def images_png_to_jpg(directory):

    for filename in os.listdir(directory):
        if filename.lower().endswith(".png"):

            png_path = os.path.join(directory, filename)
            with Image.open(png_path) as img:
                white_background = Image.new("RGB", img.size, (255, 255, 255))

                img = img.convert("RGBA")
                white_background.paste(img, mask=img.split()[3])

                jpg_filename = os.path.splitext(filename)[0] + ".jpg"
                jpg_path = os.path.join(directory, jpg_filename)

                white_background.save(jpg_path, "JPEG")
                os.remove(png_path)

            print(f"Converted {filename} to {jpg_filename}")


def extract_word_count(html_content):

    soup = BeautifulSoup(html_content, "html.parser")

    text = ""  # Just aggregate all words in a single str, separated by a space
    for paragraph in soup.find_all(["p", "h1", "h2"]):
        text += paragraph.get_text() + " "
    if soup.title:
        text += soup.title.get_text() + " "

    text = re.sub(r"[^\x00-\x7F]+", "", text)  # Remove non ASCII characters

    for particle in particles_to_ignore:
        text = text.replace(particle, "")

    text = text.lower().translate(
        str.maketrans("", "", string.punctuation)
    )  # lowercase and remove punctuation sign
    text = re.sub(
        r"\b(\w+?)s\b(?=.*\b\1\b)", r"\1", text
    )  # Use re.sub to replace the plural form with the singular form
    text = re.sub(
        r"\s+", " ", text
    ).strip()  # Remove extra spaces left behind and return the cleaned string

    return filter_and_sort_word_count(Counter(text.split()))


def filter_and_sort_word_count(
    word_count, min_word_count: int = 5, max_words: int = 60
):
    word_count = {
        word: count
        for word, count in word_count.items()
        if word.lower() not in function_words
    }

    word_count = {
        word: count for word, count in word_count.items() if count >= min_word_count
    }

    word_count = dict(list(word_count.items())[:max_words])

    return dict(sorted(word_count.items(), key=lambda item: item[1], reverse=True))


def extract_paragraph_texts(content):
    return [
        p.get_text()
        for p in BeautifulSoup(content, "html.parser").find_all("p")
        if p.get_text() != ""
    ]


def add_content_tab(chapters, tab_names, content_dir):
    chapters.append(generate_contents_page(get_content_links(content_dir)))
    tab_names.append("Contents")
    return chapters, tab_names


def get_content_links(base_path):
    return [
        f"{base_path}/{content_name}/{content_name}.html"
        for content_name in os.listdir(base_path)
        if os.path.isfile(f"{base_path}/{content_name}/{content_name}.html")
    ]


def generate_contents_page(content_links):
    html_template = """
            <h1>Contents</h1>
            <div class="contents-grid">
                {buttons}
            </div>
    """

    def snake_to_camel_with_spaces(snake_str):
        words = snake_str.split("_")
        camel_case_str = " ".join(word.capitalize() for word in words)
        return camel_case_str

    def get_name_from_file_path(fp):
        return snake_to_camel_with_spaces(fp.split("/")[-1].split(".")[0])

    button_html = "\n\t\t\t".join(
        f"<button onclick=\"window.location.href='{content}'\">{get_name_from_file_path(content)}</button>"
        for content in content_links
    )

    return html_template.replace("{buttons}", button_html)


def create_feedback_page(chapter_titles):
    # Aspects to rate
    aspects = [
        "Overall",
        "World-Building",
        "Plot",
        "Pacing",
        "Dialogue",
        "Character Development",
        "Conflict/Tension",
        "Themes",
        "Emotional Impact",
    ]

    chapters = ["Whole Story"] + chapter_titles

    # Generate the HTML structure for the tables
    aspects_headers = "".join(f"<th>{aspect}</th>" for aspect in aspects)
    chapter_rows_ratings = "".join(
        f"<tr><td class='chapter-title'>{chapter}</td>"
        + "".join(f"<td contenteditable='true'></td>" for _ in aspects)
        + "</tr>"
        for chapter in chapters
    )
    chapter_rows_comments = "".join(
        f"<tr><td class='chapter-title'>{chapter}</td>"
        + "".join(f"<td contenteditable='true'></td>" for _ in aspects)
        + "</tr>"
        for chapter in chapters
    )

    # Use the CSS from `interactive_book.css`
    style = """
    <style>
        /* General page styling */
        body {
            font-family: 'Roboto', Arial, sans-serif;
            line-height: 1.6;
            background-color: #f4f4f9;
            color: #4a4a4a;
            margin: 20px;
        }

        h2, h3 {
            text-align: center;
            color: #6a89cc;
        }

        table {
            width: 100%;
            max-width: 90vw;
            margin: 20px auto;
            border-collapse: collapse;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
        }

        th, td {
            padding: 12px 15px;
            text-align: center;
            border: 1px solid white;
        }

        th {
            background-color: #6a89cc;
            color: white;
            font-weight: bold;
        }

        td {
            font-size: 14px;
        }

        td[contenteditable="true"] {
            background-color: #f3f7fa;
            outline: none;
            border: 1px solid white;
            transition: border-color 0.3s;
        }

        td[contenteditable="true"]:focus {
            border-color: #6a89cc;
            background-color: #e9f4fe;
        }

        .chapter-title {
            font-weight: bold;
            color: #4a4a4a;
            background-color: #f1f1f1;
        }

        .feedbackButton {
            display: block;
            margin: 30px auto;
            padding: 12px 24px;
            font-size: 16px;
            color: white;
            background-color: #6a89cc;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s, transform 0.2s, box-shadow 0.2s;
        }

        .feedbackButton:hover {
            background-color: #357ABD;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(106, 137, 204, 0.3);
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
            th, td {
                padding: 8px 10px;
                font-size: 12px;
            }
            button {
                padding: 10px 20px;
                font-size: 14px;
            }
        }
    </style>
    """

    # JavaScript to collect and send feedback
    script = (
        """
    <script>
        let userName

        function finalizeFeedback() {
            const aspects = ["Overall", "World-Building", "Plot", "Pacing", "Dialogue", "Character Development", "Conflict/Tension", "Themes", "Emotional Impact"];
            const chapterTitles = """
        + str(chapters)
        + """;
            let feedbackData = [];

            // Collect data from both tables
            chapterTitles.forEach((chapter, index) => {
                let chapterFeedback = { chapter: chapter, ratings: {}, comments: {} };

                // Collect ratings
                const ratingCells = document.querySelectorAll("#ratingsTable tr")[index + 1].querySelectorAll("td[contenteditable='true']");
                ratingCells.forEach((cell, i) => {
                    const value = parseInt(cell.innerText.trim(), 10);
                    chapterFeedback.ratings[aspects[i]] = isNaN(value) ? null : value;
                });

                // Collect comments
                const commentCells = document.querySelectorAll("#commentsTable tr")[index + 1].querySelectorAll("td[contenteditable='true']");
                commentCells.forEach((cell, i) => {
                    chapterFeedback.comments[aspects[i]] = cell.innerText.trim() || null;
                });
                
                if (chapterFeedbackIsEmpty(chapterFeedback) !== true) {
                    feedbackData.push(chapterFeedback);
                }
            });

            // Add metadata
            if (!userName) {
                userName = prompt("Please enter your name (or leave blank for anonymous):") || "Anonymous";
            }
            const storyId = 1;
            const currentDate = new Date().toISOString();

            feedbackData = feedbackData.map(feedback => ({
                userName: userName,
                storyID: storyId,
                date: currentDate,
                ...feedback
            }));

            console.log(feedbackData)

            // Send feedback to the Netlify serverless function
            fetch('/.netlify/functions/logFeedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feedbackData)
            })
            .then(response => {
                if (response.ok) {
                    alert("Feedback sent successfully!");
                } else {
                    alert("Failed to send feedback. Please try again.");
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("An error occurred. Please try again.");
            });
        }

        function chapterFeedbackIsEmpty(chapterFeedback) {
            const allRatingsAreEmpty = Object.values(chapterFeedback.ratings).every(value => value === null);
            const allCommentsAreEmpty = Object.values(chapterFeedback.comments).every(value => value === null || value.trim() === "");
            return allRatingsAreEmpty && allCommentsAreEmpty;
        }

    </script>
    """
    )

    # HTML for the feedback page, including the DOCTYPE declaration
    feedback_page_html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Story Feedback</title>
        {style}
    </head>
    <body>
        <h2>Story Feedback</h2>
        <h3>Ratings (1-10)</h3>
        <table id="ratingsTable" border="1">
            <tr><th>Chapter</th>{aspects_headers}</tr>
            {chapter_rows_ratings}
        </table>
        <h3>Comments</h3>
        <table id="commentsTable" border="1">
            <tr><th>Chapter</th>{aspects_headers}</tr>
            {chapter_rows_comments}
        </table>
        <button class="feedbackButton" onclick="finalizeFeedback()">Send Feedback</button>
        {script}
    </body>
    </html>
    """

    return feedback_page_html


def add_story_feedback_tab(chapters, tab_names, feedback_html_link):
    """Add a Story Feedback tab to the interactive book via a link."""
    # Create an iframe that loads the external story_feedback.html file
    feedback_tab_content = f"""
    <iframe src="{feedback_html_link}" width="100%" height="800px" frameborder="0"></iframe>
    """

    # Add the iframe as a new tab
    chapters.append(feedback_tab_content)
    tab_names.append("Story Feedback")

    return chapters, tab_names


def generate_static_html(chapters, tab_names, title):
    html_template = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{ title }}</title>
    <link rel="stylesheet" href="interactive_book.css">
</head>
<body>
    <h1>{{ title }}</h1>
    <div class="tab-buttons">
        {% for i in range(chapters|length) %}
        <button class="tab-button" onclick="showTab({{ i }})">{{ tab_names[i] }}</button>
        {% endfor %}
    </div>
    <div class="tab-content">
        {% for chapter in chapters %}
        <div class="tab">{{ chapter|safe }}</div>
        {% endfor %}
    </div>
    <script src="interactive_book.js"></script>
</body>
</html>
    """

    template = Template(html_template)
    return template.render(
        chapters=chapters, tab_names=tab_names, title=title.replace("_", " ")
    )


def save_to_json(data, filepath):
    with open(filepath, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4)


def save_html(data, filepath):
    with open(filepath, "w", encoding="utf-8") as file:
        file.write(data)


def save_html_to_content(data, contents_dir, name):
    filepath = f"{contents_dir}/{name}/{name}.html"
    Path(filepath).parent.mkdir(parents=True, exist_ok=True)
    save_html(data, filepath)


def main():

    html_file_path = "The_Valley_of_Dragons_1_-_Attack_of_the_Dark_God.html"
    contents_dir = "contents"
    images_dir = "images"
    feedback_html_path = "story_feedback.html"
    title = html_file_path.split("/")[-1].split(".")[0]
    output_file_path = "index.html"
    add_feedback_to_each_chapter = False

    # Read html
    html_book = read_html_book(html_file_path)
    save_to_json(extract_media(html_book), "interactive_book_media.json")
    save_to_json(extract_images(html_book), "interactive_book_images.json")
    images_png_to_jpg(images_dir)
    save_to_json(extract_word_count(html_book), "interactive_book_word_count.json")
    save_to_json(
        extract_paragraph_texts(html_book), "interactive_book_parapragh_texts.json"
    )

    # Generate html interactive book
    chapters, tab_names = parse_html_book(html_book)
    if add_feedback_to_each_chapter:
        chapters = [chapters[0], *add_feedback_box_to_each_chapter(chapters[1:])]
    chapters, tab_names = add_content_tab(chapters, tab_names, contents_dir)

    feedback_page = create_feedback_page(tab_names[1:-1])
    save_html(feedback_page, feedback_html_path)

    chapters, tab_names = add_story_feedback_tab(
        chapters, tab_names, feedback_html_path
    )
    interactive_book = generate_static_html(chapters, tab_names, title)

    # Save book locally
    save_html(interactive_book, output_file_path)


if __name__ == "__main__":
    main()
