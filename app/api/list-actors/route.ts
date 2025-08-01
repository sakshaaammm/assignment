import { type NextRequest, NextResponse } from "next/server"
import type { Actor } from "@/types/actor"

export async function POST(request: NextRequest) {
  try {
    // Get API token from Authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 })
    }
    const apiToken = authHeader.substring(7) // Remove "Bearer "

    const allActors: Actor[] = []
    const uniqueApiIdentifiers = new Set<string>()

    // 1. Fetch user's own actors
    try {
      const userActorsResponse = await fetch(`https://api.apify.com/v2/acts`, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      })

      if (userActorsResponse.ok) {
        const data = await userActorsResponse.json()
        if (data.data && data.data.items) {
          data.data.items.forEach((actor: any) => {
            const apiIdentifier = `${actor.username}~${actor.name}`
            if (!uniqueApiIdentifiers.has(apiIdentifier)) {
              allActors.push({
                id: apiIdentifier, // Use apiIdentifier as the primary ID for frontend selection
                internalId: actor.id, // Apify's actual internal ID
                name: actor.name,
                title: actor.title,
                description: actor.description,
                username: actor.username,
                fullName: `${actor.username}/${actor.name}`, // For display
              })
              uniqueApiIdentifiers.add(apiIdentifier)
            }
          })
          console.log(`Fetched ${data.data.items.length} user actors.`)
        }
      } else {
        console.warn(`Failed to fetch user actors (status: ${userActorsResponse.status}).`)
      }
    } catch (error) {
      console.error("Error fetching user actors:", error)
    }

    // 2. Explicitly add 'apify~web-scraper' if not already present
    // This is a common public actor with a well-defined schema, useful for testing.
    const publicWebScraperIdentifier = "apify~web-scraper"
    if (!uniqueApiIdentifiers.has(publicWebScraperIdentifier)) {
      try {
        const storeActorResponse = await fetch(`https://api.apify.com/v2/store/acts/${publicWebScraperIdentifier}`, {
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
        })

        if (storeActorResponse.ok) {
          const storeActorData = await storeActorResponse.json()
          if (storeActorData.data) {
            const actor = storeActorData.data
            allActors.push({
              id: publicWebScraperIdentifier,
              internalId: actor.id,
              name: actor.name,
              title: actor.title,
              description: actor.description,
              username: actor.username,
              fullName: `${actor.username}/${actor.name}`,
            })
            uniqueApiIdentifiers.add(publicWebScraperIdentifier)
            console.log(`Explicitly added store actor: ${publicWebScraperIdentifier}`)
          }
        } else {
          console.warn(
            `Failed to fetch details for public store actor ${publicWebScraperIdentifier} (status: ${storeActorResponse.status}).`,
          )
        }
      } catch (error) {
        console.error(`Error fetching public store actor ${publicWebScraperIdentifier}:`, error)
      }
    }

    if (allActors.length === 0) {
      return NextResponse.json(
        {
          error:
            "No actors found. This might be because you don't have any actors created, or the API token doesn't have the necessary permissions to list them.",
        },
        { status: 404 },
      )
    }

    console.log(`Total unique actors available: ${allActors.length}`)
    return NextResponse.json({ actors: allActors })
  } catch (error) {
    console.error("Error in list-actors route:", error)
    return NextResponse.json({ error: "Failed to fetch actors" }, { status: 500 })
  }
}
