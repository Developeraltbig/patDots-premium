import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  convertInchesToTwip,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
} from "docx";
import { saveAs } from "file-saver";
import { NDA_TRANSLATIONS } from "./ndaTranslations";

export const generateAndDownloadNDA = async (
  data,
  languageCode = "en",
  translatedInputs = null,
) => {
  // 1. Select Dictionary
  const t = NDA_TRANSLATIONS[languageCode] || NDA_TRANSLATIONS["en"];

  // 2. Select Inputs (Translated or Original)
  const d = translatedInputs || data;

  const getVal = (val) =>
    val && val.trim() !== "" ? val : "_______________________________";

  const formatDate = (dateStr) => {
    if (!dateStr) return "__________________";
    return new Date(dateStr).toLocaleDateString(
      languageCode === "en" ? "en-US" : languageCode,
    );
  };

  // Border styles
  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  };

  const heavyBorder = {
    top: { style: BorderStyle.SINGLE, size: 15, color: "666666" },
    bottom: { style: BorderStyle.SINGLE, size: 15, color: "666666" },
    left: { style: BorderStyle.SINGLE, size: 15, color: "666666" },
    right: { style: BorderStyle.SINGLE, size: 15, color: "666666" },
  };

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children: [
          // Title
          new Paragraph({
            text: t.title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            bidirectional: t.rtl,
            spacing: { after: 100 },
            border: {
              bottom: {
                color: "4A90E2",
                space: 8,
                style: BorderStyle.SINGLE,
                size: 20,
              },
            },
          }),
          new Paragraph({
            text: t.subtitle,
            alignment: AlignmentType.CENTER,
            bidirectional: t.rtl,
            spacing: { after: 300 },
          }),

          // Effective Date
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorder,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: t.effectiveDateLabel,
                            bold: true,
                            font: t.font,
                          }),
                          new TextRun({
                            text: formatDate(d.effectiveDate),
                            font: t.font,
                          }),
                        ],
                        bidirectional: t.rtl,
                      }),
                    ],
                    shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 300 } }),

          // Disclosing Party Header
          new Paragraph({
            text: t.disclosingHeader,
            heading: HeadingLevel.HEADING_2,
            bidirectional: t.rtl,
            spacing: { before: 200, after: 150 },
            shading: { fill: "E8F4F8", type: ShadingType.CLEAR },
          }),

          // Disclosing Party Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorder,
            rows: [
              // Name
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: t.nameLabel,
                            bold: true,
                            font: t.font,
                          }),
                        ],
                        bidirectional: t.rtl,
                      }),
                    ],
                    shading: { fill: "F9F9F9", type: ShadingType.CLEAR },
                  }),
                  new TableCell({
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        text: getVal(d.disclosingName),
                        bidirectional: t.rtl,
                      }),
                    ],
                  }),
                ],
              }),
              // Address
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: t.addressLabel,
                            bold: true,
                            font: t.font,
                          }),
                        ],
                        bidirectional: t.rtl,
                      }),
                    ],
                    shading: { fill: "F9F9F9", type: ShadingType.CLEAR },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: getVal(d.disclosingAddress),
                        bidirectional: t.rtl,
                      }),
                    ],
                  }),
                ],
              }),
              // Email
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: t.emailLabel,
                            bold: true,
                            font: t.font,
                          }),
                        ],
                        bidirectional: t.rtl,
                      }),
                    ],
                    shading: { fill: "F9F9F9", type: ShadingType.CLEAR },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: getVal(d.disclosingEmail),
                        bidirectional: t.rtl,
                      }),
                    ],
                  }),
                ],
              }),
              // Phone
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: t.phoneLabel,
                            bold: true,
                            font: t.font,
                          }),
                        ],
                        bidirectional: t.rtl,
                      }),
                    ],
                    shading: { fill: "F9F9F9", type: ShadingType.CLEAR },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: getVal(d.disclosingPhone),
                        bidirectional: t.rtl,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 300 } }),

          // Receiving Party Header & Table (Repeat Logic)
          new Paragraph({
            text: t.receivingHeader,
            heading: HeadingLevel.HEADING_2,
            bidirectional: t.rtl,
            spacing: { before: 200, after: 150 },
            shading: { fill: "E8F4F8", type: ShadingType.CLEAR },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorder,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: t.nameLabel,
                            bold: true,
                            font: t.font,
                          }),
                        ],
                        bidirectional: t.rtl,
                      }),
                    ],
                    shading: { fill: "F9F9F9", type: ShadingType.CLEAR },
                  }),
                  new TableCell({
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        text: getVal(d.receivingName),
                        bidirectional: t.rtl,
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: t.addressLabel,
                            bold: true,
                            font: t.font,
                          }),
                        ],
                        bidirectional: t.rtl,
                      }),
                    ],
                    shading: { fill: "F9F9F9", type: ShadingType.CLEAR },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: getVal(d.receivingAddress),
                        bidirectional: t.rtl,
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: t.emailLabel,
                            bold: true,
                            font: t.font,
                          }),
                        ],
                        bidirectional: t.rtl,
                      }),
                    ],
                    shading: { fill: "F9F9F9", type: ShadingType.CLEAR },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: getVal(d.receivingEmail),
                        bidirectional: t.rtl,
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: t.phoneLabel,
                            bold: true,
                            font: t.font,
                          }),
                        ],
                        bidirectional: t.rtl,
                      }),
                    ],
                    shading: { fill: "F9F9F9", type: ShadingType.CLEAR },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: getVal(d.receivingPhone),
                        bidirectional: t.rtl,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // Intro
          new Paragraph({
            text: t.intro,
            spacing: { before: 300, after: 300 },
            alignment: AlignmentType.CENTER,
            bidirectional: t.rtl,
            border: {
              top: {
                color: "CCCCCC",
                space: 8,
                style: BorderStyle.DOUBLE,
                size: 6,
              },
              bottom: {
                color: "CCCCCC",
                space: 8,
                style: BorderStyle.DOUBLE,
                size: 6,
              },
            },
          }),

          // SECTIONS (Loopable manually for clarity)

          // S1
          new Paragraph({
            text: t.s1Title,
            heading: HeadingLevel.HEADING_2,
            shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
            bidirectional: t.rtl,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: t.s1Text + " ", bidirectional: t.rtl }),
              new TextRun({
                text: `(${d.purpose})`,
                bold: true,
                bidirectional: t.rtl,
              }),
            ],
            spacing: { after: 300 },
            indent: { left: convertInchesToTwip(0.25) },
          }),

          // S2
          new Paragraph({
            text: t.s2Title,
            heading: HeadingLevel.HEADING_2,
            shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
            bidirectional: t.rtl,
          }),
          new Paragraph({
            text: t.s2Text,
            spacing: { after: 150 },
            indent: { left: convertInchesToTwip(0.25) },
            bidirectional: t.rtl,
          }),
          // Bullets
          ...(t.s2Bullets || []).map(
            (text) =>
              new Paragraph({
                text: `• ${text}`,
                spacing: { after: 80 },
                indent: { left: convertInchesToTwip(0.5) },
                bidirectional: t.rtl,
              }),
          ),
          new Paragraph({
            text: t.s2Exclusions,
            spacing: { before: 100, after: 300 },
            indent: { left: convertInchesToTwip(0.25) },
            bidirectional: t.rtl,
          }),

          // S3
          new Paragraph({
            text: t.s3Title,
            heading: HeadingLevel.HEADING_2,
            shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
            bidirectional: t.rtl,
          }),
          new Paragraph({
            text: t.s3Text,
            spacing: { after: 300 },
            indent: { left: convertInchesToTwip(0.25) },
            bidirectional: t.rtl,
          }),

          // S4
          new Paragraph({
            text: t.s4Title,
            heading: HeadingLevel.HEADING_2,
            shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
            bidirectional: t.rtl,
          }),
          new Paragraph({
            text: t.s4Text,
            spacing: { after: 300 },
            indent: { left: convertInchesToTwip(0.25) },
            bidirectional: t.rtl,
          }),

          // S5
          new Paragraph({
            text: t.s5Title,
            heading: HeadingLevel.HEADING_2,
            shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
            bidirectional: t.rtl,
          }),
          new Paragraph({
            text: t.s5Text,
            spacing: { after: 300 },
            indent: { left: convertInchesToTwip(0.25) },
            bidirectional: t.rtl,
          }),

          // S6
          new Paragraph({
            text: t.s6Title,
            heading: HeadingLevel.HEADING_2,
            shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
            bidirectional: t.rtl,
          }),
          new Paragraph({
            text: t.s6Text,
            spacing: { after: 300 },
            indent: { left: convertInchesToTwip(0.25) },
            bidirectional: t.rtl,
          }),

          // S7
          new Paragraph({
            text: t.s7Title,
            heading: HeadingLevel.HEADING_2,
            shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
            bidirectional: t.rtl,
          }),
          new Paragraph({
            text: t.s7Text,
            spacing: { after: 300 },
            indent: { left: convertInchesToTwip(0.25) },
            bidirectional: t.rtl,
          }),

          // SIGNATURES
          new Paragraph({
            text: t.sigSectionHeader,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 300 },
            bidirectional: t.rtl,
            border: {
              top: {
                color: "666666",
                space: 8,
                style: BorderStyle.DOUBLE,
                size: 10,
              },
              bottom: {
                color: "666666",
                space: 8,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
          }),

          // Disclosing Sig Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: heavyBorder,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: t.sigDisclosingHeader,
                            bold: true,
                            size: 24,
                            font: t.font,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        bidirectional: t.rtl,
                      }),
                    ],
                    shading: { fill: "E8F4F8", type: ShadingType.CLEAR },
                    columnSpan: 2,
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: t.sigESigLabel,
                            bold: true,
                            font: t.font,
                          }),
                        ],
                        bidirectional: t.rtl,
                      }),
                    ],
                    shading: { fill: "F9F9F9", type: ShadingType.CLEAR },
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: d.disclosingSig
                              ? `/ ${d.disclosingSig} /`
                              : "_______________________________",
                            font: "Courier New",
                            italics: true,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: t.sigPrintedLabel,
                            bold: true,
                            font: t.font,
                          }),
                        ],
                        bidirectional: t.rtl,
                      }),
                    ],
                    shading: { fill: "F9F9F9", type: ShadingType.CLEAR },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: getVal(d.disclosingSigName),
                        bidirectional: t.rtl,
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: t.sigDateLabel,
                            bold: true,
                            font: t.font,
                          }),
                        ],
                        bidirectional: t.rtl,
                      }),
                    ],
                    shading: { fill: "F9F9F9", type: ShadingType.CLEAR },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: formatDate(d.disclosingSigDate),
                        bidirectional: t.rtl,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 300 } }),

          // Receiving Sig Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: heavyBorder,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: t.sigReceivingHeader,
                            bold: true,
                            size: 24,
                            font: t.font,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        bidirectional: t.rtl,
                      }),
                    ],
                    shading: { fill: "E8F4F8", type: ShadingType.CLEAR },
                    columnSpan: 2,
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: t.sigESigLabel,
                            bold: true,
                            font: t.font,
                          }),
                        ],
                        bidirectional: t.rtl,
                      }),
                    ],
                    shading: { fill: "F9F9F9", type: ShadingType.CLEAR },
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: d.receivingSig
                              ? `/ ${d.receivingSig} /`
                              : "_______________________________",
                            font: "Courier New",
                            italics: true,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: t.sigPrintedLabel,
                            bold: true,
                            font: t.font,
                          }),
                        ],
                        bidirectional: t.rtl,
                      }),
                    ],
                    shading: { fill: "F9F9F9", type: ShadingType.CLEAR },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: getVal(d.receivingSigName),
                        bidirectional: t.rtl,
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: t.sigDateLabel,
                            bold: true,
                            font: t.font,
                          }),
                        ],
                        bidirectional: t.rtl,
                      }),
                    ],
                    shading: { fill: "F9F9F9", type: ShadingType.CLEAR },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: formatDate(d.receivingSigDate),
                        bidirectional: t.rtl,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `NDA_${d.disclosingName || "Draft"}_${languageCode}.docx`);
};
