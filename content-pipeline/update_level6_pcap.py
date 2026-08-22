import json
import os

pcap_public_path = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\network_capture.json"
pcap_dist_path = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\dist\evidence\network_capture.json"

with open(pcap_public_path, "r", encoding="utf-8") as f:
    packets = json.load(f)

for pkt in packets:
    if pkt["id"] == 47:
        pkt["size_bytes"] = 65536 # 65.5 KB - Huge noticeable exfiltration outlier!
        pkt["authorization"] = "Bearer TlQySzU=" # Base64 for NT2K5
    else:
        # Normalize normal packets to small traffic (120 - 750 B)
        if pkt["size_bytes"] > 1000:
            pkt["size_bytes"] = int(pkt["size_bytes"] * 0.35)
        pkt["authorization"] = "None"

with open(pcap_public_path, "w", encoding="utf-8") as f:
    json.dump(packets, f, indent=2)

if os.path.exists(os.path.dirname(pcap_dist_path)):
    with open(pcap_dist_path, "w", encoding="utf-8") as f:
        json.dump(packets, f, indent=2)

print("[+] Packet #47 updated: size_bytes=65536 B, authorization=Bearer TlQySzU= (Decodes to NT2K5)")
