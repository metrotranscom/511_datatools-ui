// @flow

const SECURE: string = 'secure/'
export const API_PREFIX: string = `/api/manager/`
export const SECURE_API_PREFIX: string = `${API_PREFIX}${SECURE}`
export const GTFS_GRAPHQL_PREFIX: string = `${SECURE_API_PREFIX}gtfs/graphql`
export const EDITOR_PREFIX: string = `/api/editor/`
export const SECURE_EDITOR_PREFIX: string = `${EDITOR_PREFIX}${SECURE}`
export const DEFAULT_DESCRIPTION = 'A command center for managing, editing, validating, and deploying GTFS.'
export const DEFAULT_LOGO = 'https://d2tyb7byn1fef9.cloudfront.net/ibi_group_black-512x512.png'
export const DEFAULT_LOGO_SMALL = 'https://d2tyb7byn1fef9.cloudfront.net/ibi_group-128x128.png'
export const DEFAULT_TITLE = 'Data Tools'

export const RETRIEVAL_METHODS = Object.freeze({
  MANUALLY_UPLOADED: 'MANUALLY_UPLOADED',
  FETCHED_AUTOMATICALLY: 'FETCHED_AUTOMATICALLY',
  PRODUCED_IN_HOUSE: 'PRODUCED_IN_HOUSE',
  SERVICE_PERIOD_MERGE: 'SERVICE_PERIOD_MERGE',
  REGIONAL_MERGE: 'REGIONAL_MERGE',
  VERSION_CLONE: 'VERSION_CLONE'
})

export const FEED_TRANSFORMATION_TYPES = Object.freeze({
  DELETE_RECORDS: 'DeleteRecordsTransformation',
  REPLACE_FILE_FROM_VERSION: 'ReplaceFileFromVersionTransformation',
  REPLACE_FILE_FROM_STRING: 'ReplaceFileFromStringTransformation'
})
