# SnowCMS Development Guidelines

SnowCMS has the following directory structure:
```
.
├── src
│   ├── cli # Build command
│   ├── client # Frontend
│   ├── common # Common code shared between frontend and backend
│   ├── lib # NPM library
│   └── server # Backend
└── test # Testing playground
    ├── test-website # An Astro website
    └── test-website-cms # A test instance of the CMS
```

SnowCMS is written in TypeScript with two exceptions: the CLI and the client library.

## CLI

The CLI runs Webpack builds.

## Frontend

The frontend is written in React. It uses React Router for client-side routing and the Mantine component library for the UI.

We currently don't have a specific pattern required for frontend contributions. That being said, performance is important. Don't import unnecessary libraries, instead preferring a vanilla JavaScript solution (e.g. use `fetch` or the wrapper from `util/api.ts` instead of Axios). Use `useEffect` and contexts sparingly.

**Do not import code from other parts of SnowCMS except for the client library `@binaryfrost/snowcms-client`.** Doing so may leak sensitive configuration information to the frontend.

## Common

The common module holds code used by both the frontend and backend. Store shared validation logic and Inputs here.

Inputs run both client-side and server-side code. Ensure you're familiar with which methods are called from which sides. If you need to fetch data from or use any APIs from the server in an Input, regardless of side, do so with an HTTP request. The `serverInputFetch` method can be used on **server-side only** methods.

**Do not import code from other parts of SnowCMS except for the client library `@binaryfrost/snowcms-client`.** Doing so may leak sensitive configuration information to the frontend.

## Library

This module holds the entrypoint for the main codebase (`@binaryfrost/snowcms`) as well as the client library (`@binaryfrost/snowcms-client`).

Any methods or classes that are intended for public use in plugins must be exported from `@binaryfrost/snowcms`.

The client library must be dependency-less. It is intended for use by the frontend and external API clients (e.g. website developers pulling data from SnowCMS).

**Do not import code from other parts of SnowCMS inside the client library.** Doing so may leak sensitive configuration information to the frontend.

## Backend

The backend is written in Node.js and Express. MySQL is used for persistent data storage and Redis is used for temporary data storage. The backend follows the MVC pattern.

To keep code clean, stable, and testable a few rules apply:
- Models should be used internally between Repositories and Services.
- Services should accept and return either primitive types or DTOs.
- Repositories, Services, Controllers, and Middleware should be registered in `container.ts`.
- Repositories, Services, Controllers, and Middleware should extend `MvcObject`.
- Models should not contain business logic. Static helper methods (e.g. generating an ID) are allowed.
- Service interfaces should be used sparingly:
  - For disableable services (e.g. media), the service should expose and implement a service interface which the no-op service can implement and consuming services can use as a type.
  - Other types of extending services should not use service interfaces unless there is a clear benefit. This rule ensures that work isn't done in multiple places unnecessarily which could impact developer experience.
- If an error occurs, an error extending `ExpressError` with a correctly set HTTP status code must be thrown. See `common/errors` for all available errors.
- DTOs should not contain business logic. DTOs must implement `clone()` and `static fromJSON()`, which both create a new instance of the DTO. It is recommended to use the `validator()` method to validate data when constructing or in setters.
- DTOs should use private fields with getters/setters (using the `get`/`set` keywords). This ensures that validation runs when a value is updated and that plugins can only set values that are intended to be mutable. Non-mutable values should be validated and set directly to the private field in the constructor.
- Separation of concerns is a must:
  - Repositories interface with the database
  - Models are a representation of the database
  - Controllers are responsible for the HTTP layer
  - Services contain business logic
  - Middleware are reusable request handlers that handle common HTTP logic
  - DTOs are used for sharing data between Services, Controllers, and plugins

### Plugins

Plugins are split into three types:
- `inputs`: adds new Inputs
- `hooks`: subscribes to events
- `routes`: adds new routes

Hook plugins are split into two types:
- `before`: these hooks run before the action is accepted, receive a mutable DTO, and can reject the action
- `after`: these hooks serve as a notification of the action taking place and receive a frozen DTO

Hook ordering is non-deterministic.

## Test

The test module currently only holds a playground. Feel free to modify this as you please while testing, but please do not commit changes unless related to a change made elsewhere.