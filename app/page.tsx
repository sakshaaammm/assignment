"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Play, Key, Database, Sparkles, Zap, Code2 } from "lucide-react"
import { ActorForm } from "./components/actor-form"
import { ResultsDisplay } from "./components/results-display"
import type { Actor } from "@/types/actor"

interface RunResult {
  success: boolean
  data?: any[]
  error?: string
  runId?: string
}

export default function ApifyIntegrationApp() {
  const [apiKey, setApiKey] = useState("")
  const [actors, setActors] = useState<Actor[]>([])
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null)
  const [schema, setSchema] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [actorMetadata, setActorMetadata] = useState<any>(null)

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim()) {
      setError("Please enter your Apify API key")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/list-actors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({}),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch actors")
      }

      setActors(data.actors)
      setIsAuthenticated(true)
      setSuccess(`Successfully loaded ${data.actors.length} actors`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to authenticate")
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const handleActorSelect = async (actorId: string) => {
    const actor = actors.find((a) => a.id === actorId)
    if (!actor) return

    setSelectedActor(actor)
    setLoading(true)
    setError("") // Clear previous errors
    setSchema(null) // Clear schema when a new actor is selected

    try {
      const encodedActorId = encodeURIComponent(actor.id)

      const response = await fetch(`/api/get-schema?actorId=${encodedActorId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch schema")
      }

      setSchema(data.schema)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch actor schema")
    } finally {
      setLoading(false)
    }
  }

  const handleRunActor = async (formData: any) => {
    if (!selectedActor) return

    setLoading(true)
    setError("")
    setSuccess("")
    setResults([])

    try {
      const response = await fetch("/api/run-actor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          actorId: selectedActor.id,
          input: formData,
        }),
      })

      const data: RunResult = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run actor")
      }

      if (data.success && data.data) {
        setResults(data.data)
        setSuccess(`Actor executed successfully! Retrieved ${data.data.length} items`)
      } else {
        setError("Actor execution completed but no data was returned")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute actor")
    } finally {
      setLoading(false)
    }
  }

  const resetApp = () => {
    setApiKey("")
    setActors([])
    setSelectedActor(null)
    setSchema(null)
    setResults([])
    setIsAuthenticated(false)
    setError("")
    setSuccess("")
  }

  const fetchActorInfo = async (actorId: string, token: string) => {
    setLoading(true)
    setError("")
    setActorMetadata(null)

    try {
      const encodedActorId = encodeURIComponent(actorId)
      const res = await fetch(`/api/get-actor-metadata?actorId=${encodedActorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch actor metadata")
      }

      setActorMetadata(data.actor)
      setSuccess(`Successfully fetched metadata for ${data.actor.name}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch actor metadata")
    } finally {
      setLoading(false)
    }
  }

  const handleFetchActorInfo = () => {
    if (selectedActor && apiKey) {
      fetchActorInfo(selectedActor.id, apiKey)
    } else {
      setError("Please select an actor and ensure your API key is entered.")
    }
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center py-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 glow-purple">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Apify Integration Platform
            </h1>
            <div className="p-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-500 glow-purple">
              <Code2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <p className="text-xl text-purple-200/80 max-w-2xl mx-auto">
            Execute and manage your Apify actors with dynamic forms in a beautiful dark interface
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Zap className="h-5 w-5 text-yellow-400" />
            <span className="text-purple-300/70">Powered by AI • Real-time Execution • Dynamic Forms</span>
            <Zap className="h-5 w-5 text-yellow-400" />
          </div>
        </div>

        {/* Authentication Card */}
        {!isAuthenticated && (
          <div className="flex justify-center">
            <Card className="w-full max-w-md gradient-card glow-purple-strong animate-glow">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                  <div className="p-2 rounded-full bg-purple-500/20">
                    <Key className="h-6 w-6 text-purple-400" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                    Authentication
                  </span>
                </CardTitle>
                <CardDescription className="text-purple-200/70">
                  Enter your Apify API key to unlock the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleApiKeySubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey" className="text-purple-200 font-medium">
                      Apify API Key
                    </Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="apify_api_..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      disabled={loading}
                      className="bg-black/20 border-purple-500/30 text-white placeholder:text-purple-300/50 focus:border-purple-400 focus:ring-purple-400/20"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full gradient-button hover:scale-105 transition-all duration-200 text-white font-semibold py-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Connecting to Apify...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Connect to Apify
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Application */}
        {isAuthenticated && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Left Column - Actor Selection and Form */}
            <div className="space-y-6">
              {/* Actor Selection */}
              <Card className="gradient-card glow-purple">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-purple-500/20">
                        <Database className="h-5 w-5 text-purple-400" />
                      </div>
                      <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                        Actor Selection
                      </span>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetApp}
                      className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 bg-transparent"
                    >
                      Disconnect
                    </Button>
                  </CardTitle>
                  <CardDescription className="text-purple-200/70">
                    Choose an actor to execute ({actors.length} available)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select onValueChange={handleActorSelect}>
                    <SelectTrigger className="bg-black/20 border-purple-500/30 text-white">
                      <SelectValue placeholder="Select an actor..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-purple-500/30">
                      {actors.map((actor) => (
                        <SelectItem
                          key={actor.id}
                          value={actor.id}
                          className="text-white hover:bg-purple-500/20 focus:bg-purple-500/20"
                        >
                          <div>
                            <div className="font-medium text-purple-200">{actor.title || actor.name}</div>
                            <div className="text-sm text-purple-400/70">{actor.fullName}</div>
                            {actor.description && (
                              <div className="text-sm text-purple-300/50 truncate max-w-xs">{actor.description}</div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Dynamic Form or Schema Not Available Message */}
              {selectedActor && schema && (
                <Card className="gradient-card glow-purple">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-purple-500/20">
                        <Play className="h-5 w-5 text-purple-400" />
                      </div>
                      <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                        Configure & Execute
                      </span>
                    </CardTitle>
                    <CardDescription className="text-purple-200/70">
                      Configure parameters for {selectedActor.title || selectedActor.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ActorForm schema={schema} onSubmit={handleRunActor} loading={loading} />
                  </CardContent>
                </Card>
              )}

              {selectedActor && !schema && !loading && error && (
                <Card className="gradient-card glow-purple">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-red-500/20">
                        <Code2 className="h-5 w-5 text-red-400" />
                      </div>
                      <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                        Schema Not Available
                      </span>
                    </CardTitle>
                    <CardDescription className="text-red-200/70">{error}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-300/80">
                      Please try selecting a different actor, or ensure the selected actor has a defined input schema
                      and your API key has the necessary permissions.
                    </p>
                  </CardContent>
                </Card>
              )}

              {selectedActor && (
                <Card className="gradient-card glow-purple">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-purple-500/20">
                        <Code2 className="h-5 w-5 text-purple-400" />
                      </div>
                      <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                        Actor Details
                      </span>
                    </CardTitle>
                    <CardDescription className="text-purple-200/70">
                      View detailed metadata for {selectedActor.title || selectedActor.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={handleFetchActorInfo}
                      className="w-full gradient-button hover:scale-105 transition-all duration-200 text-white font-semibold py-3"
                      disabled={loading}
                    >
                      {loading && actorMetadata === null ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Fetching Details...
                        </>
                      ) : (
                        <>
                          <Code2 className="mr-2 h-5 w-5" />
                          Fetch Actor Metadata
                        </>
                      )}
                    </Button>
                    {actorMetadata && (
                      <div className="bg-black/40 text-green-400 p-4 rounded-lg overflow-x-auto text-sm border border-purple-500/30 glow-purple">
                        <pre>{JSON.stringify(actorMetadata, null, 2)}</pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Results */}
            <div className="space-y-6">
              {results.length > 0 && (
                <ResultsDisplay results={results} actorName={selectedActor?.title || selectedActor?.name || ""} />
              )}
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <Alert variant="destructive" className="max-w-3xl mx-auto bg-red-900/20 border-red-500/30 glow-purple">
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="max-w-3xl mx-auto bg-green-900/20 border-green-500/30 glow-purple">
            <AlertDescription className="text-green-300">{success}</AlertDescription>
          </Alert>
        )}

        {/* Loading Overlay */}
        {loading && selectedActor && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="gradient-card glow-purple-strong animate-glow">
              <CardContent className="p-8">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
                    <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-purple-400/20"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-xl text-purple-200">Processing...</p>
                    <p className="text-purple-300/70">{schema ? "Executing actor..." : "Loading schema..."}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
