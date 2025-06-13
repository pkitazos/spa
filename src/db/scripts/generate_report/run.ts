import { runReportGeneration } from "./shared/pdf-generator";
import { moderatedReportConfig } from "./configs/moderated-report-config";
import { standardReportConfig } from "./configs/standard-report-config";

async function main() {
  const reportType = process.argv[2];

  switch (reportType) {
    case "moderated":
      await runReportGeneration(moderatedReportConfig);
      break;
    case "standard":
      await runReportGeneration(standardReportConfig);
      break;
    default:
      console.error("Usage: npm run generate-reports [moderated|standard]");
      process.exit(1);
  }
}

main().catch(console.error);
