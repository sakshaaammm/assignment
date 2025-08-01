import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const actorId = searchParams.get("actorId") // This is the 'username~actor-name' format

    // Get API token from Authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 })
    }
    const apiToken = authHeader.substring(7) // Remove "Bearer "

    if (!actorId) {
      return NextResponse.json({ error: "Actor ID is required" }, { status: 400 })
    }

    const decodedActorId = decodeURIComponent(actorId)
    console.log(`Attempting to fetch metadata for actor (API Identifier): ${decodedActorId}`)

    let actorMetadataResponse: Response | null = null
    let lastError: { status: number; text: string } | null = null

    // Try fetching from user's own actors endpoint first
    const userActorUrl = `https://api.apify.com/v2/acts/${decodedActorId}`
    console.log(`Trying user actor metadata URL: ${userActorUrl}`)
    try {
      const response = await fetch(userActorUrl, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        actorMetadataResponse = response
        console.log(`Successfully fetched metadata from user actor URL: ${userActorUrl}`)
      } else {
        const responseText = await response.text()
        console.warn(
          `Failed to fetch metadata from user actor URL ${userActorUrl}: Status ${response.status}, Response: ${responseText}`,
        )
        lastError = { status: response.status, text: responseText }
      }
    } catch (error) {
      console.error(`Error fetching metadata from user actor URL ${userActorUrl}:`, error)
      lastError = { status: 500, text: error instanceof Error ? error.message : "Unknown network error" }
    }

    // If user actor fetch failed, try fetching from Apify Store actors endpoint
    if (!actorMetadataResponse || !actorMetadataResponse.ok) {
      const storeActorUrl = `https://api.apify.com/v2/store/acts/${decodedActorId}`
      console.log(`Trying store actor metadata URL: ${storeActorUrl}`)
      try {
        const response = await fetch(storeActorUrl, {
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          actorMetadataResponse = response
          console.log(`Successfully fetched metadata from store actor URL: ${storeActorUrl}`)
        } else {
          const responseText = await response.text()
          console.warn(
            `Failed to fetch metadata from store actor URL ${storeActorUrl}: Status ${response.status}, Response: ${responseText}`,
          )
          lastError = { status: response.status, text: responseText }
        }
      } catch (error) {
        console.error(`Error fetching metadata from store actor URL ${storeActorUrl}:`, error)
        lastError = { status: 500, text: error instanceof Error ? error.message : "Unknown network error" }
      }
    }

    // Final error handling if no response was successful
    if (!actorMetadataResponse || !actorMetadataResponse.ok) {
      console.error(`All attempts to fetch metadata for "${decodedActorId}" failed.`)
      let errorMessage = `Unable to fetch metadata for actor "${decodedActorId}".`

      if (lastError) {
        switch (lastError.status) {
          case 401:
            errorMessage = "Invalid API token. Please ensure your token is correct and has the necessary permissions."
            break
          case 403:
            errorMessage =
              "Access denied. The actor might be private or you don't have sufficient permissions to access its metadata."
            break
          case 404:
            errorMessage = `Actor not found or does not exist. Please check the actor ID and ensure it's correct.`
            break
          default:
            errorMessage += ` Apify responded with status ${lastError.status}.`
            break
        }
        errorMessage += ` Raw Apify response: ${lastError.text}`
      } else {
        errorMessage += " No specific error details available, possibly a network issue."
      }
      return NextResponse.json({ error: errorMessage }, { status: lastError?.status || 500 })
    }

    const actorMetadata = await actorMetadataResponse.json()
    return NextResponse.json({ actor: actorMetadata.data }) // Apify wraps data in a 'data' field
  } catch (error) {
    console.error("Error in get-actor-metadata route:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch actor metadata due to an unexpected error.",
      },
      { status: 500 },
    )
  }
}
