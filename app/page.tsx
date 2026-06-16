import { redirect } from "next/navigation";

export default function Home() {
  // The product is the authenticated app; send everyone through the gate.
  redirect("/dashboard");
}
