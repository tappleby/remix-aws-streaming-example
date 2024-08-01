import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Other | New Remix App" },
    { name: "description", content: "Other" },
  ];
};

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1 className="font-bold text-xl">Some other page</h1>

      <p className="mb-4">Lorem ipsum dolor sit amet consectetur adipisicing elit. Labore, velit quo repellendus vel suscipit, maiores magni corporis nostrum animi minima voluptas ducimus quam provident modi repellat fuga eveniet accusamus dolorem!</p>

      <Link className="underline" to="/">Home</Link>
    </div>
  );
}
