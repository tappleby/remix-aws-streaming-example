import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from "aws-lambda";
import type { Writable } from "stream";

export type AWSResponseStream = Writable;

export type AWSStreamResponseMetadata = Pick<
  APIGatewayProxyStructuredResultV2,
  "statusCode" | "headers" | "cookies"
>;

export type AwsLambdaGlobal = {
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
