const input = document.getElementById("input");

// ------------------parsing md -----------------------------------------------------
const renderContainer = document.createElement("div");
renderContainer.style.display = "none";
document.body.appendChild(renderContainer);

function renderMarkdownToHTML(md) {
  renderContainer.innerHTML = marked.parse(md);
  return renderContainer;
}

document.getElementById("md-pdf").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const margin = 10;
  let y = margin;

  const rendered = renderMarkdownToHTML(input.value);
  const elements = rendered.querySelectorAll("*");

  for (const el of elements) {
    const tag = el.tagName.toLowerCase();
    const text = el.textContent.trim();

    if (tag === "img") {
      const imgUrl = el.getAttribute("src");
      try {
        const imgData = await toBase64(imgUrl);
        if (y > 250) {
          doc.addPage();
          y = margin;
        }
        doc.addImage(imgData, "JPEG", margin, y, 60, 40);
        y += 50;
      } catch (e) {
        console.warn("Image failed to load:", imgUrl);
      }
      continue;
    }

    if (tag === "ul" || tag === "ol") {
      const items = el.querySelectorAll("li");
      items.forEach((li, index) => {
        if (y > 280) {
          doc.addPage();
          y = margin;
        }
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        const bullet = tag === "ul" ? "• " : `${index + 1}. `;
        doc.text(bullet + li.textContent, margin, y);
        y += 8;
      });
      y += 4;
      continue;
    }

    if (!text) continue;

    // Font and size based on tag
    switch (tag) {
      case "h1":
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        break;
      case "h2":
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        break;
      case "h3":
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        break;
      case "p":
      default:
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
    }

    const span = document.createElement("span");
    span.innerHTML = el.innerHTML;

    const fragments = Array.from(span.childNodes);
    for (const frag of fragments) {
      if (frag.nodeType === Node.TEXT_NODE) {
        const lines = doc.splitTextToSize(frag.textContent.trim(), 190);
        lines.forEach(line => {
          if (y > 280) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += 8;
        });
      } else if (frag.nodeType === Node.ELEMENT_NODE) {
        const subTag = frag.tagName.toLowerCase();
        const content = frag.textContent.trim();
        if (!content) continue;

        if (subTag === "strong" || subTag === "b") {
          doc.setFont("helvetica", "bold");
        } else if (subTag === "em" || subTag === "i") {
          doc.setFont("helvetica", "italic");
        }

        const lines = doc.splitTextToSize(content, 190);
        lines.forEach(line => {
          if (y > 280) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += 8;
        });

        doc.setFont("helvetica", "normal");
      }
    }

    y += 4;
  }

  doc.save("markdown.pdf");
});

// -------------------Convert image URL to Base64-------------------------------------------------------------------------------
async function toBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
