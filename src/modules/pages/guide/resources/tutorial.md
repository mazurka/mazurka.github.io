---
extends: ../../../layouts/guide/index.jade
block: content
locals:
  title: Resources - Tutorial
---

# Tutorial

When declaring a Mazurka resource several macros are imported for resource construction and definition. We'll walk through examples of each one as we build a few resources dealing with users. Let's start be creating a `MyAPI.Resource.Users.Read` resource.

```elixir[initial]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource
end
```

## param

The `param` macro declares what parameters should be passed into the resource. This information can be used to generate documentation and verify that protocols or other resources are passing the correct information.

In our example resource we're declaring that `user` is required to respond to a request.

```elixir[param_no_validate<-initial]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user
end
```

If we want to validate or transform the param we can pass a `do` block. The value of the parameter will be available as the variable `value`. This makes it easy to check the value against a [service](/guide/services/overview).

In this example we'll call the `Users.read/1` service and get a `User` struct back.

```elixir[param<-param_no_validate]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end
end
```

We can add as many of the `param` delcarations as we would like, however in this example, we'll just stick to one.

## mediatype

Now we'll add a `mediatype` block. This is where we declare the available mediatypes for this resource. In this example we'll use the `hyper+json` mediatype. Each individual mediatype can import its own set of macros in this block. Check out the [mediatypes section](/guide/resources/mediatypes) for more information on the types available.

```elixir[mediatype<-param]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  mediatype Mazurka.Mediatype.Hyperjson do

  end
end
```

## action

Every [mediatype](#mediatype) block needs an action handler. This is called after all of the conditions are met. Inside, we define what happens when this resource is requested by a client. All side-effects should be contained in this block. The response from the action will be serialized and sent to the client.

Here we're just going to send a read-only response to the client. This will include the user's `name` and `avatar`.

```elixir[action<-mediatype]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  mediatype Mazurka.Mediatype.Hyperjson do
    action do
      %{
        "name" => user.name,
        "avatar" => %{
          "src" => user.image
        },
      }
    end
  end
end
```

Now we can finally make a request to this resource! Let's say we've mounted it at `/users/:user` through the HTTP protocol.

```sh[req_action]
$ curl http://localhost:4000/users/u1

{
  "href": "http://localhost:4000/users/u1",
  "name": "Joe",
  "avatar": {
    "src": "https://avatars1.githubusercontent.com/u/99915?v=3&s=460"
  }
}
```

## let

What if we want to get a list of a user's friends? We have the `let` macro to assign request wide variables that we can go on to use in the resource.

Here, we'll call the `Users.find_friends/1` service which will return a list of `User` ids. We'll perform a comprehension over this list and return the id.

```elixir[init_let<-action]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  let friends = Users.find_friends(user.id)

  mediatype Mazurka.Mediatype.Hyperjson do
    action do
      %{
        "name" => user.name,
        "avatar" => %{
          "src" => user.image
        },
        "friends" => for friend <- friends do
          friend
        end,
      }
    end
  end
end
```

If we make a request to this resource now we'll see something like this:

```sh[req_let_w_friends<-req_action]
$ curl http://localhost:4000/users/u1

{
  "href": "http://localhost:4000/users/u1",
  "name": "Joe",
  "avatar": {
    "src": "https://avatars1.githubusercontent.com/u/99915?v=3&s=460"
  },
  "friends": [
    "u2",
    "u3"
  ]
}
```

`let` also accepts a `do` block for more complex computations.

Here we'll get a list of user interests by joining the movies and books they've liked and returning it to the client.

```elixir[let<-init_let]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  let friends = Users.find_friends(user.id)
  let interests do
    movies = Movies.find_liked_by_user(user.id)
    books = Books.find_linked_by_user(user.id)
    movies ++ books
  end

  mediatype Mazurka.Mediatype.Hyperjson do
    action do
      %{
        "name" => user.name,
        "avatar" => %{
          "src" => user.image
        },
        "friends" => for friend <- friends do
          friend
        end,
        "interests" => for interest <- interests do
          interest
        end,
      }
    end
  end
end
```

Let's make another request and see how it's changed.

```sh[req_let<-req_let_w_friends]
$ curl http://localhost:4000/users/u1

{
  "href": "http://localhost:4000/users/u1",
  "name": "Joe",
  "avatar": {
    "src": "https://avatars1.githubusercontent.com/u/99915?v=3&s=460"
  },
  "friends": [
    "u2",
    "u3"
  ],
  "interests": [
    "m1",
    "m2",
    "b1",
    "b2"
  ]
}
```

Keep in mind that the expressions in `let` are lazy, meaning they will only be computed if the variable name is actually used. This can be a little different than what most programmers are used to. The benefit is we're never requesting data we don't need. Check out the [resources design](/guide/resources/design) page for more information regarding laziness.

## link_to

You'll notice in the [let](#let) section we iterated over the list of friends and interests and returned their ids. This would be normal for traditional APIs. However, in hypermedia APIs we want to return a link to the resource so the client can easily resolve it. We can accomplish this with the `link_to` function.

```elixir[link_to<-let]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  let friends = Users.find_friends(user.id)
  let interests do
    movies = Movies.find_liked_by_user(user.id)
    books = Books.find_linked_by_user(user.id)
    movies ++ books
  end

  mediatype Mazurka.Mediatype.Hyperjson do
    action do
      %{
        "name" => user.name,
        "avatar" => %{
          "src" => user.image
        },
        "friends" => for friend <- friends do
          link_to(MyAPI.Resource.Users.Read, user: friend)
        end,
        "interests" => for interest <- interests do
          link_to(MyAPI.Resource.Like.Interest.Read, interest: interest)
        end,
      }
    end
  end
end
```

Now if we request the resource we get something like this:

```sh[req_link_to<-req_let]
$ curl http://localhost:4000/users/u1

{
  "href": "http://localhost:4000/users/u1",
  "name": "Joe",
  "avatar": {
    "src": "https://avatars1.githubusercontent.com/u/99915?v=3&s=460"
  },
  "friends": [
    {
      "href": "http://localhost:4000/users/u2"
    },
    {
      "href": "http://localhost:4000/users/u3"
    }
  ],
  "interests": [
    {
      "href": "http://localhost:4000/interests/m1"
    },
    {
      "href": "http://localhost:4000/interests/m2"
    },
    {
      "href": "http://localhost:4000/interests/b1"
    },
    {
      "href": "http://localhost:4000/interests/b2"
    }
  ]
}
```

## affordance

In the previous section we saw that `link_to` returned a hyperlink to the resource. What if we wanted to change what the link looks like? Glad you asked. That's what the `affordance` section is for.

In this example we'll add the `name` property to the link itself so clients won't have to request all of the friend resources just for the name.

```elixir[affordance_w_name<-link_to]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  let friends = Users.find_friends(user.id)
  let interests do
    movies = Movies.find_liked_by_user(user.id)
    books = Books.find_linked_by_user(user.id)
    movies ++ books
  end

  mediatype Mazurka.Mediatype.Hyperjson do
    action do
      %{
        "name" => user.name,
        "avatar" => %{
          "src" => user.image
        },
        "friends" => for friend <- friends do
          link_to(MyAPI.Resource.Users.Read, user: friend)
        end,
        "interests" => for interest <- interests do
          link_to(MyAPI.Resource.Like.Interest.Read, interest: interest)
        end,
      }
    end

    affordance do
      %{
        "name" => user.name
      }
    end
  end
end
```

What does that response look like? You guessed it.

```sh[req_affordance_w_name<-req_link_to]
$ curl http://localhost:4000/users/u1

{
  "href": "http://localhost:4000/users/u1",
  "name": "Joe",
  "avatar": {
    "src": "https://avatars1.githubusercontent.com/u/99915?v=3&s=460"
  },
  "friends": [
    {
      "href": "http://localhost:4000/users/u2",
      "name": "Robert"
    },
    {
      "href": "http://localhost:4000/users/u3",
      "name": "Mike"
    }
  ],
  "interests": [
    {
      "href": "http://localhost:4000/interests/m1"
    },
    {
      "href": "http://localhost:4000/interests/m2"
    },
    {
      "href": "http://localhost:4000/interests/b1"
    },
    {
      "href": "http://localhost:4000/interests/b2"
    }
  ]
}
```

Affordances can also be used to build forms. Let's say there was a another resource called `MyAPI.Resource.Users.Update`. This resource is in charge of accepting a name for a user and persisting it through the `Users` service.

```elixir[user_update]
defmodule MyAPI.Resource.Users.Update do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  mediatype Mazurka.Mediatype.Hyperjson do
    action do
      Users.update(user, %{
        "name" => Input.get("name")
      })
      true
    end

    affordance do
      %{
        "input" => %{
          "name" => %{
            "type" => "text",
            "value" => user.name,
            "required" => true
          }
        }
      }
    end
  end
end
```

Now let's link to the update resource from our read.

```elixir[affordance<-affordance_w_name]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  let friends = Users.find_friends(user.id)
  let interests do
    movies = Movies.find_liked_by_user(user.id)
    books = Books.find_linked_by_user(user.id)
    movies ++ books
  end

  mediatype Mazurka.Mediatype.Hyperjson do
    action do
      %{
        "name" => user.name,
        "avatar" => %{
          "src" => user.image
        },
        "friends" => for friend <- friends do
          link_to(MyAPI.Resource.Users.Read, user: friend)
        end,
        "interests" => for interest <- interests do
          link_to(MyAPI.Resource.Like.Interest.Read, interest: interest)
        end,
        "update" => link_to(MyAPI.Resource.Users.Update, user: user.id),
      }
    end

    affordance do
      %{
        "name" => user.name
      }
    end
  end
end
```

Let's try making a request:

```sh[req_affordance<-req_affordance_w_name]
$ curl http://localhost:4000/users/u1

{
  "href": "http://localhost:4000/users/u1",
  "name": "Joe",
  "avatar": {
    "src": "https://avatars1.githubusercontent.com/u/99915?v=3&s=460"
  },
  "friends": [
    {
      "href": "http://localhost:4000/users/u2",
      "name": "Robert"
    },
    {
      "href": "http://localhost:4000/users/u3",
      "name": "Mike"
    }
  ],
  "interests": [
    {
      "href": "http://localhost:4000/interests/m1"
    },
    {
      "href": "http://localhost:4000/interests/m2"
    },
    {
      "href": "http://localhost:4000/interests/b1"
    },
    {
      "href": "http://localhost:4000/interests/b2"
    }
  ],
  "update": {
    "method": "POST",
    "action": "http://localhost:4000/users/u1",
    "input": {
      "name": {
        "type": "text",
        "value": "Joe",
        "required": true
      }
    }
  }
}
```

Let's see what happens when we submit the `update` form.

```sh
$ curl -X POST -d '{"name": "Carl"}' -H 'Content-type: application/hyper+json' http://localhost:4000/users/u1
true
```

## transition_to

The response of `true` probably isn't the best when a request goes through. We want there to be a continuous flow for our clients since there are hypermedia driven. Imagine updating your user in the browser and getting the response `true`. You'd have to hit the back button to get back to where you wanted to go. We can improve this experience by using the `transition_to` call.

```elixir[user_update_transition_to<-user_update]
defmodule MyAPI.Resource.Users.Update do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  mediatype Mazurka.Mediatype.Hyperjson do
    action do
      Users.update(user, %{
        "name" => Input.get("name")
      })
      transition_to(MyAPI.Resource.Users.Read, user: user.id)
    end

    affordance do
      %{
        "input" => %{
          "name" => %{
            "type" => "text",
            "value" => user.name,
            "required" => true
          }
        }
      }
    end
  end
end
```

## condition

The astute reader will notice that we've now opened up changing a user's name to all clients. That's not good. Let's use the `condition` declaration to lock that down.

```elixir[user_update_cond<-user_update_transition_to]
defmodule MyAPI.Resource.Users.Update do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  condition Auth.user_id == user.id

  mediatype Mazurka.Mediatype.Hyperjson do
    action do
      Users.update(user, %{
        "name" => Input.get("name")
      })
      transition_to(MyAPI.Resource.Users.Read, user: user.id)
    end

    affordance do
      %{
        "input" => %{
          "name" => %{
            "type" => "text",
            "value" => user.name,
            "required" => true
          }
        }
      }
    end
  end
end
```

Now let's see what happens when we request the user resource.

```sh[req_condition_user_id<-req_affordance]
$ curl http://localhost:4000/users/u1

{
  "href": "http://localhost:4000/users/u1",
  "name": "Joe",
  "avatar": {
    "src": "https://avatars1.githubusercontent.com/u/99915?v=3&s=460"
  },
  "friends": [
    {
      "href": "http://localhost:4000/users/u2",
      "name": "Robert"
    },
    {
      "href": "http://localhost:4000/users/u3",
      "name": "Mike"
    }
  ],
  "interests": [
    {
      "href": "http://localhost:4000/interests/m1"
    },
    {
      "href": "http://localhost:4000/interests/m2"
    },
    {
      "href": "http://localhost:4000/interests/b1"
    },
    {
      "href": "http://localhost:4000/interests/b2"
    }
  ]
}
```

Nice! What happens if we make a request to the user update directly?

```sh
$ curl -X POST -d '{"name": "Carl"}' -H 'Content-type: application/hyper+json' http://localhost:4000/users/u1

{
  "error": {
    "code": 401,
    "message": "You do not have access to this resource"
  }
}
```

As you can see, a condition declaration will both prevent other resources linking to this resource and actions being executed. Notice how the resource in charge of processing the request is also in charge of determining if the affordance for the request should even be shown. This makes it very easy to secure any resource since all of the logic is in a single place. It also makes it very clear to clients what they can and can't do. If the `"update"` for is present in the resource then they can update; otherwise they shouldn't try because the request will fail.

Let's see what happens when we make a request with our API's token.

```sh[req_condition_user_id_success<-req_condition_user_id]
$ curl http://localhost:4000/users/u1 -H 'Authorization: Bearer token_for_u1'

{
  "href": "http://localhost:4000/users/u1",
  "name": "Joe",
  "avatar": {
    "src": "https://avatars1.githubusercontent.com/u/99915?v=3&s=460"
  },
  "friends": [
    {
      "href": "http://localhost:4000/users/u2",
      "name": "Robert"
    },
    {
      "href": "http://localhost:4000/users/u3",
      "name": "Mike"
    }
  ],
  "interests": [
    {
      "href": "http://localhost:4000/interests/m1"
    },
    {
      "href": "http://localhost:4000/interests/m2"
    },
    {
      "href": "http://localhost:4000/interests/b1"
    },
    {
      "href": "http://localhost:4000/interests/b2"
    }
  ],
  "update": {
    "method": "POST",
    "action": "http://localhost:4000/users/u1",
    "input": {
      "name": {
        "type": "text",
        "value": "Joe",
        "required": true
      }
    }
  }
}
```

## error

In the [last section](#condition) we locked down user editing to only the resource owner. When we tried to make a request to the resource directly we got the default, generic error.

In this particular case, let's say we wanted to override this message. We can use the error declaration for this.

```elixir[user_update_error<-user_update_cond]
defmodule MyAPI.Resource.Users.Update do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  condition Auth.user_id == user.id, permission_error

  mediatype Mazurka.Mediatype.Hyperjson do
    action do
      Users.update(user, %{
        "name" => Input.get("name")
      })
      transition_to(MyAPI.Resource.Users.Read, user: user.id)
    end

    affordance do
      %{
        "input" => %{
          "name" => %{
            "type" => "text",
            "value" => user.name,
            "required" => true
          }
        }
      }
    end

    error permission_error(_err) do
      %{
        "error" => %{
          "message" => "Get lost!"
        }
      }
    end
  end
end
```

As you might guess this is what we get back when requesting this resource without the correct permissions.

```sh
$ curl -X POST -d '{"name": "Carl"}' -H 'Content-type: application/hyper+json' http://localhost:4000/users/u1

{
  "error": {
    "message": "Get lost!"
  }
}
```

## event

A lot of times, we want to fire events when an action is performed. We can accomplish this by using the `event` declaration.

```elixir[user_update_event<-user_update_error]
defmodule MyAPI.Resource.Users.Update do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  condition Auth.user_id == user.id, permission_error

  mediatype Mazurka.Mediatype.Hyperjson do
    action do
      Users.update(user, %{
        "name" => Input.get("name")
      })
      transition_to(MyAPI.Resource.Users.Read, user: user.id)
    end

    affordance do
      %{
        "input" => %{
          "name" => %{
            "type" => "text",
            "value" => user.name,
            "required" => true
          }
        }
      }
    end

    error permission_error(_err) do
      %{
        "error" => %{
          "message" => "Get lost!"
        }
      }
    end
  end

  event do
    Analytics.record(:user_update, %{
      "id" => user.id,
      "before" => user.name,
      "after" => Input.get("name")
    })
  end
end
```
