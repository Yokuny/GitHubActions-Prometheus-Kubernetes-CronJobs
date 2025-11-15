import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application, json, type Request, type Response, urlencoded } from "express";
import responseTime from "response-time";

import { corsOptions, dbConnect, startCronJobs } from "./config";
import metricsApp, { reqResTime } from "./metrics";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import * as route from "./routers";

const app: Application = express();

app
  .use(urlencoded({ extended: false }))
  .use(json())
  .use(cookieParser())
  .use(cors(corsOptions))
  .get("/", (_req: Request, res: Response) => {
    res.send("Bem-vindo ao sistema de gerenciamento de clínicas!");
  })
  .get("/health", (_req: Request, res: Response) => {
    res.send(new Date());
  })
  .use(
    responseTime((req: Request, res: Response, time: number) => {
      reqResTime.observe(
        {
          method: req.method,
          route: req.baseUrl + req.route.path,
          status_code: res.statusCode,
        },
        time / 1000,
      );
    }),
  )
  .use("/auth", route.authRoute)
  .use("/schedule", route.scheduleRoute)
  .use("/patient", route.patientRoute)
  .use("/financial", route.financialRoute)
  .use("/odontogram", route.odontogramRoute)
  .use("/s3", route.s3Route)
  .use("/clinic", route.clinicRoute)
  .use("/user", route.userRoute)
  .use("/passkey", route.passkeyRoute)
  .use("/procedure", route.procedureRoute)
  .use(metricsApp);

app.use("*", (_req: Request, res: Response) => {
  res.status(404).send({ message: "Rota não encontrada! 🤷‍♂️" });
});

app.use(errorHandler);

export function init(): Promise<express.Application> {
  dbConnect();
  startCronJobs();
  return Promise.resolve(app);
}

export default app;
