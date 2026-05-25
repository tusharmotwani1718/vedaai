import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";

async function getFileContent(
    fileUrl: string,
    fileType: "txt" | "pdf"
): Promise<string> {
    try {
        const absolutePath = path.join(
            process.cwd(),
            fileUrl
        );

        // TXT FILES
        if (fileType === "txt") {
            const text = fs.readFileSync(
                absolutePath,
                "utf-8"
            );

            return text;
        }

        // PDF FILES
        if (fileType === "pdf") {
            const pdfBuffer = fs.readFileSync(
                absolutePath
            );

            const parser = new PDFParse({ data: pdfBuffer });
        }

        throw new Error("Unsupported file type");
    } catch (error) {
        console.error(
            "Error reading file content:",
            error
        );

        throw new Error("Failed to read file content");
    }
}

export default getFileContent;