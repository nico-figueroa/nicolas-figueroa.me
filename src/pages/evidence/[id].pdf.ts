// Handles evidence PDF files, providing static path generation and file retrieval for evidence items

import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import evidence from "../../content/evidence.json";

interface EvidenceRecord {
  id: string;
  file: string;
  fileName: string;
}

interface EvidenceProps {
  sourcePath: string;
}

const contentRoot = resolve(process.cwd(), "src", "content");
const evidenceRoot = resolve(contentRoot);

// Utility functions for handling evidence PDF files, including static path generation and file retrieval
export function getStaticPaths() {
  return (evidence as EvidenceRecord[]).map((item) => {
    const sourcePath = resolve(contentRoot, item.file);
    if (!sourcePath.startsWith(`${evidenceRoot}${sep}`)) {
      throw new Error(`Evidence file must remain inside src/content: ${item.id}`);
    }
    return {
      params: { id: item.id },
      props: { sourcePath },
    };
  });
}

// Retrieves the PDF file for the given evidence ID and returns it as a response with appropriate headers
export async function GET({ props }: { props: EvidenceProps }) {
  return new Response(new Uint8Array(await readFile(props.sourcePath)), {
    headers: {
      "content-type": "application/pdf",
      "cache-control": "public, max-age=3600",
      "x-content-type-options": "nosniff",
    },
  });
}
