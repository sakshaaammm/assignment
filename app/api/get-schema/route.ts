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

    console.log(`Attempting to fetch schema for actor (API Identifier): ${decodedActorId}`)

    let schemaResponse: Response | null = null
    let lastError: { status: number; text: string } | null = null

    // --- Attempt 1: Fetch schema directly from common paths ---
    const directSchemaUrls = [
      `https://api.apify.com/v2/acts/${decodedActorId}/input-schema`, // Standard for user's own actors
      `https://api.apify.com/v2/store/acts/${decodedActorId}/input-schema`, // For public store actors
    ]

    for (const url of directSchemaUrls) {
      console.log(`Trying direct schema URL: ${url}`)
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          schemaResponse = response
          console.log(`Successfully fetched schema directly from: ${url}`)
          break // Found a working URL, exit loop
        } else {
          const responseText = await response.text()
          console.warn(
            `Failed to fetch schema directly from ${url}: Status ${response.status}, Response: ${responseText}`,
          )
          lastError = { status: response.status, text: responseText }
        }
      } catch (error) {
        console.error(`Error fetching schema directly from ${url}:`, error)
        lastError = { status: 500, text: error instanceof Error ? error.message : "Unknown network error" }
      }
    }

    // --- Attempt 2: If direct fetch fails, try fetching from the latest version's schema ---
    if (!schemaResponse || !schemaResponse.ok) {
      console.log(`Direct schema fetch failed. Attempting to fetch from latest version for ${decodedActorId}.`)
      const versionUrls = [
        `https://api.apify.com/v2/acts/${decodedActorId}/versions`,
        `https://api.apify.com/v2/store/acts/${decodedActorId}/versions`,
      ]

      let latestVersionSchemaUrl: string | null = null

      for (const versionUrl of versionUrls) {
        console.log(`Trying version list URL: ${versionUrl}`)

        try {
          const versionsResponse = await fetch(versionUrl, {
            headers: {
              Authorization: `Bearer ${apiToken}`,
              "Content-Type": "application/json",
            },
          })

          if (versionsResponse.ok) {
            const versionsData = await versionsResponse.json()
            if (versionsData.data && versionsData.data.items && versionsData.data.items.length > 0) {
              // Sort by versionNumber to get the latest
              const latestVersion = versionsData.data.items.sort((a: any, b: any) => {
                const aNum = Number.parseFloat(a.versionNumber)
                const bNum = Number.parseFloat(b.versionNumber)
                if (!isNaN(aNum) && !isNaN(bNum)) {
                  return bNum - aNum
                }
                return b.versionNumber.localeCompare(a.versionNumber)
              })[0]

              // Construct schema URL for the latest version
              const baseUrl = versionUrl.substring(0, versionUrl.lastIndexOf("/versions"))
              latestVersionSchemaUrl = `${baseUrl}/versions/${latestVersion.versionNumber}/input-schema`
              console.log(
                `Found latest version ${latestVersion.versionNumber}. Trying schema URL: ${latestVersionSchemaUrl}`,
              )
              break // Found versions, exit loop
            } else {
              console.warn(`No versions found from ${versionUrl}.`)
            }
          } else {
            const responseText = await versionsResponse.text()
            console.warn(
              `Failed to fetch versions from ${versionUrl}: Status ${versionsResponse.status}, Response: ${responseText}`,
            )
            lastError = { status: versionsResponse.status, text: responseText }
          }
        } catch (error) {
          console.error(`Error fetching versions from ${versionUrl}:`, error)
          lastError = { status: 500, text: error instanceof Error ? error.message : "Unknown network error" }
        }
      }

      if (latestVersionSchemaUrl) {
        try {
          const response = await fetch(latestVersionSchemaUrl, {
            headers: {
              Authorization: `Bearer ${apiToken}`,
              "Content-Type": "application/json",
            },
          })
          if (response.ok) {
            schemaResponse = response
            console.log(`Successfully fetched schema from latest version URL: ${latestVersionSchemaUrl}`)
          } else {
            const responseText = await response.text()
            console.warn(
              `Failed to fetch schema from latest version URL ${latestVersionSchemaUrl}: Status ${response.status}, Response: ${responseText}`,
            )
            lastError = { status: response.status, text: responseText }
          }
        } catch (error) {
          console.error(`Error fetching schema from latest version URL ${latestVersionSchemaUrl}:`, error)
          lastError = { status: 500, text: error instanceof Error ? error.message : "Unknown network error" }
        }
      } else {
        console.warn(`Could not determine latest version schema URL for ${decodedActorId}.`)
      }
    }

    // --- Final Error Handling ---
    if (!schemaResponse || !schemaResponse.ok) {
      console.error(`All attempts to fetch schema for "${decodedActorId}" failed.`)
      let errorMessage = `Unable to fetch schema for actor "${decodedActorId}".`

      if (lastError) {
        switch (lastError.status) {
          case 401:
            errorMessage = "Invalid API token. Please ensure your token is correct and has the necessary permissions."
            break
          case 403:
            errorMessage =
              "Access denied. The actor might be private or you don't have sufficient permissions to access its schema."
            break
          case 404:
            // Refined message for 404 when fetching schema
            errorMessage = `No input schema found for this actor, or it's not publicly accessible. The actor itself might exist, but its input schema could not be retrieved.`
            break
          default:
            errorMessage += ` Apify responded with status ${lastError.status}.`
            break
        }
        // Always include the raw response text for debugging
        errorMessage += ` Raw Apify response: ${lastError.text}`
      } else {
        errorMessage +=
          " No specific error details available, possibly a network issue or the actor has no defined input schema."
      }
      return NextResponse.json({ error: errorMessage }, { status: lastError?.status || 500 })
    }

    const schema = await schemaResponse.json()

    if (!schema || typeof schema !== "object" || Object.keys(schema).length === 0) {
      return NextResponse.json({ error: "No valid input schema found for this actor." }, { status: 404 })
    }

    return NextResponse.json({ schema })
  } catch (error) {
    console.error("Error in get-schema route:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch actor schema due to an unexpected error.",
      },
      { status: 500 },
    )
  }
}
