import type { Metadata } from "next";
import { Hero } from "./components/Hero";
import { HomeSections } from "./components/HomeSections";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main id="conteudo">
      <Hero />
      <HomeSections />
    </main>
  );
}
