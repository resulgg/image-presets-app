"use client";

import dynamic from "next/dynamic";

const ImageEditor = dynamic(() => import("@/components/ImageEditor"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="min-h-screen">
      <ImageEditor />
    </main>
  );
}
