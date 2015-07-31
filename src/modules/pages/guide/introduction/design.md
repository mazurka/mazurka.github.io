---
extends: ../../../layouts/guide/index.jade
block: content
locals:
  title: Introduction - Design
---

# Design

Mazurka is made up of 4 main components:


```
    +-----------+  --->  +-----------+  --->  +----------+  --->  +----------+
    | Protocols |        | Resources |        | Dispatch |        | Services |
    +-----------+  <---  +-----------+  <---  +----------+  <---  +----------+
```

### Protocols

The primary responsibility of [protocols](/guide/protocols/overview) is to recieve requests from a client and route the requests to the correct [resource](#resource).

### Resources

[Resources](/guide/resources/overview) respond to specific requests and provide a hypermedia response. They implement the "wiring" logic for the application and call to the [dispatch](#dispatch) for data.

### Dispatch

The [dispatch](/guide/dispatch/overview) is in charge of dynamically invoking calls between [resources](#resources) and [services](#services). This added flexibility makes it easy to implement [middleware](/guide/dispatch/middleware) like [memoization](https://en.wikipedia.org/wiki/Memoization), [circuit breakers](http://techblog.netflix.com/2011/12/making-netflix-api-more-resilient.html) and [stubs](https://en.wikipedia.org/wiki/Method_stub).

### Services

[Services](/guide/services/overview) are plain elixir modules that implement the application's behavior. This may range from saving to a database, calling another api, or reading a file.
