from PyPDF2 import PdfReader
path = r"c:\Users\njoya\Desktop\Lawbridge\lawbridge_final_architecture.drawio.pdf"
reader = PdfReader(path)
text = []
for i, page in enumerate(reader.pages):
    try:
        p = page.extract_text() or ''
    except Exception as e:
        p = ''
    text.append(f"--- PAGE {i+1} ---\n")
    text.append(p)
output = "\n".join(text)
print(output)
