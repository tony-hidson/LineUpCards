document.getElementById('loadPreview').addEventListener('click', async () => {
    const teamName = document.getElementById('teamNameInput').value || '';
    const logoInput = document.getElementById('logoInput').files[0];

    if (!teamName) {
        alert('Please enter the team name.');
        return;
    }

    if (!logoInput) {
        alert('Please upload a logo.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (event) {
        try {
            const logoDataURL = await processLogoInput(logoInput, event.target.result);
            await generatePDF(teamName, logoDataURL, logoInput.type, true);
        } catch (err) {
            console.error('Error in Load Preview:', err);
        }
    };
    reader.readAsDataURL(logoInput);
});

document.getElementById('downloadCard').addEventListener('click', async () => {
    const teamName = document.getElementById('teamNameInput').value || '';
    const logoInput = document.getElementById('logoInput').files[0];

    if (!teamName || !logoInput) {
        alert('Please enter the team name and upload a logo.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (event) {
        try {
            const logoDataURL = await processLogoInput(logoInput, event.target.result);
            await generatePDF(teamName, logoDataURL, logoInput.type, false);
        } catch (err) {
            console.error('Error in Download Card:', err);
        }
    };
    reader.readAsDataURL(logoInput);
});

// Process the logo input to handle SVG conversion if needed
async function processLogoInput(file, fileDataURL) {
    console.log('File type:', file.type);
    if (file.type === 'image/svg+xml') {
        return await convertSvgToPng(fileDataURL);
    }
    return fileDataURL; // If not SVG, return the original file data
}

// Convert SVG to PNG using the Canvas API
async function convertSvgToPng(svgDataURL) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = svgDataURL;
    });
}

// Generate PDF for preview or download
async function generatePDF(teamName, logoDataURL, logoType, isPreview) {
    const templateUrl = './LineUpCardTemplateFull.pdf';
    const existingPdfBytes = await fetch(templateUrl).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const logoBoxWidth = 164.43;
    const logoBoxHeight = 45.91;
    const nameBoxWidth = 54;
    const nameBoxHeight = 13;

    const logoPositions = [
        { x: 225, y: 735.93 - 48 },
        { x: 225, y: 735.93 - 272 },
        { x: 225, y: 735.93 - 495 },
    ];
    const namePositions = [
        { x: 481, y: 735.93 - 52 },
        { x: 481, y: 735.93 - 275 },
        { x: 481, y: 735.93 - 499 },
    ];

    // Embed the logo
    let logoImage;
    if (logoType === 'image/png') {
        logoImage = await pdfDoc.embedPng(await fetch(logoDataURL).then((res) => res.arrayBuffer()));
    } else if (logoType === 'image/jpeg' || logoType === 'image/jpg') {
        logoImage = await pdfDoc.embedJpg(await fetch(logoDataURL).then((res) => res.arrayBuffer()));
    } else {
        alert('Unsupported image type. Please upload PNG, JPG, or JPEG.');
        return;
    }

    const logoDims = logoImage.scaleToFit(logoBoxWidth, logoBoxHeight);
    logoPositions.forEach(({ x, y }) => {
        const xOffset = (logoBoxWidth - logoDims.width) / 2;
        const yOffset = (logoBoxHeight - logoDims.height) / 2;
        firstPage.drawImage(logoImage, {
            x: x + xOffset,
            y: y + yOffset,
            width: logoDims.width,
            height: logoDims.height,
        });
    });

    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

    // Add team names with wrapping and centering
    namePositions.forEach(({ x, y }) => {
        const wrappedText = wrapAndCenterText(teamName, font, 16, nameBoxWidth, nameBoxHeight);
        const fontSize = wrappedText.fontSize;
        const lines = wrappedText.lines;
        const lineHeight = fontSize + 2;

        const totalTextHeight = lines.length * lineHeight;
        let startY = y + (nameBoxHeight - totalTextHeight) / 2;

        lines.forEach((line) => {
            const lineWidth = font.widthOfTextAtSize(line, fontSize);
            const textX = x + (nameBoxWidth - lineWidth) / 2;
            firstPage.drawText(line, {
                x: textX,
                y: startY,
                size: fontSize,
                font: font,
            });
            startY -= lineHeight;
        });
    });

    const pdfBytes = await pdfDoc.saveAsBase64({ dataUri: true });

    if (isPreview) {
        document.getElementById('cardPreview').src = pdfBytes;
    } else {
        const blob = new Blob([await pdfDoc.save()], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${teamName}_LineUpCard.pdf`;
        link.click();

        URL.revokeObjectURL(url);
    }
}

// Helper function to wrap and center text
function wrapAndCenterText(text, font, maxFontSize, maxWidth, maxHeight) {
    const minFontSize = 5;
    let fontSize = maxFontSize;
    let words = text.split(' ');
    let lines = [];
    let currentLine = '';

    while (fontSize >= minFontSize) {
        lines = [];
        currentLine = '';

        words.forEach((word) => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const lineWidth = font.widthOfTextAtSize(testLine, fontSize);

            if (lineWidth <= maxWidth) {
                currentLine = testLine;
            } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            }
        });

        if (currentLine) lines.push(currentLine);

        const totalHeight = lines.length * (fontSize + 2);
        if (totalHeight <= maxHeight) break;

        fontSize -= 0.5;
    }

    return { lines, fontSize };
}
