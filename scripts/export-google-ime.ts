import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Ensure dataset/dictionary/index.ts exists before dynamic import
await import("./build-prep.ts");

type SourceWord = {
  en: string;
  ja?: string;
  pronunciationJa?: string;
};

// Dynamic import after build-prep to avoid missing index.ts
const { words } = await import("../dataset/dictionary/index.ts");

const toHiragana = (input: string): string => {
  // Convert Katakana to Hiragana by Unicode offset and normalize choonpu
  return input.replace(/[ァ-ン]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60)
  );
};

const buildGoogleImeTsv = (src: SourceWord[]): string => {
  // Google IME import format: 読み[TAB]単語[TAB]品詞
  // 品詞は汎用的な「名詞」を使用
  const lines: string[] = [];

  for (const w of src) {
    if (!w.ja || !w.pronunciationJa) continue;

    const yomi = toHiragana(w.pronunciationJa)
      .replace(/\s+/g, "")
      .trim();
    const tango = w.ja.trim();
    if (!yomi || !tango) continue;

    lines.push(`${yomi}\t${tango}\t名詞`);
  }

  // Keep stable deterministic order
  lines.sort((a, b) => a.localeCompare(b, "ja"));
  return lines.join("\n") + "\n";
};

const tsv = buildGoogleImeTsv(words as SourceWord[]);

const distDir = resolve(import.meta.dirname, "../dist");
await mkdir(distDir, { recursive: true });
await writeFile(resolve(distDir, "google-ime.tsv"), tsv, { encoding: "utf-8" });

console.info(`Generated: ${resolve(distDir, "google-ime.tsv")}`);

