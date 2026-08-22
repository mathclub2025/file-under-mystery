import os
import asyncio
import edge_tts

audio_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\audio"
dist_audio_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\dist\audio"
os.makedirs(audio_dir, exist_ok=True)
os.makedirs(dist_audio_dir, exist_ok=True)

FEMALE_VOICE = "en-US-AvaNeural"

LEVEL_LINES = {
    "level7": [
        "Continuous analog signals intercepted from Dr. Marrow's laboratory oscilloscope.",
        "Multiple high-frequency sinusoidal waveforms oscillate across the phosphor display.",
        "Initial readings appear as turbulent, unaligned wave interference.",
        "Tune the harmonic frequencies and phase angles to bring the waves into constructive alignment."
    ],
    "level8": [
        "Astronomical telemetry recordings from the campus rooftop observatory link.",
        "Marrow accessed the telescope relay in secret late that evening to log coordinate data.",
        "The recorded scatter points do not match standard celestial planetary orbits.",
        "Evaluate the trajectory telemetry to resolve where his instruments were pointing."
    ],
    "level9": [
        "A mysterious digital signal file recovered from the university core backup drive.",
        "The raw frequency spectrum appears as chaotic, textured noise across the transform plane.",
        "Department technicians were unable to make sense of the erratic readings.",
        "Isolate the harmonic resonance frequencies to recover the dispersed fragments."
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
    print(f"[*] Generating Audio for Level 7, Level 8, Level 9 ({FEMALE_VOICE})...")
    for lvl_id, lines in LEVEL_LINES.items():
        for i, line in enumerate(lines):
            fname = f"briefing_{lvl_id}_{i}.mp3"
            fpath = os.path.join(audio_dir, fname)
            await generate_audio_file(line, fpath)
            print(f"  -> Generated {fname}")

    print("[+] All voice tracks for Level 7, 8, 9 generated successfully!")

if __name__ == "__main__":
    asyncio.run(main())
