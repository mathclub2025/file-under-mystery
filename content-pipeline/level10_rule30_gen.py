import json
import numpy as np
from PIL import Image
import os

output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "evidence"))
os.makedirs(output_dir, exist_ok=True)
png_path = os.path.join(output_dir, "rule30_lattice.png")
json_path = os.path.join(output_dir, "rule30_matrix.json")

def step_rule30(state):
    next_s = []
    n = len(state)
    for i in range(n):
        l = state[i-1] if i > 0 else 0
        c = state[i]
        r = state[i+1] if i < n - 1 else 0
        pat = f"{l}{c}{r}"
        val = 1 if pat in ["100", "011", "010", "001"] else 0
        next_s.append(val)
    return next_s

# Initial 8-bit seed placed in the center of 64 columns
cols = 64
steps = 48
seed = [1, 0, 1, 0, 0, 1, 1, 0] # Token maps to R30S4

grid = np.zeros((steps, cols), dtype=np.uint8)
center_idx = (cols - len(seed)) // 2
grid[0, center_idx:center_idx + len(seed)] = seed

current = list(grid[0])
for r in range(1, steps):
    current = step_rule30(current)
    grid[r] = current

# Save raw matrix JSON
matrix_data = {
    "automaton_rule": "Wolfram Rule 30",
    "grid_dimensions": {"rows": steps, "cols": cols},
    "seed_length": 8,
    "seed_recovered_binary": "10100110",
    "verification_token": "R30S4",
    "states": grid.tolist()
}

with open(json_path, "w", encoding="utf-8") as f:
    json.dump(matrix_data, f, indent=2)
print(f"[+] Level 10 matrix JSON generated: {json_path}")

# Render high-resolution raster image (scale each cell to 8x8 pixels)
scale = 8
img_arr = np.repeat(np.repeat(grid * 255, scale, axis=0), scale, axis=1)
# Add color tint (amber active cells, dark slate dead cells)
rgb_arr = np.zeros((img_arr.shape[0], img_arr.shape[1], 3), dtype=np.uint8)
rgb_arr[img_arr == 0] = [10, 14, 22]       # Inactive cell
rgb_arr[img_arr == 255] = [245, 158, 11]   # Active cell (amber)

img = Image.fromarray(rgb_arr)
img.save(png_path)
print(f"[+] Level 10 raster lattice generated: {png_path}")
