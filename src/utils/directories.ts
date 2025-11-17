import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Return the project root directory depending on the build mode.
 * @returns {string} Absolute path to the project root directory
 */
export const getProjectRootDir = (): string => {
  const mode = import.meta.env.MODE;

  return mode === "production"
    ? path.join(__dirname, "../")
    : path.join(__dirname, "../../");
};

const __srcFolder = path.join(getProjectRootDir(), "/src");

/**
 * Convert an absolute file path to a relative URL path (relative to the `src` folder).
 * @param {string} filepath - Absolute filesystem path of a file
 * @returns {string} The file path relative to `/src` (leading slash preserved)
 */
export const getRelativeUrlByFilePath = (filepath: string): string => {
  return filepath.replace(__srcFolder, "");
};
