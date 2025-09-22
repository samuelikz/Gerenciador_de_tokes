// app/dashboard/page.tsx
"use client"

import dynamic from "next/dynamic"
import { SectionCards } from "@/components/section-cards"

const ChartAreaInteractive = dynamic(
  () => import("@/components/chart-area-interactive").then(m => m.ChartAreaInteractive),
  { ssr: false }
)

export default function Page() {
  return (
    <>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
    </>
  )
}
