import json
import random
import base64
import os

pcap_public_path = r"c:\Personal\VIT\Maths Club\Events/File Under Mystery/apps/web/public/evidence/network_capture.json"
pcap_dist_path = r"c:\Personal\VIT\Maths Club\Events/File Under Mystery/apps/web/dist/evidence/network_capture.json"

random.seed(42)

ENDPOINTS = [
    "/api/v1/telemetry/sensors",
    "/research/preprints/2026/marrow.pdf",
    "/api/v2/auth/oauth-relay",
    "/gateway/proxy/tunnel-status",
    "/admin/nodes/heartbeat",
    "/api/v1/schedule/matrix",
    "/logs/stream/department-audit",
    "/api/v1/auth/relay-session",
    "/oauth/v2/introspect",
    "/telemetry/observatory/ephemeris",
    "/storage/encrypted/vault_manifest.json",
    "/api/v1/crypto/handshake",
    "/internal/diagnostics/memory-dump",
    "/assets/bundles/dashboard.min.js",
    "/api/v2/clusters/sync"
]

METHODS = ["GET", "POST", "POST", "GET", "PUT", "HEAD"]
STATUSES = [200, 200, 200, 200, 201, 304, 200]

def make_fake_auth():
    choice = random.randint(1, 4)
    if choice == 1:
        # Fake Bearer token
        h = "".join(random.choices("abcdef0123456789", k=32))
        return f"Bearer sess_{h[:16]}"
    elif choice == 2:
        # Fake Basic Auth Base64
        u = f"user_{random.randint(10,99)}"
        p = f"pass_{random.randint(1000,9999)}"
        b = base64.b64encode(f"{u}:{p}".encode()).decode()
        return f"Basic {b}"
    elif choice == 3:
        # Mock JWT format
        h = base64.b64encode(b'{"alg":"HS256"}').decode().rstrip("=")
        p = base64.b64encode(b'{"sub":"guest_user"}').decode().rstrip("=")
        s = "".join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789", k=16))
        return f"Bearer {h}.{p}.{s}"
    else:
        # Mock API Key
        k = "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", k=24))
        return f"ApiKey api_live_{k[:12]}"

packets = []

for i in range(1, 81):
    timestamp = f"2026-10-14T03:{i // 3:02d}:{(i * 17) % 60:02d}Z"
    ip = f"172.16.4.{random.randint(10, 240)}"
    method = random.choice(METHODS)
    uri = random.choice(ENDPOINTS)
    status = random.choice(STATUSES)
    
    # Varied realistic sizes in KB (e.g. 1.2 KB to 28.5 KB)
    size_kb = round(random.uniform(1.2, 28.5), 1)
    
    if i == 47:
        # The rogue exfiltration packet
        method = "POST"
        uri = "/api/v1/auth/relay-session"
        status = 200
        size_kb = 64.8 # 64.8 KB
        # Real token: NT2K5 -> Base64 is TlQySzU=
        auth_header = "Bearer TlQySzU="
        user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DepartmentNode/4.18 (RogueSession)"
    else:
        auth_header = make_fake_auth()
        user_agent = f"Mozilla/5.0 (Windows NT 10.0; Win64; x64) DepartmentNode/4.{random.randint(10, 25)}"

    packets.append({
        "id": i,
        "timestamp": timestamp,
        "client_ip": ip,
        "method": method,
        "uri": uri,
        "status": status,
        "size_kb": size_kb,
        "size_bytes": int(size_kb * 1024),
        "authorization": auth_header,
        "user_agent": user_agent
    })

with open(pcap_public_path, "w", encoding="utf-8") as f:
    json.dump(packets, f, indent=2)

if os.path.exists(os.path.dirname(pcap_dist_path)):
    with open(pcap_dist_path, "w", encoding="utf-8") as f:
        json.dump(packets, f, indent=2)

print("[+] Rich PCAP data generated with realistic KB sizes, mock authorization keys on all packets, and Packet #47 containing Bearer TlQySzU=")
