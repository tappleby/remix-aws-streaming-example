import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from "aws-lambda";
import type { Writable } from "stream";
import { createRequestHandler } from "./request-handler";
import * as build from "@remix-run/dev/server-build";

export type AWSResponseStream = Writable;

export type AWSStreamResponseMetadata = Pick<
  APIGatewayProxyStructuredResultV2,
  "statusCode" | "headers" | "cookies"
>;

declare const awslambda: {
  streamifyResponse: (
    handler: (
      event: APIGatewayProxyEventV2,
      response: AWSResponseStream,
      context: Context
    ) => Promise<void>
  ) => any;
  HttpResponseStream: {
    from: (
      stream: AWSResponseStream,
      httpResponseMetadata: AWSStreamResponseMetadata
    ) => AWSResponseStream;
  };
};

export const handler = awslambda.streamifyResponse(
  createRequestHandler({
    build,
    mode: process.env.NODE_ENV,
  })
);
