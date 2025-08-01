"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Download, Table, Code, Eye, Sparkles } from "lucide-react"

interface ResultsDisplayProps {
  results: any[] // The results to display
  actorName: string
}

export function ResultsDisplay({ results, actorName }: ResultsDisplayProps) {
  const [viewMode, setViewMode] = useState<"table" | "json">("table")

  const downloadResults = () => {
    const dataStr = JSON.stringify(results, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `${actorName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_results.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const renderTableView = () => {
    if (results.length === 0) return null

    // Get all unique keys from all objects
    const allKeys = Array.from(new Set(results.flatMap((item) => Object.keys(item))))

    return (
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full border-collapse border border-purple-500/30 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50">
              {allKeys.map((key) => (
                <th key={key} className="border border-purple-500/30 px-4 py-3 text-left font-semibold text-purple-200">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((item, index) => (
              <tr key={index} className="hover:bg-purple-500/10 transition-colors">
                {allKeys.map((key) => (
                  <td key={key} className="border border-purple-500/20 px-4 py-3 text-purple-100">
                    {typeof item[key] === "object" ? JSON.stringify(item[key]) : String(item[key] || "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderJsonView = () => {
    return (
      <pre className="bg-black/40 text-green-400 p-6 rounded-lg overflow-x-auto text-sm border border-purple-500/30 glow-purple">
        {JSON.stringify(results, null, 2)}
      </pre>
    )
  }

  return (
    <Card className="gradient-card glow-purple">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/20">
                <Eye className="h-5 w-5 text-purple-400" />
              </div>
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Execution Results
              </span>
            </CardTitle>
            <CardDescription className="text-purple-200/70">Results from {actorName}</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-200 border-purple-500/30 px-3 py-1">
              <Sparkles className="h-3 w-3 mr-1" />
              {results.length} items
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadResults}
              className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 bg-transparent"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "table" | "json")}>
          <TabsList className="grid w-full grid-cols-2 bg-black/20 border border-purple-500/30">
            <TabsTrigger
              value="table"
              className="flex items-center gap-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-200"
            >
              <Table className="h-4 w-4" />
              Table View
            </TabsTrigger>
            <TabsTrigger
              value="json"
              className="flex items-center gap-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-200"
            >
              <Code className="h-4 w-4" />
              JSON View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-6">
            {results.length > 0 ? (
              renderTableView()
            ) : (
              <div className="text-center py-12 text-purple-300/70">
                <Eye className="h-12 w-12 mx-auto mb-4 text-purple-400/50" />
                No results to display
              </div>
            )}
          </TabsContent>

          <TabsContent value="json" className="mt-6">
            {results.length > 0 ? (
              renderJsonView()
            ) : (
              <div className="text-center py-12 text-purple-300/70">
                <Code className="h-12 w-12 mx-auto mb-4 text-purple-400/50" />
                No results to display
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
