// types/actor.ts
export interface Actor {
  id: string // This will now be the 'username~actor-name' format (apiIdentifier)
  internalId: string // Apify's actual internal unique ID (e.g., "abcdef1234567890")
  name: string
  title?: string
  description?: string
  username: string
  fullName: string // For display: "username/actor-name"
}
