import os
import asyncio
import edge_tts

audio_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\audio"
dist_audio_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\dist\audio"
os.makedirs(audio_dir, exist_ok=True)
os.makedirs(dist_audio_dir, exist_ok=True)

FEMALE_VOICE = "en-US-AvaNeural"

LEVEL_5_LINES = [
    "Cross-cut paper remnants retrieved from the department waste receptacle.",
    "Hours before vanishing, Dr. Marrow was researching prime sequence distributions.",
    "Investigators noticed four sequence indices handwritten across the shredded equations.",
    "Use modulo operations to determine the shift parameters for the cipher dials."
]

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
    print(f"[*] Re-generating Level 5 Briefing Audio ({FEMALE_VOICE})...")
    for i, line in enumerate(LEVEL_5_LINES):
        fname = f"briefing_level5_{i}.mp3"
        fpath = os.path.join(audio_dir, fname)
        await generate_audio_file(line, fpath)
        print(f"  -> Generated {fname}")

    print("[+] Level 5 briefing narration audio updated successfully!")

if __name__ == "__main__":
    asyncio.run(main())
