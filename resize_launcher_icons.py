from PIL import Image
import os

# Define the resolutions for Android launcher icons
resolutions = {
    "mdpi": (48, 48),
    "hdpi": (72, 72),
    "xhdpi": (96, 96),
    "xxhdpi": (144, 144),
    "xxxhdpi": (192, 192)
}

# Path to the source icon
source_icon_path = "mobile-app/assets/icon.png"

# Output directory for resized icons
output_dir = "mobile-app/android/app/src/main/res/mipmap-"

# Ensure the source icon exists
if not os.path.exists(source_icon_path):
    print(f"Source icon not found at {source_icon_path}")
    exit(1)

# Resize and save icons
for density, size in resolutions.items():
    output_path_launcher = os.path.join(output_dir + density, "ic_launcher.png")
    output_path_round = os.path.join(output_dir + density, "ic_launcher_round.png")
    os.makedirs(os.path.dirname(output_path_launcher), exist_ok=True)

    with Image.open(source_icon_path) as img:
        img_resized = img.resize(size, Image.Resampling.LANCZOS)
        img_resized.save(output_path_launcher, format="PNG")
        img_resized.save(output_path_round, format="PNG")
        print(f"Saved {density} icons at {output_path_launcher} and {output_path_round}")

print("Resizing completed.")