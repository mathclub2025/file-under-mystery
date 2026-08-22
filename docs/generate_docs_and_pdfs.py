import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

base_docs_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\docs"
os.makedirs(base_docs_dir, exist_ok=True)

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "FILE UNDER MYSTERY // VIT MATHEMATICS CLUB")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)
            
        # Footer
        text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, text)
        self.drawString(54, 36, "CONFIDENTIAL // FORENSICS INVESTIGATION EVENT")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)
        self.restoreState()

def build_pdf(filename, story_flowables):
    pdf_path = os.path.join(base_docs_dir, filename)
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    doc.build(story_flowables, canvasmaker=NumberedCanvas)
    print(f"[+] Successfully built PDF: {pdf_path}")

# Common Styles
styles = getSampleStyleSheet()

# Custom Palette
C_PRIMARY = colors.HexColor("#0F172A")
C_ACCENT = colors.HexColor("#0284C7")
C_MUTED = colors.HexColor("#475569")
C_BG_CARD = colors.HexColor("#F8FAFC")
C_BORDER = colors.HexColor("#E2E8F0")
C_AMBER = colors.HexColor("#B45309")
C_GREEN = colors.HexColor("#047857")

title_style = ParagraphStyle(
    'DocTitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=22,
    leading=26,
    textColor=C_PRIMARY,
    spaceAfter=6
)

subtitle_style = ParagraphStyle(
    'DocSubtitle',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=11,
    leading=15,
    textColor=C_ACCENT,
    spaceAfter=15
)

h1_style = ParagraphStyle(
    'H1',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=14,
    leading=18,
    textColor=C_PRIMARY,
    spaceBefore=14,
    spaceAfter=6,
    keepWithNext=True
)

h2_style = ParagraphStyle(
    'H2',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=11,
    leading=15,
    textColor=C_ACCENT,
    spaceBefore=10,
    spaceAfter=4,
    keepWithNext=True
)

body_style = ParagraphStyle(
    'Body',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=9,
    leading=13,
    textColor=colors.HexColor("#1E293B"),
    spaceAfter=6
)

bullet_style = ParagraphStyle(
    'Bullet',
    parent=body_style,
    leftIndent=12,
    firstLineIndent=-8,
    spaceAfter=3
)

callout_style = ParagraphStyle(
    'Callout',
    parent=styles['Normal'],
    fontName='Helvetica-Oblique',
    fontSize=9,
    leading=13,
    textColor=C_AMBER
)

code_style = ParagraphStyle(
    'Code',
    parent=styles['Normal'],
    fontName='Courier',
    fontSize=8,
    leading=10.5,
    textColor=colors.HexColor("#0F172A")
)

def make_callout(text, title="NOTE / HINT"):
    p = Paragraph(f"<b>{title}:</b> {text}", callout_style)
    t = Table([[p]], colWidths=[504])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FEF3C7")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#F59E0B")),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    return t

# -------------------------------------------------------------
# 1. BUILD TECHNICAL ROADMAP PDF & MARKDOWN
# -------------------------------------------------------------
tech_flowables = []

tech_flowables.append(Paragraph("FILE UNDER MYSTERY", title_style))
tech_flowables.append(Paragraph("Complete Engineering Blueprint & Technical Build Roadmap", subtitle_style))
tech_flowables.append(HRFlowable(width="100%", thickness=1.5, color=C_ACCENT, spaceAfter=12))

tech_flowables.append(Paragraph("1. Executive Technical Summary & Architecture", h1_style))
tech_flowables.append(Paragraph(
    "<b>File Under Mystery</b> is an in-browser mathematical and digital forensics investigation event created for the VIT Mathematics Club. "
    "Unlike typical CTFs with isolated challenges, File Under Mystery is engineered around a unified forensic platform where all evidence analysis occurs "
    "inside simulated browser tools (Canvas 2D, WaveSurfer audio, video scrubbing, bit-plane steganography, prime-indexed crypto, and 2D Fourier filtering).",
    body_style
))

tech_flowables.append(Paragraph("Core Architecture Highlights:", h2_style))
tech_flowables.append(Paragraph("• <b>Unified Lab Engine:</b> Every level is a pure configuration JSON fed into a single, modular <code>LabEngine.jsx</code> component.", bullet_style))
tech_flowables.append(Paragraph("• <b>Dual-Reward Loop:</b> Solving a level awards points + reveals a cryptic fragment from Dr. Elias Marrow's lost notebook.", bullet_style))
tech_flowables.append(Paragraph("• <b>Zero-Trust Client:</b> Answers are verified exclusively server-side via Supabase Edge Functions with SHA-256 comparison.", bullet_style))
tech_flowables.append(Paragraph("• <b>Precomputed Heavy Pipelines:</b> Audio spectrograms and 2D FFT baselines are computed offline in Python to prevent browser lag.", bullet_style))

tech_flowables.append(Spacer(1, 8))

# Tech Stack Table
stack_data = [
    [Paragraph("<b>Layer</b>", body_style), Paragraph("<b>Choice</b>", body_style), Paragraph("<b>Rationale & Capabilities</b>", body_style)],
    [Paragraph("Frontend Framework", body_style), Paragraph("React 18 + Vite", code_style), Paragraph("Ultra-fast HMR, lightweight bundle size, ecosystem familiarity.", body_style)],
    [Paragraph("Styling & UI", body_style), Paragraph("Tailwind CSS", code_style), Paragraph("Zero custom CSS debt; unified forensic terminal dark theme.", body_style)],
    [Paragraph("State Management", body_style), Paragraph("Zustand", code_style), Paragraph("Minimal boilerplate for captain auth, hint deductions, and solve status.", body_style)],
    [Paragraph("Audio Waveform", body_style), Paragraph("wavesurfer.js", code_style), Paragraph("Audio playback, scrubbing, and synchronized spectrogram viewport.", body_style)],
    [Paragraph("Frequency Math", body_style), Paragraph("fft.js (NPM)", code_style), Paragraph("Fast Radix-4 1D/2D Fast Fourier Transforms for Level 8 frequency filtering.", body_style)],
    [Paragraph("Stego Unpacking", body_style), Paragraph("fflate (NPM)", code_style), Paragraph("High-speed zero-dependency ZIP archive extraction in browser memory.", body_style)],
    [Paragraph("Matrix Math", body_style), Paragraph("mathjs (NPM)", code_style), Paragraph("Matrix transformations, inversions, and modular linear algebra.", body_style)],
    [Paragraph("Backend & DB", body_style), Paragraph("Supabase Cloud", code_style), Paragraph("Managed Postgres, Captain magic links, realtime live leaderboards.", body_style)],
    [Paragraph("Verification", body_style), Paragraph("Supabase Edge Functions", code_style), Paragraph("Serverless Deno execution preventing client inspect-element exploits.", body_style)],
    [Paragraph("Content Pipeline", body_style), Paragraph("Python (Pillow, NumPy, SciPy)", code_style), Paragraph("Offline automated baking of real forensic evidence into static files.", body_style)],
]

stack_table = Table(stack_data, colWidths=[100, 110, 294])
stack_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
    ('TEXTCOLOR', (0, 0), (-1, 0), C_PRIMARY),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
]))
tech_flowables.append(stack_table)

tech_flowables.append(Spacer(1, 10))
tech_flowables.append(Paragraph("2. Detailed Forensic & Mathematical Levels Breakdown", h1_style))

levels_summary = [
    [Paragraph("<b>Lvl</b>", body_style), Paragraph("<b>Domain</b>", body_style), Paragraph("<b>Mathematical / Forensic Concept</b>", body_style), Paragraph("<b>Flag</b>", body_style), Paragraph("<b>Pts</b>", body_style)],
    [Paragraph("01", body_style), Paragraph("Image", body_style), Paragraph("Histogram Stretch: Linear remapping [10,40] -> [0,255]", body_style), Paragraph("A19X7", code_style), Paragraph("10", body_style)],
    [Paragraph("02", body_style), Paragraph("Audio", body_style), Paragraph("Spectrogram STFT: 3kHz Morse tone over noisy voice", body_style), Paragraph("K4P82", code_style), Paragraph("12", body_style)],
    [Paragraph("03", body_style), Paragraph("Video", body_style), Paragraph("Temporal Frame Differencing |f_i - f_{i-1}| on 300 frames", body_style), Paragraph("XT4Q1", code_style), Paragraph("14", body_style)],
    [Paragraph("04", body_style), Paragraph("Stego", body_style), Paragraph("Blue Channel LSB Bitplane Extraction -> ZIP -> Linear Eq", body_style), Paragraph("M77RB", code_style), Paragraph("16", body_style)],
    [Paragraph("05", body_style), Paragraph("Cipher", body_style), Paragraph("Prime-Indexed Modular Caesar stream (P_n mod 26)", body_style), Paragraph("P0W3R", code_style), Paragraph("18", body_style)],
    [Paragraph("06", body_style), Paragraph("Network", body_style), Paragraph("Packet triage by header size -> Base64/Base32 token decode", body_style), Paragraph("NT2K5", code_style), Paragraph("15", body_style)],
    [Paragraph("07", body_style), Paragraph("Matrix", body_style), Paragraph("8x8 Block Permutation Matrix Inversion + Transpose + 90 deg", body_style), Paragraph("BXZ19", code_style), Paragraph("18", body_style)],
    [Paragraph("08", body_style), Paragraph("Fourier", body_style), Paragraph("2D FFT Magnitude Spectrum Radial Bandpass Filter + IFFT", body_style), Paragraph("FIN4L", code_style), Paragraph("20", body_style)],
    [Paragraph("BOSS", body_style), Paragraph("Meta", body_style), Paragraph("Reverse Prime Reassembly [8..1] -> Vigenere Key Decryption", body_style), Paragraph("TOWARDS_INF", code_style), Paragraph("30", body_style)],
]

lvl_table = Table(levels_summary, colWidths=[28, 52, 290, 84, 50])
lvl_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
    ('TOPPADDING', (0, 0), (-1, -1), 3.5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
]))
tech_flowables.append(lvl_table)

tech_flowables.append(Spacer(1, 10))
tech_flowables.append(Paragraph("3. 4-Week Milestone Execution Schedule", h1_style))

week_data = [
    [Paragraph("<b>Phase</b>", body_style), Paragraph("<b>Primary Deliverables & Milestones</b>", body_style), Paragraph("<b>Key Risk Mitigations</b>", body_style)],
    [Paragraph("Week 1<br/>Foundation", body_style), Paragraph("• Scaffold React + Vite + Tailwind repository<br/>• Deploy Supabase Schema & Edge Function<br/>• Build LabEngine core + Level 1 & Level 5 end-to-end", body_style), Paragraph("Test answer checking security early; verify no keys leak in bundle.", body_style)],
    [Paragraph("Week 2<br/>Forensic Labs", body_style), Paragraph("• Implement Level 2 (WaveSurfer + Spectrogram sync)<br/>• Implement Level 3 (Video Differencing) & Level 4 (Stego)<br/>• Build Realtime Leaderboard + hint deduction logic", body_style), Paragraph("Precompute Level 2 spectrogram PNG offline to avoid browser audio stalls.", body_style)],
    [Paragraph("Week 3<br/>Advanced Math", body_style), Paragraph("• Implement Level 7 (Matrix Permutation Unscrambler)<br/>• Implement Level 8 (2D FFT Radial Masker using fft.js)<br/>• End-to-end dry run across all 8 individual modules", body_style), Paragraph("Keep Level 8 image resolution strictly to 256x256 power-of-2.", body_style)],
    [Paragraph("Week 4<br/>Meta-Boss & Polish", body_style), Paragraph("• Build Final Boss route + Prime-Reordering Vigenere solver<br/>• Conduct blind playtesting with non-developer students<br/>• Campus WiFi load testing & final asset freeze", body_style), Paragraph("Playtesting is non-negotiable: recalibrate hints if solve rate < 15%.", body_style)],
]

week_table = Table(week_data, colWidths=[70, 260, 174])
week_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
]))
tech_flowables.append(week_table)

tech_flowables.append(Spacer(1, 10))
tech_flowables.append(make_callout("Never commit production database answers into GitHub or client-side bundles. Always seed Supabase hashes right before event kickoff."))

build_pdf("File_Under_Mystery_Technical_Roadmap.pdf", tech_flowables)

# -------------------------------------------------------------
# 2. BUILD STORY & LORE DOSSIER PDF & MARKDOWN
# -------------------------------------------------------------
story_flowables = []

story_flowables.append(Paragraph("FILE UNDER MYSTERY", title_style))
story_flowables.append(Paragraph("Official Case Dossier: The Disappearance of Dr. Elias Marrow", subtitle_style))
story_flowables.append(HRFlowable(width="100%", thickness=1.5, color=C_AMBER, spaceAfter=12))

story_flowables.append(Paragraph("DEPARTMENT OF MATHEMATICS — INTERNAL INVESTIGATION MEMO", h1_style))
story_flowables.append(Paragraph("<b>CASE FILE:</b> #M-2026-0819<br/><b>SUBJECT:</b> Dr. Elias Marrow (Senior Faculty, Theoretical Mathematics)<br/><b>STATUS:</b> Missing (37 Days)", h2_style))

story_flowables.append(Paragraph(
    "Three weeks ago, Dr. Elias Marrow ceased attending department lectures and vanished from his office in Room 418. "
    "Campus security found his research laboratory completely vacated except for a single air-gapped, encrypted hard drive labelled <b>'BLACKBOX.DAT'</b>. "
    "When department technicians attempted to mount the filesystem, standard recovery tools failed. The drive refused conventional decryption keys.",
    body_style
))
story_flowables.append(Paragraph(
    "Instead, the drive's firmware operates on an active mathematical feedback loop. Each time an investigator proves mastery over a specific mathematical "
    "or digital-forensic anomaly, the system releases a single piece of recovered research evidence. Along with each evidence artifact comes an encrypted notebook fragment "
    "penned by Dr. Marrow prior to his disappearance.",
    body_style
))
story_flowables.append(Paragraph(
    "Eight distinct fragments exist. Until today, no investigation team has succeeded in assembling all eight. "
    "Your team has been authorized by the Department of Mathematics to examine the evidence, recover all fragments, and decipher the Marrow Conjecture.",
    body_style
))

story_flowables.append(Spacer(1, 8))
story_flowables.append(Paragraph("Evidence Items & Narrative Discoveries", h1_style))

lore_items = [
    ("Level 1: The Photograph (Evidence #01)", 
     "Recovered from Marrow's desk camera. A pitch-black photograph taken at 03:14 AM on the university perimeter. By performing histogram dynamic range stretching across pixel intensities [10,40], investigators reveal a timestamped coordinate token (A19X7) etched along the tree line.",
     "Notebook Fragment 1: 'I started numbering from the year I was born, not from zero.'"),
    
    ("Level 2: The Voicemail (Evidence #02)",
     "A distorted 40-second audio recording left on the departmental answering machine. While the audible voice track is garbled static (a deliberate trap), high-frequency spectrogram analysis reveals a pure 3000 Hz Morse code carrier transmission pulsing the token K4P82.",
     "Notebook Fragment 2: 'The second fragment always comes right after silence. Listen for the gap, not the sound.'"),

    ("Level 3: The Hallway Recording (Evidence #03)",
     "Corridor CCTV security footage. A 12-second handheld clip showing flickering fluorescent lights. Utilizing frame-difference analysis (|Frame_t - Frame_{t-1}|), Frame #142 flashes an anomaly on the bulletin board with a Base64-encoded string resolving to XT4Q1.",
     "Notebook Fragment 3: 'Three is a corner. Corners change direction.'"),

    ("Level 4: The Holiday Photo (Evidence #04)",
     "A seemingly innocuous personal photograph. Hidden within the least significant bit (LSB) plane of the Blue color channel is a compressed ZIP archive containing a linear equation (7x - 3 = 11x + 25) leading to x = -7, mapped to token M77RB.",
     "Notebook Fragment 4: 'Four hides inside what looks empty. So does the truth.'"),

    ("Level 5: The Numbers (Evidence #05)",
     "A text sheet recovered from Marrow's shredder bin with indices: 219, 163, 97, 59. Rather than simple Caesar shifts, these represent prime number indices (P_219, P_163, P_97, P_59 mod 26), yielding the key phrase 'POWER OF SEVEN' and code P0W3R.",
     "Notebook Fragment 5: 'Five is not a number. It is an order. Count the primes, not the digits.'"),

    ("Level 6: The Network Capture (Evidence #06)",
     "80 intercepted HTTP server logs. While 79 packets represent standard university traffic, one oversized packet carries an anomalous Authorization header with a Base32 token resolving to NT2K5.",
     "Notebook Fragment 6: 'Six was the year everything changed. Not the sixth thing I found.'"),

    ("Level 7: The Corrupted Scanned Page (Evidence #07)",
     "A corrupted scan of Marrow's hand-written journal. Applying an 8x8 block permutation inversion followed by matrix transposition and a 90-degree clockwise rotation reconstructs the legible text, spotlighting token BXZ19.",
     "Notebook Fragment 7: 'Seven pieces were never lost. They were only ever facing the wrong way.'"),

    ("Level 8: The Frequency Signal (Evidence #08)",
     "A synthetic noisy grayscale pattern. Performing a 2D Fast Fourier Transform exposes a distinct artificial ring in the frequency magnitude spectrum. Applying an annular bandpass filter and computing the 2D Inverse FFT reconstructs the watermark FIN4L.",
     "Notebook Fragment 8: 'Eight was never an end. Eight was where I started counting backward.'")
]

for title, desc, frag in lore_items:
    story_flowables.append(Paragraph(f"<b>{title}</b>", h2_style))
    story_flowables.append(Paragraph(desc, body_style))
    story_flowables.append(Paragraph(f"<i>{frag}</i>", callout_style))
    story_flowables.append(Spacer(1, 4))

story_flowables.append(Spacer(1, 6))
story_flowables.append(Paragraph("The Climax: The Final Meta-Assembly", h1_style))
story_flowables.append(Paragraph(
    "Upon solving all 8 levels, the team possesses 8 individual tokens and 8 notebook fragments. Fragment #5 (<i>'Count the primes, not the digits'</i>) "
    "reveals that the true sequence is determined by the prime order, while Fragment #8 (<i>'Where I started counting backward'</i>) dictates that the assembly must be reversed: "
    "<b>[Level 8] -> [Level 7] -> [Level 6] -> [Level 5] -> [Level 4] -> [Level 3] -> [Level 2] -> [Level 1]</b>.",
    body_style
))
story_flowables.append(Paragraph(
    "Concatenating the tokens in this exact sequence forms the master Vigenère key:<br/>"
    "<code>FIN4LBXZ19NT2K5P0W3RM77RBXT4Q1K4P82A19X7</code>",
    body_style
))
story_flowables.append(Paragraph(
    "Applying this key to the final locked drive transmission decodes Dr. Marrow's final confession:",
    body_style
))
story_flowables.append(make_callout(
    "\"THE CONJECTURE WAS NEVER FALSE — I JUST RAN OUT OF TIME\"",
    "DR. MARROW'S FINAL REVELATION"
))

build_pdf("File_Under_Mystery_Story_And_Lore.pdf", story_flowables)

# Also generate corresponding Markdown documents in docs/
with open(os.path.join(base_docs_dir, "FILE_UNDER_MYSTERY_TECHNICAL_ROADMAP.md"), "w", encoding="utf-8") as f:
    f.write("""# FILE UNDER MYSTERY — Technical Architecture & Build Roadmap
*VIT Mathematics Club Event Documentation*

## 1. Executive Summary
**File Under Mystery** is an interactive, browser-based digital forensics and applied mathematics investigation platform.

## 2. Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS + Lucide Icons
- **Audio & Signal:** wavesurfer.js, fft.js (2D FFT)
- **Math & Forensics:** mathjs, fflate (ZIP extractor in JS)
- **Backend & Auth:** Supabase (PostgreSQL, Realtime Leaderboard, Edge Functions)
- **Offline Pipeline:** Python 3.10+ (Pillow, NumPy, SciPy, Pydub, OpenCV)

## 3. Level Summary
- **Level 1 (Image):** Histogram dynamic range stretch [10,40] -> `A19X7`
- **Level 2 (Audio):** 3kHz Spectrogram Morse code pulse -> `K4P82`
- **Level 3 (Video):** Frame difference filter on strobe recording -> `XT4Q1`
- **Level 4 (Stego):** Blue channel bitplane 0 LSB extraction -> ZIP -> `M77RB`
- **Level 5 (Cipher):** Prime-indexed modular shift stream -> `P0W3R`
- **Level 6 (Network):** Triage packet size & inspect Base32 auth token -> `NT2K5`
- **Level 7 (Matrix):** 8x8 Permutation inversion + Transpose + 90° rotation -> `BXZ19`
- **Level 8 (Fourier):** 2D FFT Radial bandpass filter + IFFT -> `FIN4L`
- **Final Boss:** Reverse prime assembly [8..1] -> Vigenère decryption -> Final Truth

## 4. Execution Schedule
- **Week 1:** Scaffolding, Supabase DB & Edge Function, Shared LabEngine, Levels 1 & 5.
- **Week 2:** Audio (WaveSurfer) + Video (Diff) + Stego (LSB) + Realtime Leaderboard.
- **Week 3:** Matrix Permutation + 2D FFT Lab + Hint System + Internal Dry Run.
- **Week 4:** Final Boss assembly, Blind Playtesting with students, Campus WiFi load testing.
""")

with open(os.path.join(base_docs_dir, "FILE_UNDER_MYSTERY_STORY_AND_LORE.md"), "w", encoding="utf-8") as f:
    f.write("""# FILE UNDER MYSTERY — Story, Lore Dossier & Meta-Solution
*Department of Mathematics Internal Case File: Dr. Elias Marrow*

## The Lore
Dr. Elias Marrow, senior faculty in theoretical mathematics, vanished 37 days ago. His research drive `BLACKBOX.DAT` unlocks 8 fragments of evidence only when investigators prove their mastery over mathematical forensics.

## The 8 Recovered Artifacts & Fragments
1. **The Photograph:** `A19X7` — *"I started numbering from the year I was born, not from zero."*
2. **The Voicemail:** `K4P82` — *"The second fragment always comes right after silence. Listen for the gap, not the sound."*
3. **The Recording:** `XT4Q1` — *"Three is a corner. Corners change direction."*
4. **The Holiday Photo:** `M77RB` — *"Four hides inside what looks empty. So does the truth."*
5. **The Numbers:** `P0W3R` — *"Five is not a number. It is an order. Count the primes, not the digits."*
6. **The Capture:** `NT2K5` — *"Six was the year everything changed. Not the sixth thing I found."*
7. **The Corrupted Image:** `BXZ19` — *"Seven pieces were never lost. They were only ever facing the wrong way."*
8. **The Signal:** `FIN4L` — *"Eight was never an end. Eight was where I started counting backward."*

## The Meta Solution
- Order: Reversed Prime sequence $[8, 7, 6, 5, 4, 3, 2, 1]$.
- Master Key: `FIN4LBXZ19NT2K5P0W3RM77RBXT4Q1K4P82A19X7`
- Decrypted Message: `"THE CONJECTURE WAS NEVER FALSE — I JUST RAN OUT OF TIME"`
""")

print("[+] Created markdown docs and generated both ReportLab PDFs in docs/")
