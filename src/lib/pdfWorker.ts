import * as pdfjsLib from "pdfjs-dist";

// Set up the worker for v3.x
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export { pdfjsLib };
