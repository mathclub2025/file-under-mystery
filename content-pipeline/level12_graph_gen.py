import json
import matplotlib.pyplot as plt
import os

output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "evidence"))
os.makedirs(output_dir, exist_ok=True)
json_path = os.path.join(output_dir, "campus_topology.json")
png_path = os.path.join(output_dir, "campus_topology.png")

# Sensor nodes across VIT campus
nodes = [
    {"id": "G", "name": "Technology Tower (TT)", "x": 150, "y": 320, "degree": 3, "prime_degree": True},
    {"id": "R", "name": "Silver Jubilee Tower (SJT)", "x": 300, "y": 500, "degree": 3, "prime_degree": True},
    {"id": "4", "name": "Main Building (MB)", "x": 520, "y": 420, "degree": 5, "prime_degree": True},
    {"id": "P", "name": "Periyar Block (PRP)", "x": 480, "y": 180, "degree": 3, "prime_degree": True},
    {"id": "H", "name": "SMV Block", "x": 240, "y": 140, "degree": 3, "prime_degree": True},
    {"id": "X1", "name": "North Gate Relay (Decoy)", "x": 100, "y": 480, "degree": 2, "prime_degree": True},
    {"id": "X2", "name": "Foodys Station (Decoy)", "x": 590, "y": 280, "degree": 4, "prime_degree": False}
]

edges = [
    {"source": "G", "target": "R", "weight": 14.2},
    {"source": "R", "target": "4", "weight": 22.8},
    {"source": "4", "target": "P", "weight": 18.5},
    {"source": "P", "target": "H", "weight": 19.1},
    {"source": "H", "target": "G", "weight": 16.0},
    {"source": "G", "target": "X1", "weight": 8.5},
    {"source": "R", "target": "X1", "weight": 11.2},
    {"source": "4", "target": "X2", "weight": 9.4},
    {"source": "P", "target": "X2", "weight": 10.7}
]

graph_data = {
    "network_name": "VIT Campus Sensor Telemetry Grid",
    "total_nodes": len(nodes),
    "total_edges": len(edges),
    "eulerian_subgraph_nodes": ["G", "R", "4", "P", "H"],
    "eulerian_tour": "G -> R -> 4 -> P -> H -> G",
    "verification_token": "GR4PH",
    "nodes": nodes,
    "edges": edges
}

with open(json_path, "w", encoding="utf-8") as f:
    json.dump(graph_data, f, indent=2)
print(f"[+] Level 12 graph JSON generated: {json_path}")

# Render authentic graph topology plot
fig, ax = plt.subplots(figsize=(6, 4.5), dpi=150, facecolor="#03070D")
ax.set_facecolor("#03070D")

node_map = {n["id"]: (n["x"], n["y"]) for n in nodes}

# Draw edges
for e in edges:
    p1 = node_map[e["source"]]
    p2 = node_map[e["target"]]
    is_euler = e["source"] in ["G","R","4","P","H"] and e["target"] in ["G","R","4","P","H"]
    color = "#38BDF8" if is_euler else "#334155"
    lw = 1.8 if is_euler else 1.0
    ax.plot([p1[0], p2[0]], [p1[1], p2[1]], color=color, linewidth=lw, zorder=1)

# Draw nodes
for n in nodes:
    x, y = n["x"], n["y"]
    is_target = n["id"] in ["G", "R", "4", "P", "H"]
    c = "#38BDF8" if is_target else "#64748B"
    ax.scatter([x], [y], s=180 if is_target else 100, color=c, edgecolors="white", linewidth=1.5, zorder=2)
    ax.text(x, y + 18, f"{n['id']} ({n['name']})", color="white", fontsize=6.5, ha="center", fontname="DejaVu Sans", zorder=3)

ax.set_title("VIT CAMPUS SENSOR TELEMETRY TOPOLOGY", color="white", fontsize=9, fontname="DejaVu Sans")
ax.axis("off")

plt.tight_layout()
plt.savefig(png_path, facecolor=fig.get_facecolor(), edgecolor="none")
plt.close()
print(f"[+] Level 12 topology plot asset generated: {png_path}")
