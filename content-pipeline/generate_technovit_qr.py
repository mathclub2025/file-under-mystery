import qrcode
from PIL import Image, ImageDraw, ImageOps
import os

url = "https://chennaievents.vit.ac.in/technovit/"

# Output paths
root_output = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\technovit_registration_qr.png"
trailer_output = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\trailer\public\technovit_qr.png"

def generate_qr():
    # Configure high error correction (H) for crisp readability
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=20,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    # 1. Clean High-Res QR Code (Black on White)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    img.save(root_output, "PNG")
    img.save(trailer_output, "PNG")
    print(f"[+] Saved high-resolution QR code to:\n  - {root_output}\n  - {trailer_output}")

if __name__ == "__main__":
    generate_qr()
