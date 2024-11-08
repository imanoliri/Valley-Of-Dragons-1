import json
import shutil
import os

from bs4 import BeautifulSoup
from distutils.dir_util import copy_tree
from jinja2 import Template


# Read the HTML content
def read_html_book(html_file_path: str):
    with open(html_file_path, "r", encoding="utf-8") as file:
        return file.read()


# Function to parse the HTML file and divide it into chapters
def parse_html_book(html_content):

    # Use BeautifulSoup to parse the HTML
    soup = BeautifulSoup(html_content, "html.parser")

    chapters = []
    tab_names = []
    current_chapter = []
    default_intro_tab_name = "Intro"
    last_text = None  # To keep track of the last text content
    last_image = None  # To keep track of the last image content
    last_name = None

    for element in soup.find_all(["h1", "h2", "p", "div", "span", "img"]):
        # Check if the element is a heading
        if element.name in ["h1", "h2"]:
            if current_chapter:
                chapters.append(current_chapter)
                if not tab_names:
                    tab_names.append(default_intro_tab_name)
            current_chapter = [str(element)]
            tab_names.append(
                element.get_text(strip=True)
            )  # Use heading text as tab name
            last_text = element.get_text(strip=True)  # Update last_text
            last_name = element.name
        elif element.name == "img":
            # Check for image duplication
            img_src = element.get("src")
            if img_src != last_image:
                if last_name != "img":
                    current_chapter.append("<br>")
                current_chapter.append(
                    f'<div class="image-wrapper">{str(element)}</div>'
                )
                last_name = element.name
                last_image = img_src
        else:
            # Check for text duplication
            text_content = element.get_text(strip=True)
            if text_content and text_content != last_text:
                if last_name == "img":
                    current_chapter.append("<br>")
                current_chapter.append(str(element))
                last_name = element.name
                last_text = text_content

    if current_chapter:
        chapters.append(current_chapter)

    # Return chapters as a list of HTML strings and tab names
    return ["".join(chapter) for chapter in chapters], tab_names


def extract_media(html_content):

    # Parse the HTML content
    soup = BeautifulSoup(html_content, "html.parser")

    # List to store media sources
    media_list = []

    # Find all image, audio, and video tags in order of appearance
    for element in soup.find_all(["img"]):  # , "audio", "video"]):
        # Get the source attribute if it exists
        src = element.get("src")
        if src:
            # Append a dictionary with tag type and source to media_list
            media_list.append({"type": element.name, "src": src})

    return media_list


def extract_images(html_content):

    # Parse the HTML content
    soup = BeautifulSoup(html_content, "html.parser")

    # List to store image sources
    image_list = []

    # Find all image tags in order of appearance
    for img in soup.find_all("img"):
        src = img.get("src")
        if src:
            image_list.append(src)  # Add only the source of each image

    return image_list


def save_to_json(data, output_file_path):
    with open(output_file_path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4)


def generate_static_html(chapters, tab_names, title):
    # Jinja2 template for the static HTML with tabs
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

    # Use Jinja2 to render the template with chapters, tab names, and title
    template = Template(html_template)
    return template.render(chapters=chapters, tab_names=tab_names, title=title)


def save(data, output_file_path):
    # Write the rendered HTML to the output file
    with open(output_file_path, "w", encoding="utf-8") as file:
        file.write(data)


# Main function to run the script
def main():

    html_file_path = "The_Valley_of_Dragons_1_Attack_of_the_Dark_God_v2.html"  # Replace with your HTML file path
    images_dir = "images"
    export_dir = "EXPORT"
    book_styles_file = "interactive_book.css"
    book_script_file = "interactive_book.js"
    title = html_file_path.split("/")[-1].split(".")[0]
    output_file_path = f"{export_dir}/interactive_book.html"
    os.makedirs(export_dir, exist_ok=True)

    html_book = read_html_book(html_file_path)

    save_to_json(extract_media(html_book), f"{export_dir}/interactive_book_media.json")
    save_to_json(
        extract_images(html_book), f"{export_dir}/interactive_book_images.json"
    )

    chapters, tab_names = parse_html_book(html_book)
    interactive_book = generate_static_html(chapters, tab_names, title)
    if EXPORT:
        shutil.copyfile(html_file_path, f"{export_dir}/{html_file_path}")
        shutil.copyfile(book_styles_file, f"{export_dir}/{book_styles_file}")
        shutil.copyfile(book_script_file, f"{export_dir}/{book_script_file}")
        copy_tree(images_dir, f"{export_dir}/{images_dir}")

    save(interactive_book, output_file_path)


if __name__ == "__main__":
    EXPORT = True
    main()
