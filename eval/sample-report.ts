import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const SAMPLE_FILE_NAME = "riverbend-solar-pilot-report.pdf";

export const SAMPLE_PAGES = [
  `RIVERBEND COMMUNITY SOLAR PILOT - EXECUTIVE OVERVIEW

The Riverbend Community Solar Pilot ran for 18 months from January 2024 through June 2025. It served 240 households in the Northbank and East Junction neighborhoods. The pilot installed 1.2 megawatts of solar capacity across three municipal sites.

The program was designed to test whether shared solar could reduce household electricity costs while improving local energy resilience. Enrollment prioritized renters and households below 80 percent of the area median income. The city energy office managed the pilot with Riverbend Electric Cooperative and two neighborhood associations.`,
  `PROGRAM DESIGN AND OPERATIONS

The three installation sites were the Northbank Library, East Junction Transit Depot, and Riverbend Water Treatment Plant. Capacity was divided into 0.3 MW at the library, 0.4 MW at the transit depot, and 0.5 MW at the water treatment plant.

Each participating household received bill credits based on its allocated share of monthly generation. No household paid an enrollment fee. A multilingual support team offered assistance in English, Spanish, and Bengali. Preventive maintenance occurred every quarter, while panel cleaning was scheduled twice per year.`,
  `ENERGY AND HOUSEHOLD RESULTS

The installations generated 1.84 gigawatt-hours of electricity during the 18-month pilot. Average system uptime was 96.4 percent. Output was lowest during two weeks of inverter maintenance at the transit depot.

Participating households experienced an average electricity bill reduction of 23 percent, equal to about 31 dollars per month. Ninety percent of participants received credits in every month of the pilot. The project avoided an estimated 1,120 metric tons of carbon dioxide equivalent compared with the regional grid mix.`,
  `PARTICIPANT AND WORKFORCE OUTCOMES

In the final participant survey, 82 percent of respondents rated the program good or excellent. Seventy-six percent said their energy bills had become easier to predict. The most common complaint was that monthly credit calculations were difficult to understand.

The pilot also funded a paid solar training program for 36 local residents. Thirty-one participants completed the course, and 19 obtained energy-sector employment within three months. The neighborhood associations hosted eight public workshops with a combined attendance of 410 people.`,
  `FINANCIAL PERFORMANCE

Total project cost was 2.4 million dollars. A state clean-energy grant covered 55 percent, the city issued a green bond for 30 percent, and Riverbend Electric Cooperative contributed the remaining 15 percent.

The installations are expected to produce 184,000 dollars in annual electricity savings and renewable-energy value. The modeled simple payback period is 12 years. Operating and maintenance costs averaged 38,000 dollars per year during the pilot. No cost overruns were recorded, although interconnection approval delayed construction by seven weeks.`,
  `CONCLUSIONS AND RECOMMENDATIONS

The evaluation concluded that shared solar can materially reduce bills for renters and lower-income households when enrollment has no upfront fee. The strongest results were consistent bill credits, high system uptime, and strong participant satisfaction.

The report recommends expanding total community-solar capacity to 2.5 MW, adding battery storage at the transit depot, simplifying bill-credit statements, and continuing multilingual enrollment support. Before expansion, the city should complete a battery fire-safety review and negotiate a faster interconnection timeline with the utility. The proposed expansion should retain priority enrollment for households below 80 percent of area median income.`,
] as const;

function wrapText(
  text: string,
  width: number,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  size: number,
) {
  const lines: string[] = [];

  for (const paragraph of text.split("\n")) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }

  return lines;
}

export async function createSamplePdf() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  SAMPLE_PAGES.forEach((content, index) => {
    const page = pdf.addPage([612, 792]);
    const [heading, ...bodyParts] = content.split("\n");
    page.drawText(heading, {
      x: 54,
      y: 730,
      size: 15,
      font: bold,
      color: rgb(0.12, 0.29, 0.21),
    });

    const lines = wrapText(bodyParts.join("\n").trim(), 504, font, 11);
    let y = 690;
    for (const line of lines) {
      if (line) page.drawText(line, { x: 54, y, size: 11, font });
      y -= line ? 18 : 10;
    }

    page.drawText(`Riverbend Solar Pilot | Page ${index + 1}`, {
      x: 54,
      y: 36,
      size: 9,
      font,
      color: rgb(0.42, 0.45, 0.42),
    });
  });

  return pdf.save();
}
