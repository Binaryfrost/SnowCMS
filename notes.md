~~Use Vite?~~ Vite doesn't support node as a target (except for SSR, which isn't what I need here). Using Webpack instead. ~~Or maybe use Next, although it seems like Next apps can't be published to npm to be usable in the way described below as it expects a specific directory structure where the `src` and `dist` folders to be in the same location.~~

Similarly to Astro, let users install SnowCMS from npm (until open-sourcing, run `npm install git+https://{user}:{password}@github.com/Binaryfrost/SnowCMS` and have a read-only GitHub token in the Simofa build command), create their config and plugins, and run `snowcms build`.

# CLI Commands

- `snowcms build`: Builds a production version of SnowCMS
- `snowcms dev`: Runs the Webpack dev server

Possibly run Webpack through the Node API so the CMS config file can be validated first.
- https://webpack.js.org/api/node/
- https://webpack.js.org/api/webpack-dev-server/

**Important:** At no point should these commands modify `node_modules/snowcms`. That could break the CMS during development and non-CI production builds where the CMS isn't newly installed from npm.

The commands should also error if no config file exists, or if run from the CMS source repository (possibly check if `package.json` name is `snowcms`).

# Input Registry

Have a central registry for all inputs (built-in and plugin registered). Key by provided ID.

**Important**: Input values and settings will be null when the Input is added. After an Input is added to a Collection, it may not yet have a value in Collection Entries.

```ts
interface Input<T, S> {
  // Provided ID (in this example, "text")
  id: string

  // Name set for this input in the Collection settings
  name: string

  // Whether name and description (from Collection Input, not above name) should be shown above rendered input in CMS
  shouldShowNameInEntry: boolean

  /*
   * Serialization methods, called client-side
   * serialize is called before sending data to server
   * deserialize is called before rendering input
   */
  serialize: (data: T | S) => string
  deserialize: (data: string) => T | S

  // Called client-side to render input in CMS
  renderInput: (settings: S | undefined, opts: T) => ReactNode | undefined
  getInputValues: () => T

  // Called client-side to render settings in Collection settings
  renderSettings?: (settings: S) => ReactNode
  getSettings?: () => S

  /* 
   * Called client-side to determine whether to show in input library
   * and server-side to validate that the request does not contain input
   */
  isAllowed: (website: Website, user: User) => boolean

  /*
   * Called server-side when page is requested through API
   * with the query parameter `?render=true`.
   * If you don't want the input to be rendered as HTML,
   * return T as JSON. You can also return a non-HTML string.
   */
  renderHtml: (opts: T) => string | T
}

const input: Input = {...};
InputRegistry.addInput('text', input);
```

# Users

Use SSO for now, possibly add login form in the future if open-sourcing.

Refresh token in background (only on active tab) to prevent edits being lost due to redirect to login page.

Add `VIEWER` role JWT (with configurable expiry) to website settings page for API use.

```ts
type Role = 'ADMIN' | 'SUPERUSER' | 'USER' | 'VIEWER';
interface User {
  /*
   * Each role inherits permissions from lower roles
   * Admin has access to whole CMS
   * Superuser can add/edit/remove Collections and Collection Inputs for their website(s)
   * User can add/edit/remove Collection Entries for their website(s)
   * Viewer can only view Collection Entries for their website(s), intended for read-only API access
   */
  role: Role
  // Optional (and ignored) for ADMIN role
  websites?: string[]
}
```

Use a static map of role hierarchy to manage inheritance. Use this client-side to hide UI elements and server-side to prevent API operations.

```ts
interface RoleHierarchyMap {
  [x: Role]: number
}

const ROLE_HIERARCHY_MAP = Object.freeze({
  ADMIN: 80,
  SUPERUSER: 60,
  USER: 40,
  VIEWER: 20
});

function hasPermission(userRole: Role, requiredRole: Role) {
  return ROLE_HIERARCHY_MAP[userRole] >= ROLE_HIERARCHY_MAP[requiredRole];
}

hasPermission('ADMIN', 'USER'); // true
hasPermission('VIEWER', 'USER'); // false
```

# Collections

```ts
interface Collection {
  // Collection ID (probably v7 UUID)
  id: string
  name: string
  inputs: Input[]
}
```

When page is requested, return JSON in the form:

```ts
interface PageResponse {
  // Page ID (probably v7 UUID)
  id: string

  createdAt: number
  updatedAt: number

  /*
   * Return all properties of Collection Entry, either as a
   * HTML string (if renderHtml) was called, or as a
   * JSON-serialized object
   */
  data: Record<string, string | object>
}
```

# Config

Require user to create `snowcms.config.ts` file.

Create `defineConfig` utility function for types (like how Astro does it).

```ts
import examplePlugin from './plugins/example/index.ts';

// In production, use environmental variables instead of hard-coding secret values or those that could differ between dev and prod
export default {
  port: 3080,
  // IMPORTANT: Test the Webpack config to make sure the secret doesn't leak to the client-side code
  secret: 'longrandomsecret',
  sso: {
    clientId: '',
    // See comment above about secret
    clientSecret: '',
    authUrl: '',
    tokenUrl: '',
    userInfoUrl: '',
    logoutUrl: ''
  },
  // Future update
  media: {
    // Maximum size of one file
    maxSize: 50000000,
    // Per-website maximum storage for all files
    maxStorage: 5000000000,
    s3: {
      endpoint: '',
      region: '',
      // The S3 bucket should be dedicated to SnowCMS
      bucket: '',
      accessKeyId: '',
      // See comment above about secret; ideally none of the S3 config should be available client-side, the necessary URLs should be generated server-side and sent to the client
      secretAccessKey: '',
      publicUrl: ''      
    }
  },
  plugins: [
    examplePlugin
  ]
};
```

Import (possibly using `require`) the absolute path of the config file when running `snowcms build`. Also pass absolute path of current directory to Webpack through an environmental variable.

Payload does it this way:
- https://github.com/payloadcms/payload/blob/268e6c485e67440d8ce0dd7679705d8581a269c1/packages/payload/src/config/find.ts#L44
- https://github.com/payloadcms/payload/blob/main/packages/payload/src/config/load.ts#L25

# Plugin API

Plugins are added to the config file and should return a default export. Changes to plugins require a rebuild.

```ts
interface StartHook {
  /*
   * Register Express routes at /c/{plugin_name}/{path}
   * Minimum role, leave blank to allow unauthenticated access (restricted using app.use() on route)
   * 
   * Returns Express route (https://expressjs.com/en/4x/api.html#app.route)
   */
  registerRoute: (path: string, roles?: Role) => Route
}

/*
   * Events (* one of [website, collection, collectionInput, collectionEntry, media]):
   * - *BeforeCreate
   * - *AfterCreate
   * - *BeforeModify (called before saving data in database, useful for validating input)
   * - *AfterModify (called after saving data in database)
   * - *BeforeDelete
   * - *AfterDelete
   * 
   * Hooks may be async or synchronous. Allow modifying data in synchronous before hooks,
   * which can also be used for validating input by throwing an error. Modifying data and
   * input validation may not be done in async hooks.
   * 
   * Add reason property to event so plugins can filter when to run their code, for example:
   * Deleting Collection Inputs would change Collection Entries, but a developer may not want
   * to trigger a rebuild unless a specific Collection Input is changed.
   * 
   * Also have:
   * - serverStart: Allow registering routes from this hook
   * - setup: Called server-side and client-side for registering inputs
   */
interface Hooks {
  start?: ({...}: StartHook) => void | Promise<void>
}

interface Plugin {
  name: string
  hooks: Record<string, () => void>
}

const plugin: Plugin = {
  name: 'example-plugin',
  hooks: {
    start: (api) => {...}
  }
};
export default plugin;
```

Do not store sensitive information in plugins as these are included in the client build. If a plugin requires sensitive information, this should be stored in a file that gets loaded at runtime.

# Database

Use knex [`insert(...).onConflict('id').merge()`](https://knexjs.org/guide/query-builder.html#merge) to either insert or update data, depending on whether it exists.

## Websites

| Name |  Type  |        Note         |
| ---- | ------ | ------------------- |
| id   | string | Primary key         |
| name | string | Name shown in CMS   |
| hook | string | See below, nullable |

`hook` is a URL that a blank POST request will be sent to after a Collection Entry is created, modified, or deleted.

## Collections

|   Name    |  Type  | References  |       Note        |
| --------- | ------ | ----------- | ------------------|
| id        | string |             | Primary key       |
| websiteId | string | websites.id |                   |
| name      | string |             | Name shown in CMS |

## CollectionTitle

|     Name     |  Type  |     References      |       Note        |
| ------------ | ------ | ------------------- | ------------------|
| collectionId | string | collections.id      | Comp. primary key |
| inputId      | string | collectionInputs.id | Comp. primary key |

The Collection Title is the Collection Input that is shown in Entry list.

## CollectionInputs

|     Name     |  Type  |   References   |            Note            |
| ------------ | ------ | -------------- | -------------------------- |
| id           | string |                | Primary key                |
| collectionId | string | collections.id |                            |
| name         | string |                | Name shown in CMS          |
| description  | string |                | Shown below name, nullable |
| fieldName    | string |                | Name used in API response  |
| input        | string |                | Input Registry ID          |
| inputConfig  | string |                | Passed to input, nullable  |
| order        | int    |                | See below                  |

If a Collection Input is to be deleted, warn the user that it will delete all Collection Entry Input values for this Input. If a Collection Input is being used as a Collection Title, throw error.

When the client requests the Collection, the server should order the Collection Inputs and remove the order property from the response.

When user saves the Collection, the whole list of inputs is sent to the server to be updated. The server should then update the order of each Collection Input to reflect the data received from the client.

Alternatively, have a separate API route for updating order and do something like https://softwareengineering.stackexchange.com/a/304597

Alternatively, require the client to update the order property before sending the update to the server. This simplifies the code and TypeScript interfaces.

~~Alternatively, use a linked list. Store the ID of the next input. If an input is moved, store the previous input's ID and set that input's next input reference to this input's ID. Also update the previous input before the move. If an input is removed, store the input's next input reference in the previous input.~~ Too complex.

Alternatively, store the input order in an array in the Collections table.

## CollectionEntries

|     Name     |  Type  |   References   |    Note     |
| ------------ | ------ | -------------- | ----------- |
| id           | string |                | Primary key |
| collectionId | string | collections.id |             |
| createdAt    | int    |                | Timestamp   |
| updatedAt    | int    |                | Timestamp   |

## CollectionEntryInputs

|  Name   |  Type  |      References      |       Note        |
| ------- | ------ | -------------------- | ----------------- |
| entryId | string | collectionEntries.id | Comp. primary key |
| inputId | string | collectionInputs.id  | Comp. primary key |
| data    | text   |                      | Passed to input   |

Data is the serialized input data for the Collection Entry.

## Media (Future Update)

|     Name     |  Type  | References  |             Note             |
| ------------ | ------ | ----------- | ---------------------------- |
| id           | string |             | Primary key                  |
| websiteId    | string | websites.id |                              |
| origFileName | string |             | Original file name           |
| fileName     | string |             | Name after file upload*      |
| fileSize     | int    |             | Size of file in bytes        |
| thumbName    | string |             | Name of thumbnail*, nullable |
| timestamp    | string |             | Unix timestamp               |

*File name as stored in S3; should be sanitized and include at least part of ID or timestamp to avoid overwriting existing files

Maximum file size `config.media.maxSize`. Send file size, type, and name (File Metadata) to server, which returns a pre-signed upload URL and an HMAC of File Metadata. Client uploads the file to S3 and after a successful upload, sends a confirmation request to the server with the File Metadata and HMAC which makes the server record the file in the database.

Store in S3 bucket at `/media/{websiteId}/{year}/{month}/{fileName}`.

Allow public read-only access to S3 bucket so SSR websites don't break; this also simplifies CMS API code.

Initially only allow uploading image files. In the future, allow uploading other files (excluding executables) accessible through a CDN (on `cms-user-content.binaryfrost-cust.net`).

Before deleting an image, check all Collection Entries for image nodes that use the image. If one exists, show the user an error including the name of the Collection Entry and Input.

Only allow 15 image uploads every 5 minutes to prevent abuse. Prevent file uploads if summed `fileSize` is more than `config.media.maxStorage` bytes.

# API Routes

- /api/login
- /api/login/callback
- /api/websites
- /api/websites/{id}
- /api/websites/{id}/collections
- /api/websites/{id}/collections/{id}
- /api/websites/{id}/collections/{id}/inputs
- /api/websites/{id}/collections/{id}/inputs/{id}
- /api/websites/{id}/collections/{id}/inputs/{id}/order
- /api/websites/{id}/collections/{id}/entries
- /api/websites/{id}/collections/{id}/entries/{id}
- /api/websites/{id}/media
- /api/websites/{id}/media/{id}
