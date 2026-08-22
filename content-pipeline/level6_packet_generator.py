import json
import base64
import random
import os

output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "evidence"))
os.makedirs(output_dir, exist_ok=True)
json_path = os.path.join(output_dir, "network_capture.json")

# Encode NT2K5 -> Base32 -> Base64
token = "NT2K5"
b32_encoded = base64.b32encode(token.encode()).decode()  # 'NT2K5==='
b64_bearer = base64.b64encode(b32_encoded.encode()).decode()  # 'TlQySzU9PT0='

endpoints = [
    "/index.html", "/assets/app.js", "/assets/main.css", "/api/v1/status",
    "/favicon.ico", "/images/logo.png", "/api/v1/departments/math",
    "/research/preprints/2026/marrow.pdf", "/api/v1/schedule"
]

methods = ["GET", "GET", "GET", "POST", "GET", "HEAD"]
statuses = [200, 200, 200, 200, 304, 404, 200]

random.seed(42)
packets = []

for i in range(1, 81):
    method = random.choice(methods)
    uri = random.choice(endpoints)
    status = random.choice(statuses)
    size = random.randint(250, 1800)
    auth = "None"
    
    if i == 47:
        # The anomalous outlier packet
        method = "POST"
        uri = "/api/v1/auth/relay-session"
        status = 200
        size = 4892  # Noticeably larger size
        auth = f"Bearer {b64_bearer}"
    elif random.random() < 0.15:
        auth = f"Bearer sess_{random.randint(100000, 999999)}"

    packets.append({
        "id": i,
        "timestamp": f"2026-10-14T03:{i//2:02d}:{random.randint(10,59):02d}Z",
        "client_ip": f"172.16.4.{random.randint(10, 250)}",
        "method": method,
        "uri": uri,
        "status": status,
        "size_bytes": size,
        "authorization": auth,
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DepartmentNode/4.18"
    })

with open(json_path, "w", encoding="utf-8") as f:
    json.dump(packets, f, indent=2)

print(f"[+] Level 6 network capture generated: {json_path} (80 packets)")
