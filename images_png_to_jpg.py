import os
from PIL import Image


def convert_png_to_jpg(directory):

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


directory_path = "images"
convert_png_to_jpg(directory_path)
