import {Person} from './Person.js'

export interface Release {
  url: string
  upload_url: string
  id: number
  author: Person
  node_id: string
  tag_name: string
  target_commitish: string
  name: string
  draft: boolean
  prerelease: boolean
  created_at: string
  published_at: string
  assets: any[]
  tarball_url: string
  zipball_url: string
  body: string
}
