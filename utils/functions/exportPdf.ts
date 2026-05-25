import puppeteer from "puppeteer";

export async function generateAssignmentPDF(
    assignmentId: string
) {

    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    const url = `${process.env.NEXT_PUBLIC_APP_URL}/print/assignments/${assignmentId}`;

    await page.goto(url, {
        waitUntil: "networkidle0",
    });

    // Important for print CSS
    await page.emulateMediaType("print");

    const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,

        margin: {
            top: "16mm",
            right: "16mm",
            bottom: "16mm",
            left: "16mm",
        },
    });

    await browser.close();

    return pdfBuffer;
}