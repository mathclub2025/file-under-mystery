import asyncio
import edge_tts
import os

audio_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "trailer", "public", "audio"))
os.makedirs(audio_dir, exist_ok=True)

# Exact female voice from main game
FEMALE_VOICE = "en-US-AvaNeural"

PROLOGUE_LINES = [
    "October 14, 2026. Department of Mathematics.",
    "Dr. Elias Marrow vanished thirty-seven days ago, leaving behind a locked air-gapped terminal.",
    "Before the campus network severed, two anomalous signal traces surfaced.",
    "A proof is not given; it is earned. Enter the frequency space to uncover what lies in the noise."
]

LEVEL_BRIEFINGS = {
    "level1": [
        "Timestamp: 03:14 AM. Closed-circuit camera intercept outside Academic Block 3.",
        "Campus security logs confirm an anomaly occurred right before the blackout.",
        "Where human eyes see only empty shadows, the sensor matrix captured lingering luminance.",
        "Look where the light fails to discover what Marrow concealed in the dark."
    ],
    "level2": [
        "Timestamp: 03:22 AM. An incoming voice transmission logged on the departmental relay.",
        "The speaker's voice is muffled, drowned beneath an acoustic veil.",
        "Department technicians dismissed it as interference, but a hidden carrier pulse vibrates beneath.",
        "Tune through the frequencies to isolate the concealed carrier."
    ]
}

async def generate_all():
    print(f"[*] Generating female studio voice ({FEMALE_VOICE}) for Trailer Prologue...")
    for idx, text in enumerate(PROLOGUE_LINES):
        filename = f"prologue_{idx}.mp3"
        filepath = os.path.join(audio_dir, filename)
        communicate = edge_tts.Communicate(text, FEMALE_VOICE, rate="+3%", pitch="+0Hz")
        await communicate.save(filepath)
        print(f"  [+] Saved: {filename} -> '{text}'")

    print(f"[*] Generating female studio voice ({FEMALE_VOICE}) for Trailer Briefings...")
    for lvl_id, lines in LEVEL_BRIEFINGS.items():
        for l_idx, line in enumerate(lines):
            filename = f"briefing_{lvl_id}_{l_idx}.mp3"
            filepath = os.path.join(audio_dir, filename)
            communicate = edge_tts.Communicate(line, FEMALE_VOICE, rate="+3%", pitch="+0Hz")
            await communicate.save(filepath)
            print(f"  [+] Saved: {filename} -> '{line}'")

if __name__ == "__main__":
    asyncio.run(generate_all())
