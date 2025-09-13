import { ChartAreaInteractive } from "~/components/chart-area-interactive"
import { SectionCards } from "~/components/section-cards"


export default function Page() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <SectionCards />
      <ChartAreaInteractive />
    </div>
  )
}
