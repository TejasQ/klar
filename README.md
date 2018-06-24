# klar

klar reads responses from backend endpoints and generates strongly typed interface definitions that clearly describe the data returned. It outputs [GraphQL Schemas](https://graphql.org/learn/schema/), [TypeScript Definitions](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html), and [flow types](https://flow.org/en/).

![Klar Demo](demo.gif)

klar returns interfaces whose members are _always_ scalar values. If a member is a nested object, it continues to recursively define interfaces until final scalar values are available.

It _could_ be extended to also just describe any old [POJSO](https://en.wikipedia.org/wiki/Plain_old_Java_object).

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Motivation](#motivation)
- [Getting Started](#getting-started)
- [Config File](#config-file)
- [CLI Configuration](#cli-configuration)
  - [`--configFile`, `-c`](#--configfile--c)
  - [`--outDir`, `-o`](#--outdir--o)
  - [`--dataProp`, `-d`](#--dataprop--d)
  - [`--graphql`, `-g`](#--graphql--g)
  - [`--flow`, `-f`](#--flow--f)
  - [`--prefix`, `-p`](#--prefix--p)
- [Why klar?](#why-klar)
- [Next Steps](#next-steps)
- [Contributing](#contributing)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Motivation

Developer experience is something that is important to me. Developer _convenience_ is something I enjoy. I'd like to, _just before_ `yarn start`ing a web application that interacts with some type of backend, fetch the latest, greatest resource type definitions for my project, and then take full advantage of [my editor](https://code.visualstudio.com/)'s incredible [intellisense](https://code.visualstudio.com/docs/editor/intellisense), allowing me to have on-demand autocomplete for the data I'm working with.

## Getting Started

To get started with klar, you'd need to tell it where your data lives. To do this, you'd need to create a config file. I know zero-config is currently sexy, but this is information that we have no way of inferring.

A `klar.config.js` is a file that points klar in the right direction. Consider,

```js
module.exports = {
  url: "https://jsonplaceholder.typicode.com",
  resources: {
    Post: "/posts",
    Comment: "/comments",
    Album: "/albums",
    Photo: "/photos",
    Todo: "/todos",
    User: "/users",
  },
};
```

As soon as your config file is in place, simply `npx klar` in your project, and you'll magically have interface definitions. Alternatively, `yarn add klar -D` will add it as a dependency in your project so it can be attached to a `prestart` script or similar.

## Config File

`klar.config.js` is a barebones file that points klar in the right direction. It does so by giving klar a URL against which to send requests, and a map of resource names and their respective paths as we've already seen in the previous example.

A full illustration of the config options available to you in this file is below.

```js
module.exports = {
  url: "https://jsonplaceholder.typicode.com",

  /**
   * A function that is applied to the immediately
   * returned data.
   */

  resolve: data => data.iOnlyWantThisKey,

  resources: {
    Post: "/posts",

    // You can also specify resource-level resolvers,
    Comment: { path: "/comments", resolve: data => data.comment },
    Album: "/albums",
    Photo: "/photos",
    Todo: "/todos",
    User: "/users",
  },

  /**
   * Request options that follow the Init spec
   * of the fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
   */
  request: {
    // headers, credentials, etc. go in here.
  },
};
```

## CLI Configuration

As a CLI tool, klar supports the following configuration options:

### `--configFile`, `-c`

Path to an alternative config file instead of `klar.config.js` that implements an identical exported schema.

### `--outDir`, `-o`

This option specifies an output folder for your definition files. Current working directory by default.

### `--dataProp`, `-d`

Usually in the GraphQL world, but also quite common: data sometimes lives in a `data` property in a returned response. When this flag is set, it simply unwraps the response and defines interfaces based on the shape of `response.data`.

### `--graphql`, `-g`

Output GraphQL schema definitions instead of TypeScript files. 🔥

### `--flow`, `-f`

Output Flow type definitions instead of TypeScript files.

### `--prefix`, `-p`

This option will prefix interface names with the name of the resource defined in the config file. Consider,

```js
// klar.config.js
{
  resources: {
    Bae: '/wolf',
  }
}

// in terminal,
klar -p

// Bae.d.ts
interface Bae {
  name: string
  otherNestedProperty: BaeOtherNestedProperty
}

interface BaeOtherNestedProperty {
  like: boolean
}
```

Without the prefix option, `otherNestedProperty`'s interface definition would have been _un-_ prefixed: `OtherNestedProperty`. This namespacing helps multiple exported interfaces with identical identifiers.

## Why klar?

klar is the German word for "clear". I chose to call this project klar because it makes resource types (or object shapes) fairly clear.

Typically, in German culture, when a type of _contract_ is formed, it's usually agreed upon with the phrase _"Alles klar"_, or "all clear".

I like how the metaphor applies to this use case of clear communication between client and server.

## Next Steps

While this tool has already helped me quite a lot, there is room for improvement! Below is a summary of how it can be improved, and areas wherein _you_ can get involved!

1.  Cover klar with tests for what can be tested.
1.  Find a comfortable way to handle authenticated requests.
1.  Find a comfortable way to request _specific_ resources without requiring specific IDs: currently, the resource map from the config file expects a path to a resource with a specific ID, which it fetches and whose type information it infers. It would be interesting to see how we proceed when specific IDs are unknown.

## Contributing

Start with an issue. Let's discuss the issue, and then one of us will submit a pull request.
