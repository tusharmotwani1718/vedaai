import fs from "fs";
import path from "path";

async function getFileContent(fileUrl: string, fileType: "txt" | "pdf"): Promise<string> {
    try {
        // if (fileType === "txt") {
            const absolutePath = path.join(
                process.cwd(),
                fileUrl
            );

            const text = fs.readFileSync(
                absolutePath,
                "utf-8"
            );

            return text;
        // } 



    } catch (error) {
        console.error("Error reading file content:", error);
        throw new Error("Failed to read file content");
    }
}

export default getFileContent;