import Citation from "@/components/citations/citation"
import type { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Citations",
  description: "Citations",
}

const CitationPage = () => {
  return (
    <div>
      <Suspense>
        <Citation />
      </Suspense>
    </div>
  )
}

export default CitationPage