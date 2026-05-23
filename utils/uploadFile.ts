import fs from "fs";
import path from "path";

async function uploadFile(file: File): Promise<string> {
    // Convert File -> Buffer
    const bytes = await file.arrayBuffer();

    const buffer = Buffer.from(bytes);

    // Create unique filename
    const uniqueFilename =
        `${Date.now()}-${file.name}`;

    // Absolute path
    const uploadDir = path.join(
        process.cwd(),
        "uploads"
    );

    // Ensure uploads dir exists
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, {
            recursive: true
        });
    }

    // Final file path
    const filePath = path.join(
        uploadDir,
        uniqueFilename
    );

    // Save file
    fs.writeFileSync(filePath, buffer);

    // Store relative path for DB
    const storedFilePath: string =
        `/uploads/${uniqueFilename}`;

    return storedFilePath;
}

export default uploadFile;