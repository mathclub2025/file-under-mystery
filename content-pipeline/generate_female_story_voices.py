import os
import asyncio
import edge_tts

# Audio Output Directory
audio_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\audio"
dist_audio_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\dist\audio"
os.makedirs(audio_dir, exist_ok=True)
os.makedirs(dist_audio_dir, exist_ok=True)

# Select Microsoft's flagship natural storytelling female voice
FEMALE_VOICE = "en-US-AvaNeural"

PROLOGUE_LINES = [
  "October 14, 2026. Department of Mathematics.",
  "Dr. Elias Marrow, Senior Faculty in Theoretical Mathematics, has vanished.",
  "His campus office in Room 418 was found completely deserted.",
  "For twenty-four years, Marrow was the quiet pillar of mathematical rigor.",
  "Eight months ago, he formulated what colleagues termed The Marrow Conjecture.",
  "He claimed prime distributions and entropy were not chaotic anomalies...",
  "But deterministic harmonic projections of a single unified matrix transformation.",
  "In the wrong hands, his equations could collapse global asymmetric encryption.",
  "On the night of his disappearance, campus cameras tracked him into the perimeter woods.",
  "In Room 418, all chalkboards had been scrubbed clean.",
  "On his desk sat a single air-gapped solid-state drive labeled BLACKBOX.DAT.",
  "Standard recovery tools failed. The drive refused master decryption keys.",
  "Its firmware broadcasted a single message: A proof is not given; it is earned.",
  "The drive has released twelve encrypted pieces of mathematical and forensic evidence.",
  "Along with each evidence artifact comes an encrypted fragment from his lost handwritten diary.",
  "No single fragment can be solved in isolation.",
  "Your team has been authorized as the official Forensics Unit.",
  "Level 01: The Photograph has been decrypted and is ready for inspection."
]

LEVEL_BRIEFINGS = {
  "level1": [
    "Timestamp: 03:14 AM. Recovered from Dr. Marrow's compact camera found in his desk drawer.",
    "Campus security logs confirm he was last seen heading toward the perimeter woods behind the Technology Tower.",
    "At first glance, the capture appears entirely dark and corrupted.",
    "Examine the raw exposure data to discover what Marrow left behind in the dark."
  ],
  "level2": [
    "Timestamp: 03:22 AM. An incoming voicemail left on Dr. Marrow's departmental extension.",
    "The audio recording is heavily distorted and laden with acoustic anomalies.",
    "Investigators noted strange artifacts underlying the background noise.",
    "Inspect the audio recording to recover the hidden transmission."
  ],
  "level3": [
    "Timestamp: 03:29 AM. Closed-circuit camera footage outside Room 418.",
    "Dr. Marrow appears briefly in the hallway before the camera signal glitches.",
    "Security officers dismissed the recording as hardware failure.",
    "Scrutinize the surveillance tape to uncover what happened in that corridor."
  ],
  "level4": [
    "Recovered from an unmarked USB drive found inside Marrow's coat pocket.",
    "A candid travel snapshot labeled 'Holiday in Vienna', dated several years before his disappearance.",
    "Colleagues claim this trip marked a sudden turning point in his mathematical research.",
    "Investigate the digital image file to discover what lies hidden beneath the surface."
  ],
  "level5": [
    "Cross-cut paper remnants retrieved from the department waste receptacle.",
    "Hours before vanishing, Dr. Marrow systematically destroyed pages of his private research.",
    "Our forensic team has pieced together the shredded fragments onto a single sheet.",
    "Examine the reconstructed manuscript to decipher Marrow's underlying logic."
  ],
  "level6": [
    "Network traffic intercepted by the campus firewall at 03:35 AM.",
    "A sudden burst of outbound transmissions originated from Marrow's terminal just minutes before he fled.",
    "All connection requests were masked behind routine encrypted communications.",
    "Analyze the captured network data to isolate the anomalous payload."
  ],
  "level7": [
    "A damaged manuscript page recovered from Marrow's personal research archive.",
    "The mathematical proof appears heavily distorted and unreadable.",
    "His notes suggest the corruption was intentional, designed to protect a critical derivation.",
    "Work through the manuscript structure to restore the original theorem."
  ],
  "level8": [
    "A mysterious digital signal file recovered from the university core backup drive.",
    "The raw data appears as a chaotic, textured pattern with no visible structure.",
    "Department technicians were unable to make sense of the erratic readings.",
    "Investigate the underlying frequency signatures to reveal the embedded signal."
  ],
  "level9": [
    "Astronomical telemetry recordings from the campus rooftop observatory link.",
    "Marrow accessed the telescope relay in secret late that evening to log coordinate data.",
    "The recorded scatter points do not match standard celestial planetary orbits.",
    "Evaluate the trajectory telemetry to resolve where his instruments were pointing."
  ],
  "level10": [
    "A discrete computational matrix retrieved from an automated simulation log.",
    "The simulation ran undisturbed for hours, producing an intricate self-organizing pattern.",
    "Marrow believed this geometric structure held the key to universal deterministic chaos.",
    "Inspect the computational evolution to determine how the pattern originated."
  ],
  "level11": [
    "A synchronized dual-channel radio intercept recorded from the perimeter antenna.",
    "Both channels were overwhelmed with heavy acoustic interference.",
    "Initial listening attempts yielded only harsh, chaotic static.",
    "Examine the relationship between both audio channels to recover the concealed message."
  ],
  "level12": [
    "Perimeter telemetry mapping environmental sensor nodes across the campus grounds.",
    "Marrow's tracking beacons tripped several perimeter checkpoints as he moved in the dark.",
    "His route formed an intricate, non-linear pathway across the facility grounds.",
    "Reconstruct the path of movement to locate the final coordinate point."
  ]
}

async def generate_audio_file(text, filepath):
    comm = edge_tts.Communicate(text, FEMALE_VOICE, rate="+4%", pitch="+0Hz")
    await comm.save(filepath)
    dist_path = os.path.join(dist_audio_dir, os.path.basename(filepath))
    try:
        with open(filepath, "rb") as f_in, open(dist_path, "wb") as f_out:
            f_out.write(f_in.read())
    except:
        pass

async def main():
    print(f"[*] Generating Non-Spoiler Story Audio with Female Voice ({FEMALE_VOICE})...")
    tasks = []

    # 1. Prologue Lines
    for i, line in enumerate(PROLOGUE_LINES):
        fname = f"prologue_{i}.mp3"
        fpath = os.path.join(audio_dir, fname)
        tasks.append(generate_audio_file(line, fpath))

    # 2. Level Briefings
    for lvl_id, lines in LEVEL_BRIEFINGS.items():
        for i, line in enumerate(lines):
            fname = f"briefing_{lvl_id}_{i}.mp3"
            fpath = os.path.join(audio_dir, fname)
            tasks.append(generate_audio_file(line, fpath))

    chunk_size = 8
    for i in range(0, len(tasks), chunk_size):
        chunk = tasks[i:i + chunk_size]
        await asyncio.gather(*chunk)
        print(f"  -> Generated {min(i + chunk_size, len(tasks))} / {len(tasks)} tracks...")

    print("[+] All mystery storytelling audio successfully regenerated!")

if __name__ == "__main__":
    asyncio.run(main())
