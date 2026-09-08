export type ProfileDetails = {
  displayName: string
  email: string
  departureAirport: string
}

/** A local prototype identity, never an authenticated or verified account. */
export type LocalProfile = ProfileDetails & {
  session: 'guest' | 'demo'
}

export type ProfileErrors = Partial<Record<keyof ProfileDetails, string>>
