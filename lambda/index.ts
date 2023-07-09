import type { AwsLambdaGlobal } from "./awslambda";
import { createRequestHandler } from "./request-handler";
import * as build from "@remix-run/dev/server-build";

declare const awslambda: AwsLambdaGlobal;

const requestHandler = createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
});

export const handler = awslambda.streamifyResponse(
  (event, response, context) => {
    console.log("EVENT:", event);
    return requestHandler(event, response, context);
  }
);
