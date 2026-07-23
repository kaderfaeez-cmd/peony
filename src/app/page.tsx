import type { Metadata } from "next";
import { Landing } from "@/features/landing/Landing";

export const metadata: Metadata = {
  title: "Peony — a calm place to plan your days",
};

export default function LandingPage() {
  return <Landing />;
}
