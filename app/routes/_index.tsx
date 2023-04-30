import { V2_MetaFunction, defer } from "@remix-run/node";

import { Suspense } from "react";
import type { LoaderArgs } from "@remix-run/node";
import { Await, Link, useLoaderData } from "@remix-run/react";

export function loader({ params }: LoaderArgs) {
  return defer({
    fastData: "This is some fast data",
    slowData: new Promise((resolve) => {
      setTimeout(() => {
        resolve("This is some slow data");
      }, 4000);
    }),
  });
}

export const meta: V2_MetaFunction = () => {
  return [{ title: "New Remix App" }];
};

export default function Index() {
  const data = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to Remix</h1>

      <p>
        <strong>Fast Data:</strong>
        {data.fastData}
      </p>

      <p>
        <strong>Slow Data:</strong>
        <Suspense fallback={<span>loading...</span>}>
          <Await
            resolve={data.slowData}
            errorElement={<span>Error loading slow data!</span>}
          >
            {(slowData) => <span>{slowData}</span>}
          </Await>
        </Suspense>
      </p>

      <Link to="/other">Other</Link>
    </div>
  );
}
