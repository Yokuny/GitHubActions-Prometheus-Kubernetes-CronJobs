import * as cron from "node-cron";
import { reqPatientAnalytics } from "../services/analytics.service";

export const startCronJobs = (): void => {
  cron.schedule(
    // "*/1 * * * *",
    "0 2 * * *",
    async () => {
      console.log(`[LOG] Rodando Cron Job: ${new Date().toLocaleString("pt-BR")}`);
      await reqPatientAnalytics();
    },
    {
      timezone: "America/Sao_Paulo",
    },
  );
};

export const shutdownCronJobs = (): void => {
  cron.getTasks().forEach((task, _name) => {
    task.stop();
  });
};
