import numpy as np
from PIL import Image, ImageDraw
import os

output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "evidence"))
os.makedirs(output_dir, exist_ok=True)
video_path = os.path.join(output_dir, "hallway.mp4")
anim_path = os.path.join(output_dir, "hallway.webp")

width, height = 640, 360
total_frames = 180
outlier_frame_index = 142
base64_payload = "VUdGZmMzZHZjbVE2SUZoVU5mRXg="  # Decodes to payload holding XT4Q1

frames = []

for f in range(total_frames):
    # Simulated flickering hallway corridor
    brightness_factor = 0.6 + 0.15 * np.sin(f * 0.4) + 0.05 * np.random.randn()
    
    # Base perspective hallway frame
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    for y in range(height):
        intensity = int(np.clip((100 + (y / height) * 80) * brightness_factor, 0, 255))
        frame[y, :, :] = (intensity, intensity, intensity + 5)
    
    img = Image.fromarray(frame)
    draw = ImageDraw.Draw(img)
    
    # Corridor vanishing perspective lines
    draw.line([(0, 0), (width // 2, height // 2)], fill=(50, 50, 60), width=2)
    draw.line([(width, 0), (width // 2, height // 2)], fill=(50, 50, 60), width=2)
    draw.line([(0, height), (width // 2, height // 2)], fill=(50, 50, 60), width=2)
    draw.line([(width, height), (width // 2, height // 2)], fill=(50, 50, 60), width=2)
    
    # Bulletin board on left wall
    draw.rectangle([60, 100, 160, 220], fill=(80, 60, 40), outline=(120, 90, 60))
    
    # Injected outlier frame at Frame 142
    if f == outlier_frame_index:
        # High contrast white flash on bulletin poster with Base64 text
        draw.rectangle([70, 110, 150, 210], fill=(255, 255, 255))
        draw.text((75, 130), "PAYLOAD:", fill=(0, 0, 0))
        draw.text((75, 150), base64_payload[:14], fill=(0, 0, 0))
        draw.text((75, 170), base64_payload[14:], fill=(0, 0, 0))
    else:
        draw.rectangle([70, 110, 150, 210], fill=(160, 150, 140))
        draw.text((75, 150), "MATH DEPT", fill=(100, 90, 80))

    frames.append(img)

# Save as animated WebP (ultra-efficient browser video/animation playback)
frames[0].save(
    anim_path,
    save_all=True,
    append_images=frames[1:],
    duration=33,  # ~30 fps
    loop=0
)
print(f"[+] Level 3 animated forensic sequence generated: {anim_path}")
