import asyncio
import edge_tts
import os

audio_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "trailer", "public", "audio"))
os.makedirs(audio_dir, exist_ok=True)

PROLOGUE_LINES = [
    "October 14, 2026. Department of Theoretical Mathematics.",
    "A classified signal has breached the departmental network.",
    "Dr. Elias Marrow vanished thirty-seven days ago, leaving behind an encrypted black box.",
    "Before the uplink severed, two teaser telemetry files were transmitted.",
    "Your terminal has intercepted these opening anomalies.",
    "Analyze the evidence, recover the hidden passcodes, and prepare for what lies ahead."
]

LEVEL_BRIEFINGS = {
    "level1": [
        "Teaser Anomaly One: The Surveillance Negative.",
        "Recovered from a damaged sensor node outside Academic Block 3.",
        "The image was captured in pitch darkness and seems completely empty.",
        "Stretch the dynamic range histogram to expose the hidden code."
    ],
    "level2": [
        "Teaser Anomaly Two: The Intercepted Beacon.",
        "An anomalous radio transmission broadcast across the campus relay.",
        "A low-frequency acoustic disturbance masks a high-pitch telegraph carrier.",
        "Tune the audio bandpass filter to isolate the Morse sequence."
    ]
}

VOICE = "en-US-ChristopherNeural"

async def generate_all():
    print("[*] Generating 100% matched studio audio for Trailer Prologue...")
    for idx, text in enumerate(PROLOGUE_LINES):
        filename = f"prologue_{idx}.mp3"
        filepath = os.path.join(audio_dir, filename)
        communicate = edge_tts.Communicate(text, VOICE, rate="-3%", pitch="+0Hz")
        await communicate.save(filepath)
        print(f"  [+] Saved: {filename} -> '{text}'")

    print("[*] Generating 100% matched studio audio for Trailer Briefings...")
    for lvl_id, lines in LEVEL_BRIEFINGS.items():
        for l_idx, line in enumerate(lines):
            filename = f"briefing_{lvl_id}_{l_idx}.mp3"
            filepath = os.path.join(audio_dir, filename)
            communicate = edge_tts.Communicate(line, VOICE, rate="-3%", pitch="+0Hz")
            await communicate.save(filepath)
            print(f"  [+] Saved: {filename} -> '{line}'")

if __name__ == "__main__":
    asyncio.run(generate_all())
