// Google Places result (no website businesses)
export interface PlaceLead {
  name: string
  phone: string
  address: string
  email: string
  website: string
}

// DuckDuckGo web search result (scraped emails/phones from URLs)
export interface WebLead {
  url: string
  emails: string[]
  phones: string[]
  emails_str: string
  phones_str: string
}

// Unified search history item stored in localStorage
export interface SearchSession {
  id: string
  mode: 'places' | 'web'
  query: string
  location: string
  maxResults: number
  resultCount: number
  phoneCount: number
  timestamp: number
  results?: LeadResult[]
}

export type LeadResult = PlaceLead | WebLead

export function isPlaceLead(lead: LeadResult): lead is PlaceLead {
  return 'name' in lead && 'address' in lead
}

export function isWebLead(lead: LeadResult): lead is WebLead {
  return 'url' in lead && 'emails' in lead
}
