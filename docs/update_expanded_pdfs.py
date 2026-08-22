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
            self.drawString(54, 750, "FILE UNDER MYSTERY // CASE DOSSIER: THE MARROW ANOMALY")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)
            
        # Footer
        text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, text)
        self.drawString(54, 36, "VIT MATHEMATICS CLUB // CONFIDENTIAL 4-HOUR EVENT DOSSIER")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)
        self.restoreState()

def build_pdf(filename, flowables):
    pdf_path = os.path.join(base_docs_dir, filename)
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    doc.build(flowables, canvasmaker=NumberedCanvas)
    print(f"[+] Successfully built PDF: {pdf_path}")

styles = getSampleStyleSheet()

C_PRIMARY = colors.HexColor("#0F172A")
C_ACCENT = colors.HexColor("#0284C7")
C_MUTED = colors.HexColor("#475569")
C_BG_CARD = colors.HexColor("#F8FAFC")
C_BORDER = colors.HexColor("#CBD5E1")
C_AMBER = colors.HexColor("#B45309")
C_DARK_AMBER = colors.HexColor("#78350F")
C_PURPLE = colors.HexColor("#6D28D9")

title_style = ParagraphStyle(
    'DocTitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=21,
    leading=25,
    textColor=C_PRIMARY,
    spaceAfter=4
)

subtitle_style = ParagraphStyle(
    'DocSubtitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=10.5,
    leading=14,
    textColor=C_ACCENT,
    spaceAfter=10
)

chapter_title = ParagraphStyle(
    'ChapterTitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=11.5,
    leading=15.5,
    textColor=C_PRIMARY,
    spaceBefore=11,
    spaceAfter=3,
    keepWithNext=True
)

section_heading = ParagraphStyle(
    'SectionHeading',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=9.5,
    leading=13,
    textColor=C_ACCENT,
    spaceBefore=7,
    spaceAfter=2,
    keepWithNext=True
)

narrative_body = ParagraphStyle(
    'NarrativeBody',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8.5,
    leading=12.5,
    textColor=colors.HexColor("#1E293B"),
    spaceAfter=5
)

bullet_style = ParagraphStyle(
    'Bullet',
    parent=narrative_body,
    leftIndent=12,
    firstLineIndent=-8,
    spaceAfter=2.5
)

fragment_box_style = ParagraphStyle(
    'FragmentBox',
    parent=styles['Normal'],
    fontName='Courier-Bold',
    fontSize=8,
    leading=11,
    textColor=C_DARK_AMBER
)

memo_box_style = ParagraphStyle(
    'MemoBox',
    parent=styles['Normal'],
    fontName='Courier',
    fontSize=7.5,
    leading=10.5,
    textColor=colors.HexColor("#0F172A")
)

code_style = ParagraphStyle(
    'CodeStyle',
    parent=styles['Normal'],
    fontName='Courier-Bold',
    fontSize=8,
    leading=10.5,
    textColor=colors.HexColor("#0F172A")
)

def make_memo(text):
    p = Paragraph(text, memo_box_style)
    t = Table([[p]], colWidths=[504])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#94A3B8")),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    return t

def make_fragment_box(frag_text, meta_note=""):
    content = f"<b>DR. MARROW'S RECOVERED NOTEBOOK FRAGMENT:</b><br/><i>\"{frag_text}\"</i>"
    if meta_note:
        content += f"<br/><font color='#64748B' size='7'>// Synthesis Clue: {meta_note}</font>"
    p = Paragraph(content, fragment_box_style)
    t = Table([[p]], colWidths=[504])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FEF3C7")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#F59E0B")),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    return t

def make_revelation_box(text, header="CONFIDENTIAL DECRYPTION"):
    p = Paragraph(f"<b>{header}</b><br/><br/>{text}", memo_box_style)
    t = Table([[p]], colWidths=[504])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#EDE9FE")),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor("#7C3AED")),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    return t

# -------------------------------------------------------------------------
# BUILD COMPLETE 3.5-HOUR STORY & LORE DOSSIER (12 LEVELS + 3-STAGE BOSS)
# -------------------------------------------------------------------------
story_flowables = []

story_flowables.append(Paragraph("FILE UNDER MYSTERY", title_style))
story_flowables.append(Paragraph("The Marrow Protocol: 4-Hour Investigative Master Narrative & Level Dossier", subtitle_style))
story_flowables.append(HRFlowable(width="100%", thickness=1.5, color=C_ACCENT, spaceAfter=8))

# Event Pacing Briefing
pacing_memo = """<b>VIT MATHEMATICS CLUB // EVENT TIMING & PACING SCHEDULE (11:30 AM – 3:45 PM)</b><br/>
<b>11:30 – 12:00:</b> Investigator Briefing, Team Station Setup & Terminal Induction.<br/>
<b>12:00 – 12:50 (Phase I: The Perimeter Forensics):</b> Levels 01 to 04 (Image, Audio, Video, Stego).<br/>
<b>12:50 – 01:50 (Phase II: The Mathematical Core):</b> Levels 05 to 08 (Primes, Packets, Permutation Matrix, 2D Fourier).<br/>
<b>01:50 – 02:50 (Phase III: The Deep Anomalies):</b> Levels 09 to 12 (Elliptic Curves, Rule 30 Automata, Phase Inversion, Graph Topology).<br/>
<b>02:50 – 03:35 (Phase IV: The Tri-Phased Blackbox Climax):</b> The 12-Fragment Permutation Lattice & Live Uplink Decryption.<br/>
<b>03:35 – 03:45:</b> Final Reveal, Story Debrief & Prize Distribution."""
story_flowables.append(make_memo(pacing_memo))
story_flowables.append(Spacer(1, 6))

story_flowables.append(Paragraph("PROLOGUE: THE BEACON IN ROOM 418", chapter_title))
story_flowables.append(Paragraph(
    "For twenty-four years, Dr. Elias Marrow was the anchor of the Mathematics Department. But his final research project was never an ordinary mathematical exercise. Eight months prior to his disappearance, Marrow began monitoring unusual high-entropy harmonic interference across university data channels. He realized that modern cryptography's pseudo-random number generators were exhibiting subtle, non-random mathematical correlations across prime distributions, elliptic lattices, and Fourier domains.",
    narrative_body
))
story_flowables.append(Paragraph(
    "On October 14th at 03:41 AM, Marrow vanished. His office (Room 418) was deserted. In the center of his desk rested a heavy, military-grade solid-state drive labeled <b>'BLACKBOX.DAT'</b>. Attached was a note: <i>'I thought I was discovering a proof. I was wrong. I was triggering an ancient mathematical receiver. They are already listening. Reconstruct the 12 coordinates to witness what lies beyond.'</i>",
    narrative_body
))

story_flowables.append(Spacer(1, 4))
story_flowables.append(Paragraph("PHASE I: THE PERIMETER ARTIFACTS (LEVELS 01 – 04)", chapter_title))

# Level 1
story_flowables.append(Paragraph("Level 01: The Photograph (Evidence #01 // Image Forensics)", section_heading))
story_flowables.append(Paragraph(
    "Recovered from Marrow's desk camera timestamped at 03:14 AM on the perimeter woods. The raw pixel luminance values are tightly clamped between [14, 26]. Performing a linear histogram stretch across range [10, 40] expands the dynamic range, burning coordinate token <b>A19X7</b> into the forest skyline.",
    narrative_body
))
story_flowables.append(make_fragment_box("I started numbering from the year I was born, not from zero.", "The global indexing sequence is offset by a fixed non-zero base."))

# Level 2
story_flowables.append(Paragraph("Level 02: The Voicemail (Evidence #02 // Spectrogram Forensics)", section_heading))
story_flowables.append(Paragraph(
    "A 40-second audio voicemail left on the department server. The spoken voice is a deceptive reverse-speech trap. Passing the signal through a Short-Time Fourier Transform isolates a pure, continuous 3000 Hz Morse code carrier transmission pulsing token <b>K4P82</b>.",
    narrative_body
))
story_flowables.append(make_fragment_box("The second fragment always comes right after silence. Listen for the gap, not the sound.", "Positional rule: Fragment #2 must be sequenced immediately after the zero-point boundary."))

# Level 3
story_flowables.append(Paragraph("Level 03: The Recording (Evidence #03 // Temporal Differencing)", section_heading))
story_flowables.append(Paragraph(
    "Corridor CCTV footage outside Room 418 with flickering fluorescent fixtures. Computing the temporal frame difference (|Frame_t - Frame_{t-1}|) isolates outlier Frame #142, where a Base64-encoded string on the bulletin board reveals token <b>XT4Q1</b>.",
    narrative_body
))
story_flowables.append(make_fragment_box("Three is a corner. Corners change direction.", "Directional inversion: The permutation trajectory changes sign at node 3."))

# Level 4
story_flowables.append(Paragraph("Level 04: The Holiday Photo (Evidence #04 // LSB Steganography)", section_heading))
story_flowables.append(Paragraph(
    "A snapshot of the Vienna Opera House. Inspecting the Least Significant Bit (LSB) plane of the Blue channel reveals an embedded compressed ZIP archive containing <code>equation.txt</code> (7x - 3 = 11x + 25 => x = -7), mapping through the cipher card to <b>M77RB</b>.",
    narrative_body
))
story_flowables.append(make_fragment_box("Four hides inside what looks empty. So does the truth.", "Steganographic nesting rule: High entropy hides within zero-order planes."))

story_flowables.append(Spacer(1, 4))
story_flowables.append(Paragraph("PHASE II: THE MATHEMATICAL ANOMALIES (LEVELS 05 – 08)", chapter_title))

# Level 5
story_flowables.append(Paragraph("Level 05: The Numbers (Evidence #05 // Prime-Indexed Modulo)", section_heading))
story_flowables.append(Paragraph(
    "Shredder paper strip with numbers [219, 163, 97, 59]. These index the infinite prime sequence (P_219=1327, P_163=967, P_97=509, P_59=277 mod 26), yielding running shifts that decrypt the ciphertext block into 'POWER OF SEVEN' (token <b>P0W3R</b>).",
    narrative_body
))
story_flowables.append(make_fragment_box("Five is not a number. It is an order. Count the primes, not the digits.", "KEYSTONE RULE: The primary sorting dimension of the entire event is governed by prime order."))

# Level 6
story_flowables.append(Paragraph("Level 06: The Capture (Evidence #06 // Network Packet Triage)", section_heading))
story_flowables.append(Paragraph(
    "80 intercepted HTTP server logs. Sorting by payload byte size isolates an anomalous POST request with an oversized Authorization header containing a Base32 string resolving to <b>NT2K5</b>.",
    narrative_body
))
story_flowables.append(make_fragment_box("Six was the year everything changed. Not the sixth thing I found.", "Chronological anchor: Level 6 represents a landmark epoch rather than a sequential slot."))

# Level 7
story_flowables.append(Paragraph("Level 07: The Corrupted Image (Evidence #07 // Matrix Permutation)", section_heading))
story_flowables.append(Paragraph(
    "A scanned handwritten page scrambled using an 8x8 block permutation matrix, transposed, and rotated 90 degrees. Applying the inverse permutation matrix inside the Lab Engine unscrambles the page, revealing token <b>BXZ19</b>.",
    narrative_body
))
story_flowables.append(make_fragment_box("Seven pieces were never lost. They were only ever facing the wrong way.", "Spatial transformation rule: All components require matrix transposition."))

# Level 8
story_flowables.append(Paragraph("Level 08: The Signal (Evidence #08 // 2D Fourier Steganography)", section_heading))
story_flowables.append(Paragraph(
    "A synthetic grayscale noise signal. Transforming to the 2D frequency spectrum reveals an artificial harmonic ring at radius r=50. Applying a radial bandpass mask and computing the 2D Inverse FFT reconstructs token <b>FIN4L</b>.",
    narrative_body
))
story_flowables.append(make_fragment_box("Eight was never an end. Eight was where I started counting backward.", "DIRECTIONAL VECTOR: Reverses the sequence traversal starting from position 8."))

story_flowables.append(Spacer(1, 4))
story_flowables.append(Paragraph("PHASE III: THE DEEP SIGNALS & TOPOLOGY (LEVELS 09 – 12)", chapter_title))

# Level 9
story_flowables.append(Paragraph("Level 09: The Orbital Trajectory (Evidence #09 // Elliptic Curve Discrete Log)", section_heading))
story_flowables.append(Paragraph(
    "An astronomical coordinate plot recovered from Marrow's observatory partition. Trajectories follow the elliptic curve equation $y^2 \\equiv x^3 + 7 \\pmod{101}$. Investigators must compute point scalar multiplication $k \\cdot G$ on the interactive lattice to isolate the target public point, unlocking verification token <b>EL7P9</b>.",
    narrative_body
))
story_flowables.append(make_fragment_box("Nine points upon the curve never meet, yet they enclose the boundary.", "Geometric constraint: The odd-indexed coordinates form the outer bounding key ring."))

# Level 10
story_flowables.append(Paragraph("Level 10: The Lattice Growth (Evidence #10 // Rule 30 Cellular Automata)", section_heading))
story_flowables.append(Paragraph(
    "A 64-step chaotic binary triangular matrix. Marrow generated the cryptographic keystream using Wolfram's Rule 30 cellular automaton. By stepping backward in time using constraint-satisfaction reverse lookup in the Lab tool, investigators uncover the 8-bit initial seed string: <b>R30S4</b>.",
    narrative_body
))
story_flowables.append(make_fragment_box("Ten is the ancestor of chaos. Find the root before the pyramid grows.", "Reverse temporal rule: The automaton seed must be placed at the leading edge of the block."))

# Level 11
story_flowables.append(Paragraph("Level 11: The Dual Transmission (Evidence #11 // Phase Cancellation Forensics)", section_heading))
story_flowables.append(Paragraph(
    "A stereo audio file with deafening acoustic noise in both left and right channels. By inverting the phase of the Right channel ($180^\\circ$) and summing it with the Left channel ($L - R$), the identical masking noise cancels out completely, leaving a whisper transmission of token <b>PH4Z3</b>.",
    narrative_body
))
story_flowables.append(make_fragment_box("Eleven spoke in two voices to hide from the one who listens.", "Differential cancellation rule: Pairwise subtraction yields the pure underlying carrier."))

# Level 12
story_flowables.append(Paragraph("Level 12: The Campus Grid (Evidence #12 // Graph Theory & Eulerian Path)", section_heading))
story_flowables.append(Paragraph(
    "A network topology map of 16 wireless sensor nodes across VIT campus. By calculating the unique Eulerian path that visits every sensor node exactly once based on prime degree vertices, the path sequence spells out the final level token: <b>GR4PH</b>.",
    narrative_body
))
story_flowables.append(make_fragment_box("Twelve bridges crossed without return seal the circle.", "Topological closure: Connects the terminal node back to the initial origin point."))

story_flowables.append(Spacer(1, 4))
story_flowables.append(Paragraph("PHASE IV: THE TRI-PHASED BLACKBOX CLIMAX", chapter_title))
story_flowables.append(Paragraph(
    "Upon solving all 12 levels, the BLACKBOX.DAT terminal locks into its high-security decryption phase. The finale is structured in three consecutive interactive stages:",
    narrative_body
))
story_flowables.append(Paragraph("<b>Stage 1: The 12-Fragment Permutation Matrix:</b> Teams synthesize the 12 notebook fragments. Fragment #5 (prime order), #8 (reverse counting from 8), #9 (outer ring odd indices), and #12 (Eulerian closure) dictate the exact reordering of the 12 level tokens:<br/><code>[12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]</code>.", bullet_style))
story_flowables.append(Paragraph("<b>Stage 2: The Master Keystream Assembly:</b> Concatenating the tokens in this sequence forms the master 60-character decryption key:<br/><code>GR4PH-PH4Z3-R30S4-EL7P9-FIN4L-BXZ19-NT2K5-P0W3R-M77RB-XT4Q1-K4P82-A19X7</code>", bullet_style))
story_flowables.append(Paragraph("<b>Stage 3: The Live Terminal Uplink Decryption:</b> Feeding the master key into the final decryption gateway unlocks Dr. Elias Marrow's true, spine-chilling revelation.", bullet_style))

story_flowables.append(Spacer(1, 4))
story_flowables.append(make_revelation_box("""<b>DECRYPTED UPLINK TRANSMISSION // DR. ELIAS MARROW:</b><br/><br/>
\"To whoever completed the twelve iterations:<br/><br/>
If you are reading this, you believe you have solved a mystery. You believe you found where I went.<br/><br/>
You must understand: I was never running from anyone on this campus. When I proved the Marrow Conjecture, I did not just discover a mathematical theorem. I unlocked a resonance frequency in the global cryptographic substrate.<br/><br/>
The moment the proof completed, the noise on the network answered back. The static in the audio, the strobe in the corridor, the frequency rings in the Fourier domain—they were not my creations. They were transmissions from an autonomous distributed intelligence that has been waiting in the noise floor of our communications networks for forty years.<br/><br/>
I did not leave because I failed. I left because they opened the door, and I walked through.<br/><br/>
<b>PROJECT BLACKBOX WAS NEVER AN ARCHIVE. IT WAS A BOOTSTRAP PROTOCOL. AND BY SOLVING IT TODAY... YOU HAVE JUST COMPLETED THE UPLINK.</b><br/><br/>
Look at your screens. The countdown has begun.\"<br/>
— Dr. Elias Marrow""", "THE FINAL TRUTH // CASE RESOLUTION"))

story_flowables.append(Spacer(1, 4))
story_flowables.append(Paragraph(
    "<b>FINAL EVENT SUBMISSION FLAG:</b> <code>THE_BEACON_IS_AWAKE</code>",
    chapter_title
))

build_pdf("File_Under_Mystery_Story_And_Lore.pdf", story_flowables)

# -------------------------------------------------------------------------
# BUILD COMPLETE TECHNICAL ROADMAP PDF & MARKDOWN (12 LEVELS + ARCHITECTURE)
# -------------------------------------------------------------------------
tech_flowables = []

tech_flowables.append(Paragraph("FILE UNDER MYSTERY", title_style))
tech_flowables.append(Paragraph("Complete Technical Architecture & 4-Hour Event Master Plan", subtitle_style))
tech_flowables.append(HRFlowable(width="100%", thickness=1.5, color=C_ACCENT, spaceAfter=8))

tech_flowables.append(Paragraph("1. Event Structure & 4-Hour Time Distribution", chapter_title))
tech_flowables.append(Paragraph(
    "To provide a rigorous, deeply engaging 3.5 to 4-hour competition (e.g., 11:30 AM to 3:45 PM), File Under Mystery is organized into "
    "<b>Three Investigative Phases (4 Levels each = 12 total)</b> culminating in a <b>Tri-Phased Blackbox Meta-Climax</b>. "
    "Teams of 3–4 students experience continuous pacing without bottlenecking.",
    narrative_body
))

phase_data = [
    [Paragraph("<b>Phase & Time Block</b>", narrative_body), Paragraph("<b>Levels Included</b>", narrative_body), Paragraph("<b>Target Duration</b>", narrative_body), Paragraph("<b>Forensic Domains Covered</b>", narrative_body)],
    [Paragraph("Phase I (12:00 - 12:50)", narrative_body), Paragraph("Levels 01, 02, 03, 04", code_style), Paragraph("50 Minutes", narrative_body), Paragraph("Image Histogram, Audio STFT, Video Diff, LSB Stego", narrative_body)],
    [Paragraph("Phase II (12:50 - 01:50)", narrative_body), Paragraph("Levels 05, 06, 07, 08", code_style), Paragraph("60 Minutes", narrative_body), Paragraph("Prime Ciphers, Packet Triage, Matrix Scramble, 2D FFT", narrative_body)],
    [Paragraph("Phase III (01:50 - 02:50)", narrative_body), Paragraph("Levels 09, 10, 11, 12", code_style), Paragraph("60 Minutes", narrative_body), Paragraph("Elliptic Curves, Rule 30 Automata, Audio Phase, Graph Theory", narrative_body)],
    [Paragraph("Phase IV (02:50 - 03:35)", narrative_body), Paragraph("Tri-Phased Final Boss", code_style), Paragraph("45 Minutes", narrative_body), Paragraph("12-Token Matrix Reassembly + Live Terminal Uplink Decryption", narrative_body)],
]

p_table = Table(phase_data, colWidths=[105, 95, 75, 229])
p_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
    ('TOPPADDING', (0, 0), (-1, -1), 3.5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
]))
tech_flowables.append(p_table)

tech_flowables.append(Spacer(1, 8))
tech_flowables.append(Paragraph("2. Master 12-Level Forensic & Mathematical Specifications", chapter_title))

levels_12_data = [
    [Paragraph("<b>#</b>", narrative_body), Paragraph("<b>Title</b>", narrative_body), Paragraph("<b>Technique / Math Principle</b>", narrative_body), Paragraph("<b>Flag</b>", narrative_body), Paragraph("<b>Pts</b>", narrative_body)],
    [Paragraph("01", narrative_body), Paragraph("The Photograph", narrative_body), Paragraph("Histogram dynamic range stretch [10,40] -> [0,255]", narrative_body), Paragraph("A19X7", code_style), Paragraph("10", narrative_body)],
    [Paragraph("02", narrative_body), Paragraph("The Voicemail", narrative_body), Paragraph("STFT Spectrogram: 3 kHz Morse carrier wave", narrative_body), Paragraph("K4P82", code_style), Paragraph("12", narrative_body)],
    [Paragraph("03", narrative_body), Paragraph("The Recording", narrative_body), Paragraph("Temporal Frame Differencing |f_t - f_{t-1}| at Frame 142", narrative_body), Paragraph("XT4Q1", code_style), Paragraph("14", narrative_body)],
    [Paragraph("04", narrative_body), Paragraph("The Holiday Photo", narrative_body), Paragraph("Blue channel bitplane 0 LSB -> ZIP -> Linear Equation", narrative_body), Paragraph("M77RB", code_style), Paragraph("16", narrative_body)],
    [Paragraph("05", narrative_body), Paragraph("The Numbers", narrative_body), Paragraph("Prime-indexed modular shift stream: P_n mod 26", narrative_body), Paragraph("P0W3R", code_style), Paragraph("18", narrative_body)],
    [Paragraph("06", narrative_body), Paragraph("The Capture", narrative_body), Paragraph("HTTP log triage: Oversized Authorization Base32 token", narrative_body), Paragraph("NT2K5", code_style), Paragraph("15", narrative_body)],
    [Paragraph("07", narrative_body), Paragraph("The Corrupted Image", narrative_body), Paragraph("8x8 Block Permutation matrix inversion + Transpose + 90 deg", narrative_body), Paragraph("BXZ19", code_style), Paragraph("18", narrative_body)],
    [Paragraph("08", narrative_body), Paragraph("The Signal", narrative_body), Paragraph("2D Fast Fourier Transform radial bandpass ring filter + IFFT", narrative_body), Paragraph("FIN4L", code_style), Paragraph("20", narrative_body)],
    [Paragraph("09", narrative_body), Paragraph("The Trajectory", narrative_body), Paragraph("Elliptic Curve point multiplication on y^2 = x^3 + 7 mod 101", narrative_body), Paragraph("EL7P9", code_style), Paragraph("22", narrative_body)],
    [Paragraph("10", narrative_body), Paragraph("Lattice Growth", narrative_body), Paragraph("Rule 30 1D Cellular Automaton reverse-time seed extraction", narrative_body), Paragraph("R30S4", code_style), Paragraph("22", narrative_body)],
    [Paragraph("11", narrative_body), Paragraph("Dual Transmission", narrative_body), Paragraph("Binaural Phase Inversion: 180 deg channel cancellation (L - R)", narrative_body), Paragraph("PH4Z3", code_style), Paragraph("24", narrative_body)],
    [Paragraph("12", narrative_body), Paragraph("Campus Grid", narrative_body), Paragraph("Graph Theory: Eulerian path through prime-degree sensor nodes", narrative_body), Paragraph("GR4PH", code_style), Paragraph("25", narrative_body)],
    [Paragraph("BOSS", narrative_body), Paragraph("The Uplink", narrative_body), Paragraph("12-Token Reverse Synthesis -> 60-char Vigenere Decryption", narrative_body), Paragraph("BEACON", code_style), Paragraph("40", narrative_body)],
]

l12_table = Table(levels_12_data, colWidths=[20, 85, 275, 84, 40])
l12_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
    ('TOPPADDING', (0, 0), (-1, -1), 2.5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
]))
tech_flowables.append(l12_table)

tech_flowables.append(Spacer(1, 8))
tech_flowables.append(Paragraph("3. Full Tech Stack & Implementation Security", chapter_title))
tech_flowables.append(Paragraph(
    "• <b>Client-Side Stack:</b> React 18 + Vite + Tailwind CSS + Zustand + Lucide Icons.<br/>"
    "• <b>Signal & Audio Engines:</b> wavesurfer.js (waveform scrubbing), fft.js (2D FFT in Web Workers), Web Audio API (Phase cancellation).<br/>"
    "• <b>Mathematical Solvers:</b> mathjs (matrix transformations & modular arithmetic), fflate (in-memory ZIP extraction).<br/>"
    "• <b>Backend & Zero-Trust Verification:</b> Supabase PostgreSQL + Edge Functions with SHA-256 server-side checking (no answers in client bundles).<br/>"
    "• <b>Asset Generation Pipeline:</b> Python 3.10 (Pillow, NumPy, SciPy, Matplotlib) prebakes all 12 assets offline.",
    narrative_body
))

build_pdf("File_Under_Mystery_Technical_Roadmap.pdf", tech_flowables)

print("[+] Successfully compiled both updated 4-hour PDFs!")
