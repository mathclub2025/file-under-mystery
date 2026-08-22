import asyncio
import edge_tts
import os

audio_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "audio"))
os.makedirs(audio_dir, exist_ok=True)

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
        "Campus security footage shows he was walking along the perimeter woods behind the Technology Tower on the night he vanished.",
        "To the human eye, the image appears pitch black, a total failure of exposure.",
        "But the camera sensor recorded non-zero luminance.",
        "Something is hiding in the dark."
    ],
    "level2": [
        "Timestamp: 03:22 AM. Audio voicemail retrieved from Dr. Marrow's departmental extension.",
        "The voice data is corrupted by heavy radio frequency interference.",
        "However, spectrum analysis reveals an unmodulated harmonic carrier frequency.",
        "Isolate the carrier frequency to reconstruct the missing transmission."
    ],
    "level3": [
        "Timestamp: 03:29 AM. Low frame-rate security recording from the 4th floor corridor outside Room 418.",
        "Marrow is seen walking past the camera, but the frame drops to static intermittently.",
        "Forensic temporal differencing between adjacent frames reveals an optical flash.",
        "Analyze the differential video frames to locate the encoded artifact."
    ],
    "level4": [
        "Recovered from an unencrypted USB drive in the laboratory desk.",
        "A photograph labeled 'Holiday in Vienna' containing anomalous high-frequency noise in the blue color channel.",
        "Extract the raw bitplanes to recover the embedded cryptographic container."
    ],
    "level5": [
        "Cross-cut paper strips retrieved from the office wastebasket.",
        "Dr. Marrow appears to have shredded his preliminary notes on prime modular arithmetic.",
        "Reconstruct the prime sequence index to decipher the running key ciphertext."
    ],
    "level6": [
        "Network capture dump intercepted by campus gateway firewall at 03:35 AM.",
        "Eighty outbound HTTP requests were logged simultaneously.",
        "One packet contains an anomalous authorization token.",
        "Inspect packet headers and payload lengths to isolate the rogue transaction."
    ],
    "level7": [
        "Recovered manuscript page damaged by recursive matrix transformation.",
        "The mathematical proof has been sliced into an 8 by 8 permutation grid.",
        "Invert the permutation matrix and transpose the coordinate tensor to restore the original page."
    ],
    "level8": [
        "Two-dimensional frequency domain steganography intercepted on the local campus server.",
        "A spatial signal contains a hidden watermark embedded in frequency space.",
        "Apply radial bandpass filtering and compute the 2D Inverse Fourier Transform to recover the token."
    ],
    "level9": [
        "Astronomical telemetry data from the campus observatory relay.",
        "Orbital coordinates follow a discrete logarithm curve over Galois Field 101.",
        "Perform scalar point multiplication on the elliptic curve generator to resolve the trajectory."
    ],
    "level10": [
        "One-dimensional cellular automaton state matrix recorded over 48 time steps.",
        "The lattice pattern follows Wolfram Rule 30.",
        "Compute the inverse predecessor seed that initiated the chaotic triangular growth."
    ],
    "level11": [
        "Dual-channel stereo audio intercept from the university radio telescope receiver.",
        "Both channels are saturated with uncorrelated Gaussian noise.",
        "Applying a 180-degree phase inversion to the right channel cancels the masking noise floor.",
        "Isolate the differential carrier tone."
    ],
    "level12": [
        "Campus sensor telemetry grid topology mapping 16 monitoring nodes.",
        "Dr. Marrow's physical escape path traversed an Eulerian circuit across prime-degree nodes.",
        "Trace the non-repeating graph path to converge on the final rendezvous location."
    ]
}

# Voice: Christopher is a rich, natural, cinematic documentary narrator voice
VOICE = "en-US-ChristopherNeural"

async def generate_all():
    print("[*] Generating natural studio neural human speech for prologue lines...")
    for idx, text in enumerate(PROLOGUE_LINES):
        filename = f"prologue_{idx}.mp3"
        filepath = os.path.join(audio_dir, filename)
        communicate = edge_tts.Communicate(text, VOICE, rate="-4%", pitch="+0Hz")
        await communicate.save(filepath)
        print(f"  [+] Saved: {filename}")

    print("[*] Generating natural studio neural speech for level briefings...")
    for lvl_id, lines in LEVEL_BRIEFINGS.items():
        for l_idx, line in enumerate(lines):
            filename = f"briefing_{lvl_id}_{l_idx}.mp3"
            filepath = os.path.join(audio_dir, filename)
            communicate = edge_tts.Communicate(line, VOICE, rate="-4%", pitch="+0Hz")
            await communicate.save(filepath)
            print(f"  [+] Saved: {filename}")

if __name__ == "__main__":
    asyncio.run(generate_all())
