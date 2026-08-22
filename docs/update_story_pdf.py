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
            self.drawString(54, 750, "FILE UNDER MYSTERY // CASE DOSSIER: DR. ELIAS MARROW")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)
            
        # Footer
        text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, text)
        self.drawString(54, 36, "VIT MATHEMATICS CLUB // FORENSICS INVESTIGATION UNIT")
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

styles = getSampleStyleSheet()

C_PRIMARY = colors.HexColor("#0F172A")
C_ACCENT = colors.HexColor("#0284C7")
C_MUTED = colors.HexColor("#475569")
C_BG_CARD = colors.HexColor("#F8FAFC")
C_BORDER = colors.HexColor("#CBD5E1")
C_AMBER = colors.HexColor("#B45309")
C_DARK_AMBER = colors.HexColor("#78350F")

title_style = ParagraphStyle(
    'DocTitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=22,
    leading=26,
    textColor=C_PRIMARY,
    spaceAfter=4
)

subtitle_style = ParagraphStyle(
    'DocSubtitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=11,
    leading=15,
    textColor=C_ACCENT,
    spaceAfter=12
)

chapter_title = ParagraphStyle(
    'ChapterTitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=13,
    leading=17,
    textColor=C_PRIMARY,
    spaceBefore=14,
    spaceAfter=4,
    keepWithNext=True
)

section_heading = ParagraphStyle(
    'SectionHeading',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=10,
    leading=14,
    textColor=C_ACCENT,
    spaceBefore=8,
    spaceAfter=3,
    keepWithNext=True
)

narrative_body = ParagraphStyle(
    'NarrativeBody',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=9,
    leading=13.5,
    textColor=colors.HexColor("#1E293B"),
    spaceAfter=6
)

bullet_style = ParagraphStyle(
    'Bullet',
    parent=narrative_body,
    leftIndent=12,
    firstLineIndent=-8,
    spaceAfter=3
)

narrative_quote = ParagraphStyle(
    'NarrativeQuote',
    parent=styles['Normal'],
    fontName='Helvetica-Oblique',
    fontSize=8.5,
    leading=12.5,
    textColor=colors.HexColor("#334155")
)

fragment_box_style = ParagraphStyle(
    'FragmentBox',
    parent=styles['Normal'],
    fontName='Courier-Bold',
    fontSize=8.5,
    leading=12,
    textColor=C_DARK_AMBER
)

memo_box_style = ParagraphStyle(
    'MemoBox',
    parent=styles['Normal'],
    fontName='Courier',
    fontSize=8,
    leading=11,
    textColor=colors.HexColor("#0F172A")
)

def make_memo(text):
    p = Paragraph(text, memo_box_style)
    t = Table([[p]], colWidths=[504])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#94A3B8")),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    return t

def make_fragment_box(frag_text, meta_note=""):
    content = f"<b>DR. MARROW'S RECOVERED NOTEBOOK FRAGMENT:</b><br/><i>\"{frag_text}\"</i>"
    if meta_note:
        content += f"<br/><font color='#64748B' size='7.5'>// Cryptographic Synthesis Note: {meta_note}</font>"
    p = Paragraph(content, fragment_box_style)
    t = Table([[p]], colWidths=[504])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FEF3C7")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#F59E0B")),
        ('LEFTPADDING', (0, 0), (-1, -1), 9),
        ('RIGHTPADDING', (0, 0), (-1, -1), 9),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    return t

# -------------------------------------------------------------
# STORY NARRATIVE GENERATION
# -------------------------------------------------------------
story_flowables = []

# Title Banner
story_flowables.append(Paragraph("FILE UNDER MYSTERY", title_style))
story_flowables.append(Paragraph("The Chronicle of the Marrow Conjecture: Complete Investigative Narrative Dossier", subtitle_style))
story_flowables.append(HRFlowable(width="100%", thickness=1.5, color=C_ACCENT, spaceAfter=10))

# Prologue
memo_text = """<b>CONFIDENTIAL // DEPARTMENT OF MATHEMATICS INTERNAL MEMORANDUM</b><br/>
<b>DATE:</b> October 14, 2026 | 08:30 IST<br/>
<b>FROM:</b> Office of the Department Chair, Applied Mathematics & Computing<br/>
<b>TO:</b> Special Student Forensics Investigation Task Force<br/>
<b>SUBJECT:</b> CASE #M-2026-0819: Disappearance of Dr. Elias Marrow (Missing 37 Days)"""
story_flowables.append(make_memo(memo_text))
story_flowables.append(Spacer(1, 8))

story_flowables.append(Paragraph("PROLOGUE: THE SILENCE IN ROOM 418", chapter_title))
story_flowables.append(Paragraph(
    "Dr. Elias Marrow was not a man prone to eccentricity or theatrics. For twenty-four years, his presence in the Mathematics Department was as reliable as the fundamental theorem of calculus: 8:00 AM lecture on analytic number theory, 11:30 AM departmental tea, 2:00 PM research seminars on dynamical systems. He was revered, quiet, and obsessively meticulous.",
    narrative_body
))
story_flowables.append(Paragraph(
    "That changed eight months ago when Marrow published a brief, four-page preprint titled <i>'On the Invariant Structure of Non-Trivial Zero Distributions in Multi-Dimensional Harmonic Spaces'</i> — what his graduate students colloquially termed <b>'The Marrow Conjecture'</b>. The paper claimed that prime distributions and cryptographic entropy were not chaotic anomalies, but deterministic harmonic projections of a single unified matrix transformation. In the mathematics community, proving the conjecture would shatter modern asymmetric cryptography.",
    narrative_body
))
story_flowables.append(Paragraph(
    "Then, thirty-seven days ago, Dr. Marrow vanished. His apartment was undisturbed; his passport remained in his desk drawer. In his campus office (Room 418), the chalkboards had been scrubbed clean. On his desk sat a single air-gapped, custom-machined solid-state drive labeled in faded silver ink: <b>'BLACKBOX.DAT'</b>.",
    narrative_body
))
story_flowables.append(Paragraph(
    "When cybersecurity technicians attempted to read the drive, every standard filesystem tool crashed. The drive possessed a custom hardware cryptographic controller that refused master keys. Instead, the firmware broadcasted a single console prompt: <i>'A proof is not given; it is earned. Provide evidence of understanding, and the archive shall yield.'</i>",
    narrative_body
))
story_flowables.append(Paragraph(
    "The drive has begun releasing eight encrypted evidence artifacts, one after another. Along with each evidence artifact lies a cryptic fragment from Dr. Marrow's lost handwritten diary. Your team has been formally designated as the independent investigative task force. You are not solving puzzles—you are reconstructing a crime scene of pure mathematics.",
    narrative_body
))

story_flowables.append(Spacer(1, 8))

# Level 1
story_flowables.append(Paragraph("CHAPTER 1: THE PHOTOGRAPH IN THE SHADOWS (LEVEL 1)", chapter_title))
story_flowables.append(Paragraph(
    "The first artifact released by the drive was a digital image file retrieved from an old compact digital camera discovered in Marrow's desk: <code>forest.png</code>. Campus security timestamps indicated it was captured at 03:14 AM on the night of his disappearance along the darkened perimeter woods behind the Technology Tower.",
    narrative_body
))
story_flowables.append(Paragraph(
    "To the untrained eye, the image appears pitch black—a corrupted or unexposed photographic failure. But when forensic investigators examined the raw pixel matrix, the red, green, and blue values were not zero. They were tightly clamped between values 14 and 26. Dr. Marrow had deliberately compressed the dynamic range of an encoded text string into near-invisible luminance variations. By applying a linear histogram stretch across the narrow band, the darkness recedes, revealing a five-character coordinate verification token etched against the distant tree line.",
    narrative_body
))
story_flowables.append(make_fragment_box(
    "I started numbering from the year I was born, not from zero.",
    "Indicates that the sequence numbering system is shifted/offset by a fundamental non-zero index."
))

story_flowables.append(Spacer(1, 8))

# Level 2
story_flowables.append(Paragraph("CHAPTER 2: THE MIDNIGHT VOICEMAIL (LEVEL 2)", chapter_title))
story_flowables.append(Paragraph(
    "Forty-eight hours after the photo was recovered, the department's automated voicemail server logged an incoming call from an untraceable VoIP node: <code>voicemail.wav</code>. The call lasted exactly forty seconds.",
    narrative_body
))
story_flowables.append(Paragraph(
    "Playing the recording yields a chilling, garbled acoustic mess—heavy static, wind noise, and what sounds like Dr. Marrow's voice played backward in disjointed fragments. Several junior analysts spent days trying to reverse and slow down the vocal audio, falling into a deliberate trap. The spoken voice is pure decoy.",
    narrative_body
))
story_flowables.append(Paragraph(
    "When the signal is passed through a Short-Time Fourier Transform (STFT) into the frequency domain, a pristine horizontal line pulses steadily at exactly 3000 Hz, unperturbed by the acoustic chaos below it. A high-pass filter isolates this pure carrier wave: a rhythmic series of short and long pulses transmitting Morse code directly into the spectrogram viewport.",
    narrative_body
))
story_flowables.append(make_fragment_box(
    "The second fragment always comes right after silence. Listen for the gap, not the sound.",
    "A positional relative-ordering rule: Fragment #2 must be sequenced immediately after the designated silent boundary."
))

story_flowables.append(Spacer(1, 8))

# Level 3
story_flowables.append(Paragraph("CHAPTER 3: THE CORRIDOR GHOST FRAME (LEVEL 3)", chapter_title))
story_flowables.append(Paragraph(
    "The third piece of evidence came from the Department of Mathematics' corridor CCTV cameras: <code>hallway.mp4</code>. The 12-second clip shows the hallway outside Room 418 at midnight. The overhead fluorescent fixtures flicker erratically with an eerie 60 Hz buzz.",
    narrative_body
))
story_flowables.append(Paragraph(
    "Watching the video at normal speed reveals nothing unusual—just shadows moving across linoleum. But fluorescent tubes do not flicker randomly; Marrow had spliced into the building's ballast control. By computing the absolute temporal difference between consecutive video frames (|Frame_t - Frame_{t-1}|), Frame #142 suddenly flashes blinding white.",
    narrative_body
))
story_flowables.append(Paragraph(
    "For exactly one-thirtieth of a second, the departmental bulletin board in the frame displays a high-contrast printed paper containing a Base64-encoded string, invisible to human perception during continuous playback.",
    narrative_body
))
story_flowables.append(make_fragment_box(
    "Three is a corner. Corners change direction.",
    "A directional inversion clue: the progression vector changes direction at index 3."
))

story_flowables.append(Spacer(1, 8))

# Level 4
story_flowables.append(Paragraph("CHAPTER 4: THE VACATION IN VIENNA (LEVEL 4)", chapter_title))
story_flowables.append(Paragraph(
    "Investigators searching Marrow's cloud backups found an image titled <code>holiday.png</code>, an ordinary snapshot of the Vienna Opera House taken during the 2018 International Congress of Mathematicians. On the surface, it is a standard 24-bit RGB photograph.",
    narrative_body
))
story_flowables.append(Paragraph(
    "However, an entropy scan across color channels revealed an anomaly: while natural photographic color channels exhibit Gaussian noise distributions with varying entropy across skies and textures, the Least Significant Bit (LSB) plane of the Blue channel showed flat, uniform entropy of 7.99 bits/byte. Dr. Marrow had replaced the least significant bit of every blue pixel with the raw binary stream of a compressed ZIP archive. Extracting the bitplane yields a password-less archive containing a single file: <code>equation.txt</code>.",
    narrative_body
))
story_flowables.append(make_fragment_box(
    "Four hides inside what looks empty. So does the truth.",
    "Reinforces the concept of steganographic nesting: do not judge structural order by surface appearance."
))

story_flowables.append(Spacer(1, 8))

# Level 5
story_flowables.append(Paragraph("CHAPTER 5: THE SHREDDER RESIDUE (LEVEL 5)", chapter_title))
story_flowables.append(Paragraph(
    "In the wastebasket beside Marrow's office desk, forensic teams pieced together a narrow strip of paper rescued from his cross-cut shredder. On it were printed four large numbers: <b>219, 163, 97, 59</b>, accompanied by an apparent ciphertext sentence: <code>WKH DQVZHU LV KLGGHQ</code>.",
    narrative_body
))
story_flowables.append(Paragraph(
    "Novice decoders immediately recognized the sentence as a standard Caesar shift (+3: 'THE ANSWER IS HIDDEN'). But submitting this yielded rejection. The easy sentence was an intentional honeypot designed to weed out superficial thinkers.",
    narrative_body
))
story_flowables.append(Paragraph(
    "The real mathematical key lay in the four numbers. They were not shifts; they were ordinal indices into the infinite sequence of prime numbers (P_219 = 1327, P_163 = 967, P_97 = 509, P_59 = 277). Computing each prime modulo 26 generates a running key stream that unlocks the secondary, true ciphertext block into the phrase 'POWER OF SEVEN'.",
    narrative_body
))
story_flowables.append(make_fragment_box(
    "Five is not a number. It is an order. Count the primes, not the digits.",
    "THE MASTER KEYSTONE CLUE: Dictates that the entire sequence of 8 levels must be reordered according to primality."
))

story_flowables.append(Spacer(1, 8))

# Level 6
story_flowables.append(Paragraph("CHAPTER 6: THE SERVER ROOM INTERCEPTION (LEVEL 6)", chapter_title))
story_flowables.append(Paragraph(
    "On the twenty-second day of the investigation, campus IT security alerted the task force to an anomalous outbound connection originating from the department's legacy research server. Captured in the transit buffer were 80 HTTP request logs: <code>network_capture.json</code>.",
    narrative_body
))
story_flowables.append(Paragraph(
    "Seventy-nine of the requests were standard web traffic: faculty members reading journals, style sheets loading, student portal queries. But sorting the capture by payload byte size isolated a single anomalous packet: a POST request containing an unnaturally bloated <code>Authorization</code> header. Within this header lay an obfuscated Base32 token, revealing the next authorization tier.",
    narrative_body
))
story_flowables.append(make_fragment_box(
    "Six was the year everything changed. Not the sixth thing I found.",
    "Warns against chronological fallacy: Level 6 represents a landmark reference point, not the 6th position."
))

story_flowables.append(Spacer(1, 8))

# Level 7
story_flowables.append(Paragraph("CHAPTER 7: THE SHATTERED MANUSCRIPT (LEVEL 7)", chapter_title))
story_flowables.append(Paragraph(
    "Deep inside Marrow's local server partition, investigators located an image file named <code>scrambled_page.png</code>. It appeared as completely static, visual noise—resembling television snow. Many assumed the file had suffered sector corruption.",
    narrative_body
))
story_flowables.append(Paragraph(
    "Close inspection revealed that the static was not random pixel noise; it was partitioned into crisp 8x8 pixel tiles. Marrow had applied a deterministic block permutation matrix to his handwritten research notes, followed by a matrix transpose and a 90-degree clockwise rotation. By setting up the inverse permutation matrix inside the Lab Engine and reversing the spatial transformations, the handwritten text reassembles seamlessly, exposing token BXZ19.",
    narrative_body
))
story_flowables.append(make_fragment_box(
    "Seven pieces were never lost. They were only ever facing the wrong way.",
    "Confirms that the underlying fragments are complete, but their vector orientations and positions are inverted."
))

story_flowables.append(Spacer(1, 8))

# Level 8
story_flowables.append(Paragraph("CHAPTER 8: THE HARMONIC RESONANCE (LEVEL 8)", chapter_title))
story_flowables.append(Paragraph(
    "The eighth and final evidence file on BLACKBOX.DAT was a grayscale synthetic image titled <code>signal_fft.png</code>. It displayed a noisy, grain-like pattern with zero identifiable structures in the spatial domain.",
    narrative_body
))
story_flowables.append(Paragraph(
    "This was the heart of the Marrow Conjecture: 2D Fourier steganography. When the image is transformed into the 2D frequency domain using a Fast Fourier Transform, a distinct, perfectly circular ring of high-energy harmonics appears in the magnitude spectrum. By applying a radial bandpass mask to isolate this exact frequency ring and taking the 2D Inverse FFT, the noise collapses, revealing the final code word burned across the canvas: <code>FIN4L</code>.",
    narrative_body
))
story_flowables.append(make_fragment_box(
    "Eight was never an end. Eight was where I started counting backward.",
    "THE FINAL DIRECTIONAL VECTOR: Dictates that the entire prime-indexed assembly must be processed in reverse order (8 down to 1)."
))

story_flowables.append(Spacer(1, 8))

# Final Boss
story_flowables.append(Paragraph("CHAPTER 9: THE META-ASSEMBLY & THE FINAL TRUTH", chapter_title))
story_flowables.append(Paragraph(
    "With all eight evidence artifacts decrypted, the BLACKBOX.DAT terminal unlocked its ultimate gate: <b>THE MARROW META-ASSEMBLY</b>. On screen appeared all eight verification tokens, alongside an encrypted final transmission.",
    narrative_body
))
story_flowables.append(Paragraph(
    "Now, the eight cryptic notebook fragments must be synthesized as a single mathematical instruction manual:",
    narrative_body
))
story_flowables.append(Paragraph("• Fragment #5 established that the ordering is governed by <b>prime sequence index</b>.", bullet_style))
story_flowables.append(Paragraph("• Fragment #8 established that the sequence must be read <b>in reverse: [8, 7, 6, 5, 4, 3, 2, 1]</b>.", bullet_style))
story_flowables.append(Paragraph("• Fragments #1, #2, #3, #4, #6, and #7 validate the orientation, alignment, and concatenation continuity.", bullet_style))

story_flowables.append(Spacer(1, 4))
story_flowables.append(Paragraph(
    "Assembling the eight solved level codes in reverse order creates the master 40-character decryption key:<br/>"
    "<code>FIN4L (8) + BXZ19 (7) + NT2K5 (6) + P0W3R (5) + M77RB (4) + XT4Q1 (3) + K4P82 (2) + A19X7 (1)</code><br/>"
    "<b>MASTER KEY:</b> <code>FIN4LBXZ19NT2K5P0W3RM77RBXT4Q1K4P82A19X7</code>",
    narrative_body
))
story_flowables.append(Paragraph(
    "Feeding this key into the Vigenère cipher engine against the final transmission string decrypts Dr. Elias Marrow's last message to the department:",
    narrative_body
))

story_flowables.append(make_memo("""<b>DECRYPTED FINAL TRANSMISSION // DR. ELIAS MARROW:</b><br/><br/>
\"To whoever reconstructed BLACKBOX.DAT:<br/><br/>
If you are reading this, you understand that mathematics is not a set of static rules written on a blackboard. It is a living, interconnected architecture of signals, spaces, and symmetries.<br/><br/>
I was not abducted. I was not lost. I left because the implications of the Conjecture exceed what can remain locked in an academic filing cabinet. When harmonic entropy is unlocked, every cipher is transparent.<br/><br/>
Remember this: <b>THE CONJECTURE WAS NEVER FALSE — I JUST RAN OUT OF TIME.</b><br/><br/>
Take the work forward.\"<br/>
— Dr. Elias Marrow"""))

story_flowables.append(Spacer(1, 8))
story_flowables.append(Paragraph(
    "The final submission flag submitted by the winning investigation team represents Dr. Marrow's final directive: <code>TOWARDS_INFINITY</code>.",
    narrative_body
))

build_pdf("File_Under_Mystery_Story_And_Lore.pdf", story_flowables)

# Update Markdown
markdown_story_path = os.path.join(base_docs_dir, "FILE_UNDER_MYSTERY_STORY_AND_LORE.md")
with open(markdown_story_path, "w", encoding="utf-8") as f:
    f.write("""# FILE UNDER MYSTERY — Complete Narrative & Story Dossier
*Department of Mathematics Internal Case File #M-2026-0819*
*Subject: The Disappearance of Dr. Elias Marrow & The Marrow Conjecture*

---

## 📜 PROLOGUE: THE SILENCE IN ROOM 418
Dr. Elias Marrow was not a man prone to eccentricity or theatrics. For twenty-four years, his presence in the Mathematics Department was as reliable as the fundamental theorem of calculus: 8:00 AM lecture on analytic number theory, 11:30 AM departmental tea, 2:00 PM research seminars on dynamical systems. He was revered, quiet, and obsessively meticulous.

That changed eight months ago when Marrow published a brief, four-page preprint titled *"On the Invariant Structure of Non-Trivial Zero Distributions in Multi-Dimensional Harmonic Spaces"* — what his graduate students colloquially termed **"The Marrow Conjecture"**. The paper claimed that prime distributions and cryptographic entropy were not chaotic anomalies, but deterministic harmonic projections of a single unified matrix transformation. In the mathematics community, proving the conjecture would shatter modern asymmetric cryptography.

Then, thirty-seven days ago, Dr. Marrow vanished. His apartment was undisturbed; his passport remained in his desk drawer. In his campus office (Room 418), the chalkboards had been scrubbed clean. On his desk sat a single air-gapped, custom-machined solid-state drive labeled in faded silver ink: **'BLACKBOX.DAT'**.

When cybersecurity technicians attempted to read the drive, every standard filesystem tool crashed. The drive possessed a custom hardware cryptographic controller that refused master keys. Instead, the firmware broadcasted a single console prompt: *"A proof is not given; it is earned. Provide evidence of understanding, and the archive shall yield."*

The drive has begun releasing eight encrypted evidence artifacts, one after another. Along with each evidence artifact lies a cryptic fragment from Dr. Marrow's lost handwritten diary. Your team has been formally designated as the independent investigative task force. You are not solving puzzles—you are reconstructing a crime scene of pure mathematics.

---

## 🌲 CHAPTER 1: THE PHOTOGRAPH IN THE SHADOWS (LEVEL 1)
**Evidence Item:** `forest.png` (Recovered from desk camera)  
**Story Context:** Timestamped at 03:14 AM on the night of Marrow's disappearance along the darkened perimeter woods behind the campus Technology Tower. To the naked eye, the photograph is pitch black. But pixel analysis reveals values clamped between [14, 26]. Performing a linear histogram stretch across [10, 40] expands the dynamic range, burning token `A19X7` into the distant tree line.

> **Dr. Marrow's Notebook Fragment #1:**  
> *"I started numbering from the year I was born, not from zero."*  
> *(Cryptographic Note: The indexing system is shifted by an offset, not 0-indexed.)*

---

## 📻 CHAPTER 2: THE MIDNIGHT VOICEMAIL (LEVEL 2)
**Evidence Item:** `voicemail.wav` (Accompanied by `spectrogram.png`)  
**Story Context:** An eerie 40-second recording received on the departmental answering machine. Playing the audio produces garbled speech and backwards static—a deliberate distraction. Converting the signal into a Short-Time Fourier Transform (STFT) spectrogram exposes a clean, unyielding 3000 Hz Morse code carrier wave pulsing the token `K4P82`.

> **Dr. Marrow's Notebook Fragment #2:**  
> *"The second fragment always comes right after silence. Listen for the gap, not the sound."*  
> *(Cryptographic Note: Fragment 2 is positioned directly after the sequence boundary.)*

---

## 📹 CHAPTER 3: THE CORRIDOR GHOST FRAME (LEVEL 3)
**Evidence Item:** `hallway.mp4` (CCTV security footage, 12 seconds, 300 frames)  
**Story Context:** Corridor camera footage outside Room 418 at midnight. The fluorescent fixtures flicker with a 60 Hz hum. Applying temporal frame differencing ($|Frame_t - Frame_{t-1}|$) causes Frame #142 to flash bright white. For exactly $1/30^{\\text{th}}$ of a second, a bulletin board poster displays a Base64-encoded string resolving to `XT4Q1`.

> **Dr. Marrow's Notebook Fragment #3:**  
> *"Three is a corner. Corners change direction."*  
> *(Cryptographic Note: The directional traversal vector reverses at index 3.)*

---

## 🖼️ CHAPTER 4: THE VACATION IN VIENNA (LEVEL 4)
**Evidence Item:** `holiday.png` (Recovered from cloud storage)  
**Story Context:** A 2018 photo of the Vienna Opera House from the International Congress of Mathematicians. While the photo appears normal, an entropy inspection reveals an unnaturally flat entropy distribution (7.99 bits/byte) in the Blue channel's Least Significant Bit (LSB). Extracting bitplane 0 recovers a compressed ZIP archive containing a linear equation ($7x - 3 = 11x + 25 \implies x = -7$), mapping to code `M77RB`.

> **Dr. Marrow's Notebook Fragment #4:**  
> *"Four hides inside what looks empty. So does the truth."*  
> *(Cryptographic Note: LSB steganographic principle; do not rely on surface appearance.)*

---

## 🔢 CHAPTER 5: THE SHREDDER RESIDUE (LEVEL 5)
**Evidence Item:** Strip of paper from office shredder: `219, 163, 97, 59`  
**Story Context:** Accompanying the numbers is a decoy ciphertext `WKH DQVZHU LV KLGGHQ` (+3 Caesar for "THE ANSWER IS HIDDEN"). The numbers themselves index the sequence of primes ($P_{219}=1327, P_{163}=967, P_{97}=509, P_{59}=277$). Taking each prime modulo 26 provides a running key stream that decrypts the secondary cipher block into "POWER OF SEVEN" (`P0W3R`).

> **Dr. Marrow's Notebook Fragment #5:**  
> *"Five is not a number. It is an order. Count the primes, not the digits."*  
> *(KEYSTONE CLUE: The final meta-ordering of all 8 levels is governed by prime order.)*

---

## 🌐 CHAPTER 6: THE SERVER ROOM INTERCEPTION (LEVEL 6)
**Evidence Item:** `network_capture.json` (80 HTTP server logs)  
**Story Context:** An unauthorized late-night outbound data transfer from the departmental server. 79 requests are mundane university traffic. Sorting by payload byte size isolates a single request carrying an anomalous `Authorization` header containing an obfuscated Base32 token resolving to `NT2K5`.

> **Dr. Marrow's Notebook Fragment #6:**  
> *"Six was the year everything changed. Not the sixth thing I found."*  
> *(Cryptographic Note: Level 6 represents a landmark pivot, not the 6th position.)*

---

## 🧩 CHAPTER 7: THE SHATTERED MANUSCRIPT (LEVEL 7)
**Evidence Item:** `scrambled_page.png` (Visual noise image)  
**Story Context:** A scan of Marrow's handwritten research notes scrambled using an $8 \\times 8$ block permutation matrix, transposed, and rotated $90^\\circ$ clockwise to prevent industrial espionage. Applying the inverse permutation matrix and counter-rotation in the Lab Engine restores the manuscript and reveals token `BXZ19`.

> **Dr. Marrow's Notebook Fragment #7:**  
> *"Seven pieces were never lost. They were only ever facing the wrong way."*  
> *(Cryptographic Note: All components are preserved; spatial/vector inversions are required.)*

---

## 🌊 CHAPTER 8: THE HARMONIC RESONANCE (LEVEL 8)
**Evidence Item:** `signal_fft.png` (2D grayscale synthetic noise)  
**Story Context:** The culmination of the Marrow Conjecture. Pure noise in the spatial domain reveals a distinct circular ring of harmonics in the 2D Fast Fourier Transform magnitude spectrum. Applying a radial bandpass mask to isolate the ring and computing the 2D Inverse FFT reconstructs the watermark `FIN4L`.

> **Dr. Marrow's Notebook Fragment #8:**  
> *"Eight was never an end. Eight was where I started counting backward."*  
> *(FINAL DIRECTIONAL CLUE: Reassemble the prime sequence in reverse from 8 down to 1.)*

---

## 🔓 CHAPTER 9: THE META-ASSEMBLY & FINAL REVELATION
Upon solving all eight levels, BLACKBOX.DAT presents its final locked console.

### Reassembly Synthesis:
1. **Rule from Fragment #5:** Order is governed by prime indices.
2. **Rule from Fragment #8:** Sequence is read in **reverse**: `[8, 7, 6, 5, 4, 3, 2, 1]`.

### The 40-Character Master Key:
$$\\text{Key} = \\text{FIN4L} + \\text{BXZ19} + \\text{NT2K5} + \\text{P0W3R} + \\text{M77RB} + \\text{XT4Q1} + \\text{K4P82} + \\text{A19X7}$$
$$\\mathbf{FIN4LBXZ19NT2K5P0W3RM77RBXT4Q1K4P82A19X7}$$

### Decrypted Message:
Applying this key as a Vigenère key on the final ciphertext unlocks Dr. Marrow's confession:
> **"THE CONJECTURE WAS NEVER FALSE — I JUST RAN OUT OF TIME."**

**Final Event Flag:** `TOWARDS_INFINITY`
""")

print("[+] Updated FILE_UNDER_MYSTERY_STORY_AND_LORE.md and compiled File_Under_Mystery_Story_And_Lore.pdf")
