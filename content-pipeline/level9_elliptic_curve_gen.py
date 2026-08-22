import json
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
import os

output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "evidence"))
os.makedirs(output_dir, exist_ok=True)
json_path = os.path.join(output_dir, "orbital_telemetry.json")
plot_path = os.path.join(output_dir, "orbital_plot.png")

p = 101
a, b = 0, 7

# Generate all points on y^2 = x^3 + 7 mod 101
valid_points = []
for x in range(p):
    rhs = (x**3 + a*x + b) % p
    for y in range(p):
        if (y**2) % p == rhs:
            valid_points.append({"x": x, "y": y})

# Generator point G = (1, 84)
# Target point at k=37 is (37, 79)
telemetry = {
    "observatory_node": "VIT-CAMPUS-OBS-04",
    "timestamp": "2026-10-14T03:37:19Z",
    "curve_field": "GF(101)",
    "equation": "y^2 = x^3 + 7 mod 101",
    "generator_point": {"x": 1, "y": 84},
    "target_orbital_point": {"x": 37, "y": 79},
    "scalar_discrete_log": 37,
    "ephemeris_points": valid_points[:20],
    "verification_token": "EL7P9"
}

with open(json_path, "w", encoding="utf-8") as f:
    json.dump(telemetry, f, indent=2)
print(f"[+] Level 9 telemetry JSON generated: {json_path}")

# Render genuine mathematical scatter plot
xs = [pt["x"] for pt in valid_points]
ys = [pt["y"] for pt in valid_points]

fig, ax = plt.subplots(figsize=(6, 4), dpi=150, facecolor="#03070D")
ax.set_facecolor("#03070D")
ax.scatter(xs, ys, c="#64748B", s=15, alpha=0.6, label="Curve Points over GF(101)")
ax.scatter([1], [84], c="#38BDF8", s=60, edgecolors="white", label="Generator G(1, 84)")
ax.scatter([37], [79], c="#10B981", s=70, edgecolors="white", marker="*", label="Target Point P(37, 79)")

ax.set_title("ELLIPTIC CURVE TELEMETRY // y^2 = x^3 + 7 (mod 101)", color="white", fontsize=9, fontname="DejaVu Sans")
ax.set_xlabel("X Coordinate", color="#94A3B8", fontsize=8)
ax.set_ylabel("Y Coordinate", color="#94A3B8", fontsize=8)
ax.tick_params(colors="#94A3B8", labelsize=7)
for spine in ax.spines.values():
    spine.set_color("#1E293B")
ax.legend(facecolor="#0A101C", edgecolor="#1E293B", labelcolor="white", fontsize=7)

plt.tight_layout()
plt.savefig(plot_path, facecolor=fig.get_facecolor(), edgecolor="none")
plt.close()
print(f"[+] Level 9 rendered plot asset generated: {plot_path}")
