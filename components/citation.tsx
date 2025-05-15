"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Copy, FileText } from "lucide-react"
import { toast } from "./toast"

const citationStyles = ["APA", "Harvard", "MLA", "Chicago", "IEEE", "Vancouver", "Turabian"]

export default function CitationPage() {
  const [doi, setDoi] = useState("")
  const [style, setStyle] = useState(citationStyles[0])
  const [citation, setCitation] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerateCitation = async () => {
    if (!doi) {
      toast({
        type: "error",
        description: "Please enter a DOI",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/citation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doi, style }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate citation")
      }

      const data = await response.json()
      setCitation(data.citation)
      toast({
        type: "success",
        description: "Citation generated successfully",
      })
    } catch (error) {
      if (error instanceof Error) {
        console.error(error)
        toast({
          type: "error",
          description: error.message,
        })
      } else {
        toast({
          type: "error",
          description: "An error occurred while generating the citation.",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (citation) {
      navigator.clipboard.writeText(citation)
      toast({
        type: "success",
        description: "Citation copied to clipboard",
      })
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="mr-2 size-4" />
            Back to Home
          </Link>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Generate Citation</CardTitle>
            <CardDescription>Enter a DOI and select a citation style to generate a formatted citation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="doi"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Digital Object Identifier (DOI)
              </label>
              <Input id="doi" placeholder="e.g., 10.1000/xyz123" value={doi} onChange={(e) => setDoi(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="style"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Citation Style
              </label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a citation style" />
                </SelectTrigger>
                <SelectContent>
                  {citationStyles.map((citationStyle) => (
                    <SelectItem key={citationStyle} value={citationStyle}>
                      {citationStyle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleGenerateCitation} className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="mr-2">Generating...</span>
                  <span className="animate-spin">⟳</span>
                </>
              ) : (
                <>
                  <FileText className="mr-2 size-4" />
                  Generate Citation
                </>
              )}
            </Button>
          </CardContent>

          {citation && (
            <CardFooter className="flex flex-col items-start">
              <div className="w-full p-4 rounded-md bg-muted">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-sm">Generated Citation:</h3>
                  <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-8 px-2">
                    <Copy className="size-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <p className="text-sm break-words">{citation}</p>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
