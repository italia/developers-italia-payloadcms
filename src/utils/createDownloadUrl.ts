// Payload media docs carry the extension in `filename` already (e.g. "report.pdf"),
// unlike DatoCMS uploads which split it into a separate `format` field.
export const createDownloadUrl = (doc?: {
  url: string;
  filename: string;
}): string => (doc ? `${doc.url}?dl=${doc.filename}` : "#");
