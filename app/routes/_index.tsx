import { defer, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { Await, Link, useLoaderData } from "@remix-run/react";
import { Suspense } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export function loader({ params }: LoaderFunctionArgs) {
  return defer({
    fastData: "This is some fast data",
    slowData: new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve("This is some slow data");
      }, 4000);
    }),
  });
}

export default function Index() {
  const data = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1 className="font-bold text-xl">Welcome to Remix</h1>

      <p>
        <strong>Fast Data:</strong>
        {data.fastData}
      </p>

      <p className="mb-4">
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

      <Link className="underline" to="/other">Other</Link>
    </div>
  );
}
