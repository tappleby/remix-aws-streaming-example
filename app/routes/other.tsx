import { Link } from "@remix-run/react";

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Some other page</h1>

      <Link to="/">Home</Link>
    </div>
  );
}
