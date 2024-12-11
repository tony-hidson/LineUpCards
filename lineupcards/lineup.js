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
            await generatePreview(teamName, logoDataURL, 'image/png');
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
            await generateDownload(teamName, logoDataURL, 'image/png');
        } catch (err) {
            console.error('Error in Download Card:', err);
        }
    };
    reader.readAsDataURL(logoInput);
});

// Process the logo input to handle SVG conversion if needed
async function processLogoInput(file, fileDataURL) {
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

async function generatePreview(teamName, logoDataURL, logoType) {
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

    let logoImage = await pdfDoc.embedPng(await fetch(logoDataURL).then((res) => res.arrayBuffer()));
    const logoDims = logoImage.scaleToFit(logoBoxWidth, logoBoxHeight);

    // Place logos
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
        // Draw the debugging outline
        // firstPage.drawRectangle({
        //     x: x,
        //     y: y,
        //     width: nameBoxWidth,
        //     height: nameBoxHeight,
        //     borderColor: PDFLib.rgb(1, 0, 0), // Red outline for visibility
        //     borderWidth: 1,
        // });
    
        // Wrap and center the text
        const wrappedText = wrapAndCenterText(teamName, font, 16, nameBoxWidth, nameBoxHeight);
        const fontSize = wrappedText.fontSize;
        const lines = wrappedText.lines;
        const lineHeight = fontSize + 2; // Spacing between lines
    
        // Calculate the total height of the text block
        const totalTextHeight = lines.length * lineHeight;
    
        // Calculate the starting Y position to vertically center the block
        let startY = y + (nameBoxHeight - totalTextHeight) / 2;
    
        // Draw each line centered horizontally
        lines.forEach((line) => {
            const lineWidth = font.widthOfTextAtSize(line, fontSize);
            const textX = x + (nameBoxWidth - lineWidth) / 2; // Center horizontally
            firstPage.drawText(line, {
                x: textX,
                y: startY,
                size: fontSize,
                font: font,
            });
            startY -= lineHeight; // Move down to the next line
        });
    });
    
    
    const pdfBytes = await pdfDoc.saveAsBase64({ dataUri: true });
    document.getElementById('cardPreview').src = pdfBytes;
}

async function generateDownload(teamName, logoDataURL, logoType) {
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

    let logoImage = await pdfDoc.embedPng(await fetch(logoDataURL).then((res) => res.arrayBuffer()));
    const logoDims = logoImage.scaleToFit(logoBoxWidth, logoBoxHeight);

    // Place logos
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
        // Draw the debugging outline
        // firstPage.drawRectangle({
        //     x: x,
        //     y: y,
        //     width: nameBoxWidth,
        //     height: nameBoxHeight,
        //     borderColor: PDFLib.rgb(1, 0, 0),
        //     borderWidth: 1,
        // });
    
        // Wrap and center the text
        const wrappedText = wrapAndCenterText(teamName, font, 16, nameBoxWidth, nameBoxHeight);
        const fontSize = wrappedText.fontSize;
        const lines = wrappedText.lines;
        const lineHeight = fontSize + 2;
    
        // Calculate vertical starting position
        const totalTextHeight = lines.length * lineHeight;
        let startY = y + (nameBoxHeight - totalTextHeight) / 2;
    
        // Draw each line centered horizontally
        lines.forEach((line) => {
            const lineWidth = font.widthOfTextAtSize(line, fontSize);
            const textX = x + (nameBoxWidth - lineWidth) / 2;
            firstPage.drawText(line, {
                x: textX,
                y: startY,
                size: fontSize,
                font: font,
            });
            startY -= lineHeight; // Move to the next line
        });
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${teamName}_LineUpCard.pdf`;
    link.click();

    URL.revokeObjectURL(url);
}

// Helper function to wrap and center text
function wrapAndCenterText(text, font, maxFontSize, maxWidth, maxHeight) {
    const minFontSize = 5; // Minimum font size in points
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
            if (currentLine) lines.push(currentLine); // Push the current line to lines
            currentLine = word; // Start a new line with the current word
        }
    });

    if (currentLine) lines.push(currentLine); // Push the last line

    const totalHeight = lines.length * (fontSize + 2); // Total height of the block
    if (totalHeight <= maxHeight) break; // Exit loop if text fits

    fontSize -= 0.5; // Decrease font size
}

// Handle overflow by truncating text
if (lines.length * (fontSize + 2) > maxHeight) {
    const truncatedLine = lines[0].substring(0, lines[0].length - 3) + '...';
    lines = [truncatedLine];
}

    if (fontSize < minFontSize) fontSize = minFontSize; // Ensure font size does not fall below minimum

    return { lines, fontSize };
}
