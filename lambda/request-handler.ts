import type {
  AppLoadContext,
  ServerBuild,
  RequestInit as NodeRequestInit,
  Response as NodeResponse,
} from "@remix-run/node";
import {
  createRequestHandler as createRemixRequestHandler,
  Headers as NodeHeaders,
  Request as NodeRequest,
  writeReadableStreamToWritable,
} from "@remix-run/node";
import type {
  APIGatewayProxyEventHeaders,
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from "aws-lambda";

import type { Writable } from "stream";
import type { AwsLambdaGlobal } from "./awslambda";

declare const awslambda: AwsLambdaGlobal;

/**
 * A function that returns the value to use as `context` in route `loader` and
 * `action` functions.
 *
 * You can think of this as an escape hatch that allows you to pass
 * environment/platform-specific values through to your loader/action.
 */
export type GetLoadContextFunction = (
  event: APIGatewayProxyEventV2
) => AppLoadContext;

export type StreamingRequestHandler = (
  event: APIGatewayProxyEventV2,
  responseStream: Writable,
  context: Context
) => Promise<void>;

/**
 * Returns a request handler for Architect that serves the response using
 * Remix.
 */
export function createRequestHandler({
  build,
  getLoadContext,
  mode = process.env.NODE_ENV,
}: {
  build: ServerBuild;
  getLoadContext?: GetLoadContextFunction;
  mode?: string;
}): StreamingRequestHandler {
  let handleRequest = createRemixRequestHandler(build, mode);

  return async (event, responseStream, _context) => {
    let request = createRemixRequest(event, responseStream);
    let loadContext = getLoadContext?.(event);

    let response = (await handleRequest(request, loadContext)) as NodeResponse;

    return sendRemixResponse(response, responseStream);
  };
}

export function createRemixRequest(
  event: APIGatewayProxyEventV2,
  res: Writable
): NodeRequest {
  let host = event.headers["x-forwarded-host"] || event.headers.host;
  let search = event.rawQueryString.length ? `?${event.rawQueryString}` : "";
  let scheme = process.env.ARC_SANDBOX ? "http" : "https";
  let url = new URL(`${scheme}://${host}${event.rawPath}${search}`);
  let isFormData = event.headers["content-type"]?.includes(
    "multipart/form-data"
  );

  let controller = new AbortController();
  res.on("close", () => controller.abort());

  return new NodeRequest(url.href, {
    method: event.requestContext.http.method,
    headers: createRemixHeaders(event.headers, event.cookies),
    signal: controller.signal,
    body:
      event.body && event.isBase64Encoded
        ? isFormData
          ? Buffer.from(event.body, "base64")
          : Buffer.from(event.body, "base64").toString()
        : event.body,
  });
}

export function createRemixHeaders(
  requestHeaders: APIGatewayProxyEventHeaders,
  requestCookies?: string[]
): NodeHeaders {
  let headers = new NodeHeaders();

  for (let [header, value] of Object.entries(requestHeaders)) {
    if (value) {
      headers.append(header, value);
    }
  }

  if (requestCookies) {
    headers.append("Cookie", requestCookies.join("; "));
  }

  return headers;
}

export async function sendRemixResponse(
  nodeResponse: NodeResponse,
  res: Writable
): Promise<void> {
  let cookies: string[] = [];

  // Lambda function urls return cookies outside of headers
  for (let [key, value] of nodeResponse.headers.entries()) {
    if (key.toLowerCase() === "set-cookie") {
      cookies.push(value);
    }
  }

  if (cookies.length) {
    nodeResponse.headers.delete("Set-Cookie");
  }

  let metadata: APIGatewayProxyStructuredResultV2 = {
    statusCode: nodeResponse.status,
    headers: Object.fromEntries(nodeResponse.headers.entries()),
    cookies,
  };

  let httpResponseStream = awslambda.HttpResponseStream.from(
    res,
    metadata
  ) as Writable;

  if (nodeResponse.body) {
    await writeReadableStreamToWritable(nodeResponse.body, httpResponseStream);
  } else {
    res.end();
  }
}
