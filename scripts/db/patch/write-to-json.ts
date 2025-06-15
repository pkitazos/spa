import { writeFileSync } from "fs";
import { join } from "path";

/**
 * Writes any object to a JSON file with pretty formatting
 * @param data - The data to write to file
 * @param filename - Name of the file (without extension)
 * @param outputDir - Directory to write to (defaults to current directory)
 */
export function writeToJsonFile<T>(
  data: T,
  filename: string,
  outputDir: string = "./",
): void {
  try {
    const filepath = join(outputDir, `${filename}.json`);
    const jsonString = JSON.stringify(data, null, 2);

    writeFileSync(filepath, jsonString, "utf8");
    console.log(`Data written to: ${filepath}`);
  } catch (error) {
    console.error("Failed to write JSON file:", error);
    throw error;
  }
}

/**
 * Alternative version that returns the JSON string instead of writing to file
 * Useful for debugging or when you want to handle file writing yourself
 */
export function toFormattedJson<T>(data: T): string {
  return JSON.stringify(data, null, 2);
}
