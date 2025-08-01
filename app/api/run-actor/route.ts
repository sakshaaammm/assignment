import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { actorId, input } = await request.json() // actorId is 'username~actor-name', apiToken is now from header

    // Get API token from Authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 })
    }
    const apiToken = authHeader.substring(7) // Remove "Bearer "

    if (!actorId) {
      return NextResponse.json({ error: "Actor ID is required" }, { status: 400 })
    }

    const actorIdentifier = actorId

    console.log(`Attempting to start actor run for (API Identifier): ${actorIdentifier}`)

    // Try multiple possible URLs for running the actor
    const possibleRunUrls = [
      `https://api.apify.com/v2/acts/${actorIdentifier}/runs`, // Standard for user's own actors
      `https://api.apify.com/v2/store/acts/${actorIdentifier}/runs`, // For public store actors
    ]

    let runResponse: Response | null = null
    let lastError: any = null

    for (const url of possibleRunUrls) {
      console.log(`Trying run URL: ${url}`)
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`, // Re-added Authorization header
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input || {}),
        })

        if (response.ok) {
          runResponse = response
          console.log(`Successfully started run from: ${url}`)
          break // Found a working URL, exit loop
        } else {
          const responseText = await response.text()
          console.warn(`Failed to start run from ${url}: Status ${response.status}, Response: ${responseText}`)
          lastError = { status: response.status, text: responseText }
        }
      } catch (error) {
        console.error(`Error starting run from ${url}:`, error)
        lastError = { status: 500, text: error instanceof Error ? error.message : "Unknown network error" }
      }
    }

    if (!runResponse || !runResponse.ok) {
      console.error(`All attempts to start actor run for "${actorIdentifier}" failed.`)
      if (lastError?.status === 401) {
        return NextResponse.json({ error: "Invalid API token" }, { status: 401 })
      }
      if (lastError?.status === 404) {
        return NextResponse.json(
          {
            error: `Actor not found: ${actorIdentifier}. Make sure the actor exists and is accessible with your API token. Last error: ${lastError?.text || "Unknown error"}`,
          },
          { status: 404 },
        )
      }
      return NextResponse.json(
        {
          error: `Failed to start actor run. ${lastError?.text || "Unknown error"}`,
        },
        { status: lastError?.status || 500 },
      )
    }

    const runData = await runResponse.json()
    const runId = runData.data.id

    console.log(`Actor run started with ID: ${runId}`)

    // Poll for completion
    let attempts = 0
    const maxAttempts = 60 // 5 minutes with 5-second intervals (60 * 5s = 300s)

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait 5 seconds

      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: {
          Authorization: `Bearer ${apiToken}`, // Re-added Authorization header
          "Content-Type": "application/json",
        },
      })

      if (!statusResponse.ok) {
        throw new Error(`Failed to check run status: ${statusResponse.status}`)
      }

      const statusData = await statusResponse.json()
      const status = statusData.data.status

      console.log(`Actor run ${runId} status: ${status}`)

      if (status === "SUCCEEDED") {
        // Get the dataset items
        const datasetId = statusData.data.defaultDatasetId

        if (datasetId) {
          const itemsResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items`, {
            headers: {
              Authorization: `Bearer ${apiToken}`, // Re-added Authorization header
              "Content-Type": "application/json",
            },
          })

          if (itemsResponse.ok) {
            const items = await itemsResponse.json()
            console.log(`Retrieved ${items.length} items from dataset`)
            return NextResponse.json({
              success: true,
              data: items,
              runId,
            })
          }
        }

        return NextResponse.json({
          success: true,
          data: [],
          runId,
        })
      } else if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
        return NextResponse.json(
          {
            error: `Actor run ${status.toLowerCase()}: ${statusData.data.statusMessage || "No additional details"}`,
          },
          { status: 400 },
        )
      }

      attempts++
    }

    // Timeout
    return NextResponse.json({ error: "Actor run timed out after 5 minutes" }, { status: 408 })
  } catch (error) {
    console.error("Error in run-actor route:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to execute actor",
      },
      { status: 500 },
    )
  }
}
