#!/usr/bin/env node

import fs from "fs";
import path from "path";
import process from "process";
import filenamify from "filenamify";

// Function to process filename according to requirements
function processFilename(filename) {
  // Get filename without extension
  const ext = path.extname(filename);
  let name = path.basename(filename, ext);

  // Apply filenamify-url first to handle URL special characters
  name = filenamify(name);

  // Convert to lowercase
  name = name.toLowerCase();

  // Remove month names and abbreviations
  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
    "jan",
    "feb",
    "mar",
    "apr",
    "jun",
    "jul",
    "aug",
    "sep",
    "sept",
    "oct",
    "nov",
    "dec",
  ];

  months.forEach((month) => {
    // Use word boundaries to avoid removing parts of other words
    name = name.replace(new RegExp(`\\b${month}\\b`, "gi"), "");
  });

  // Remove all numbers
  name = name.replace(/\d+/g, "");

  // Convert spaces to dashes
  name = name.replace(/\s+/g, "-");

  // Remove double dashes and clean up leftover dashes at start/end
  name = name.replace(/--+/g, "-").replace(/^-+|-+$/g, "");

  // Handle empty filename case
  if (!name) {
    name = "unnamed";
  }

  // Get current date in MM/DD/YYYY format
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  // Create date prefix in format MM/DD/YYYY_HHmm (e.g., 11/11/2025_2300)
  const datePrefix = `${month}${day}${year}_${hours}${minutes}_`;

  return datePrefix + name + ext;
}

// Recursively process the directory
async function processDirectory(dirPath) {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      await processDirectory(fullPath); // Recurse into subdirectory
    } else if (entry.isFile()) {
      const dir = path.dirname(fullPath);
      const newFileName = processFilename(entry.name);
      const newFullPath = path.join(dir, newFileName);

      if (fullPath !== newFullPath) {
        try {
          await fs.promises.rename(fullPath, newFullPath);
          console.log(`Renamed: ${entry.name} ➝ ${newFileName}`);
        } catch (err) {
          console.error(`Failed to rename ${fullPath}: ${err.message}`);
        }
      }
    }
  }
}

// Entry point
(async () => {
  const [, , inputDir] = process.argv;

  if (!inputDir) {
    console.error("Usage: node rename-files.js <directory>");
    process.exit(1);
  }

  try {
    const absolutePath = path.resolve(inputDir);
    const stat = await fs.promises.stat(absolutePath);
    if (!stat.isDirectory()) {
      throw new Error("The input path is not a directory.");
    }

    await processDirectory(absolutePath);
    console.log("✅ Renaming completed.");
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
})();
