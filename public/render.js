import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { fileURLToPath } from "url";

// Needed because __dirname doesn't exist in ES modules
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

// 1. Load JSON
const jsonPath = path.join(
  __dirname,
  "data",
  "assignment.json"
);

const data = JSON.parse(
  fs.readFileSync(jsonPath, "utf-8")
);

// 2. Load Handlebars template
const templatePath = path.join(
  __dirname,
  "templates",
  "assignment.hbs"
);

const templateHtml = fs.readFileSync(
  templatePath,
  "utf-8"
);

// 3. Compile template
const template = Handlebars.compile(templateHtml);

// 4. Inject JSON into HTML
const finalHtml = template(data);

// 5. Save final HTML
const outputPath = path.join(
  __dirname,
  "output",
  "assignment.html"
);

fs.writeFileSync(outputPath, finalHtml);

console.log("HTML generated successfully!");