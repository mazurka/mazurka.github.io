---
extends: ../../../layouts/guide/index.jade
block: content
locals:
  title: Resources - Tutorial
---

# Tutorial

When declaring a Mazurka resource several macros are imported for resource construction and definition. We'll walk through examples of each one as we build the `MyAPI.Resource.Users.Read` resource.

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

```elixir[param<-initial]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end
end
```

We can add as many of the `param` delcarations as we would like, however in this example, we'll just stick to one.

## let

Now that we've set up our user [param](#param) we can start declaring variables with `let`.

Here, we'll call the `Users.find_friends/1` service which will return a list of `User` ids.

```elixir[init_let<-param]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  let friends = Users.find_friends(user.id)
end
```

We can also declare a variable from the result of a `do` block expression

Now we'll merge the result of `Movies.find_liked_by_user/1` and `Books.find_liked_by_user/1` into the variable `likes`. Both of these services return a list of ids.

```elixir[let<-param]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  let friends = Users.find_friends(user.id)
  let likes do
    movies = Movies.find_liked_by_user(user.id)
    books = Books.find_liked_by_user(user.id)
    movies ++ books
  end
end
```

Keep in mind that the expressions in `let` are lazy, meaning they will only be computed if the variable name is actually used. This can be a little different than what most programmers are used to. The benefit is we're never requesting data we don't need. Check out the [resources design](/guide/resources/design) page for more information regarding laziness.

## condition

With the `condition` macro we can specifiy requirements that need to be truthy in order for a client to realize the action. This is usually checking that a user has the correct permissions to access the resource. In this example, we want to restrict access to logged in users so we check that the client has an authorized `user_id`.

```elixir[condition_no_error<-let]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  let friends = Users.find_friends(user.id)
  let likes do
    movies = Movies.find_liked_by_user(user.id)
    books = Books.find_liked_by_user(user.id)
    movies ++ books
  end

  condition Auth.user_id
end
```

If we don't want the default error message, we can pass an [error handler](#error) function to override the response

```elixir[condition<-condition_no_error]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  let friends = Users.find_friends(user.id)
  let likes do
    movies = Movies.find_liked_by_user(user.id)
    books = Books.find_liked_by_user(user.id)
    movies ++ books
  end

  condition Auth.user_id, permission_error
end
```

We can add as many condition declarations as we need to lock down the resource but keep in mind that all of them must be truthy in order for a request to succeed.

## mediatype

The `mediatype` block is where we declare the available mediatypes for this resource. In this example we'll use the `hyper+json` mediatype. Each individual mediatype can import its own set of macros in this block. Check out the [mediatypes section](/guide/resources/mediatypes) for more information on the types available.

```elixir[mediatype<-condition]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  let friends = Users.find_friends(user.id)
  let likes do
    movies = Movies.find_liked_by_user(user.id)
    books = Books.find_liked_by_user(user.id)
    movies ++ books
  end

  condition Auth.user_id, permission_error

  mediatype Mazurka.Mediatype.Hyperjson do

  end
end
```

## action

Every [mediatype](#mediatype) block needs an action handler. This is called after all of the conditions are met. Inside, we define what happens when this resource is requested by a client. All side-effects should be contained in this block. The response from the action will be serialized and sent to the client.

Here we're just going to send a read-only response to the client. This will include the user's `name` and `avatar`.

```elixir[action_init<-mediatype]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  let friends = Users.find_friends(user.id)
  let likes do
    movies = Movies.find_liked_by_user(user.id)
    books = Books.find_liked_by_user(user.id)
    movies ++ books
  end

  condition Auth.user_id, permission_error

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

Now we can finally make a request to this resource! Let's say we've mounted it at `/users/:user`.

```sh[req_action_init]
$ curl http://localhost:4000/users/u1

{
  "href": "http://localhost:4000/users/u1",
  "name": "Joe",
  "avatar": {
    "src": "https://avatars1.githubusercontent.com/u/99915?v=3&s=460"
  }
}
```

We can use our `let` variable inside of action as well.

```elixir[action<-action_init]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  let friends = Users.find_friends(user.id)
  let likes do
    movies = Movies.find_liked_by_user(user.id)
    books = Books.find_liked_by_user(user.id)
    movies ++ books
  end

  condition Auth.user_id, permission_error

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
        "likes" => for like <- likes do
          like
        end,
      }
    end
  end
end
```

Let's make another request and see how it's changed.

```sh[req_action<-req_action_init]
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
  "likes": [
    "m1",
    "m2",
    "b1",
    "b2"
  ]
}
```

## link_to

You'll notice in the [action](#action) section we iterated over the list of friend and likes and returned their ids. This would be normal for traditional APIs. However, in hypermedia APIs we want to return a link to the resource so the client can easily resolve it. We can accomplish this with the `link_to` function.

```elixir[link_to<-action]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  let friends = Users.find_friends(user.id)
  let likes do
    movies = Movies.find_liked_by_user(user.id)
    books = Books.find_liked_by_user(user.id)
    movies ++ books
  end

  condition Auth.user_id, permission_error

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
        "likes" => for like <- likes do
          link_to(MyAPI.Resource.Like.Read, item: like)
        end,
      }
    end
  end
end
```

Now if we request the resource we get something like this:

```sh[req_link_to<-req_action]
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
  "likes": [
    {
      "href": "http://localhost:4000/likes/m1"
    },
    {
      "href": "http://localhost:4000/likes/m2"
    },
    {
      "href": "http://localhost:4000/likes/b1"
    },
    {
      "href": "http://localhost:4000/likes/b2"
    }
  ]
}
```

## affordance

In the previous section we saw that `link_to` returned a hyperlink to the resource. What if we wanted to change what the link looks like? Glad you asked. That's what `affordance` is for.

In this example we'll add the `name` property to the link itself so clients won't have to request all of the friend resources just for the name.

```elixir[affordance_w_name<-link_to]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  let friends = Users.find_friends(user.id)
  let likes do
    movies = Movies.find_liked_by_user(user.id)
    books = Books.find_liked_by_user(user.id)
    movies ++ books
  end

  condition Auth.user_id, permission_error

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
        "likes" => for like <- likes do
          link_to(MyAPI.Resource.Like.Read, item: like)
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

```sh[req_affordance<-req_link_to]
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
  "likes": [
    {
      "href": "http://localhost:4000/likes/m1"
    },
    {
      "href": "http://localhost:4000/likes/m2"
    },
    {
      "href": "http://localhost:4000/likes/b1"
    },
    {
      "href": "http://localhost:4000/likes/b2"
    }
  ]
}
```

Affordances can also be used to build forms. In our example we want a user to be able to edit their own information but should not be able to edit anyone else. Let's say there was a another resource called `MyAPI.Resource.Users.Update`. This resource will be in charge of checking that the correct permissions exist and then updating the user.

```elixir[user_update]
defmodule MyAPI.Resource.Users.Update do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end

  condition Auth.user_id == user

  mediatype Mazurka.Mediatype.Hyperjson do
    action do
      Users.update(user, %{
        "name" => Input.get("name")
      })
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
  let likes do
    movies = Movies.find_liked_by_user(user.id)
    books = Books.find_liked_by_user(user.id)
    movies ++ books
  end

  condition Auth.user_id, permission_error

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
        "likes" => for like <- likes do
          link_to(MyAPI.Resource.Like.Read, item: like)
        end,
        "update" => link_to(MyAPI.Resource.Like.Update, user: user.id),
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

```sh[req_affordance<-req_link_to]
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
  "likes": [
    {
      "href": "http://localhost:4000/likes/m1"
    },
    {
      "href": "http://localhost:4000/likes/m2"
    },
    {
      "href": "http://localhost:4000/likes/b1"
    },
    {
      "href": "http://localhost:4000/likes/b2"
    }
  ]
}
```

## error

```elixir[error<-affordance]
defmodule MyAPI.Resource.Users.Read do
    error do
      %{
        "error" => %{
          "message" => "Oops, looks like you can't see this user!"
        }
      }
    end
end
```

## transition_to

```

```


## event

```elixir[event<-link_to]
defmodule MyAPI.Resource.Users.Read do
  event do
    ^IO.puts("User get #{user_id}")
  end
end
```

## test

```elixir[test<-event]
defmodule MyAPI.Resource.Users.Read do
  test "should respond with a user" do
    conn = request do
      bearer 123
    end

    assert conn.status == 200
  end
end
```
