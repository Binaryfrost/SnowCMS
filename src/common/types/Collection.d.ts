export interface Collection {
  id: string
  websiteId: string
  name: string
  callHook: boolean
  title: string
  slug?: string
  backdatingEnabled: boolean
}
