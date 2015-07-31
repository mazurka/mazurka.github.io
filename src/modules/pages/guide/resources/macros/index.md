---
extends: ../../../../layouts/guide/index.jade
block: content
locals:
  title: Resources - Macros
---

# Macros

When declaring a Mazurka resource several macros are imported for resource construction and definition. We'll walk through examples of each one as we build the `MyAPI.Resource.Users.Read` resource.

```elixir[initial]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource
end
```

## Resource level

### param

The `param` macro declares what parameters should be passed into the resource. This information can be used to generate documentation and verify that protocols or other resources are passing the correct information.

In our example resource we're declaring that `user` is required to respond to a request.

```elixir[param_no_validate<-initial]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user
end
```

If we want to validate or transform the param we can pass a `do` block. The value of the parameter will be available as the variable `value`. This makes it easy to check the value against a [service](/guide/services/overview).

```elixir[param<-initial]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user do
    Users.read(value)
  end
end
```

We can add as many of the `param` delcarations as we would like, however in this example, we'll just stick to one.

### let

Now that we've set up our user [param](#param) we can start declaring variables with `let`.

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

### condition

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

```elixir[condition<-let]
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

### mediatype

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
    # add mediatype actions here
  end
end
```

### event

```elixir[event<-mediatype]
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
    # add mediatype actions here
  end

  event do
    ^IO.puts("User get #{user_id}")
  end
end
```

### test

```elixir[test<-event]
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
    # add mediatype actions here
  end

  event do
    ^IO.puts("User get #{user_id}")
  end

  test "should respond with a user" do
    conn = request do
      bearer 123
    end

    assert conn.status == 200
  end
end
```

## Mediatype level

### action

```elixir[action<-test]
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
        "name" => ^Dict.get(user, "name"),
        "avatar" => %{
          "src" => ^Dict.get(user, "image")
        }
      }
    end
  end

  event do
    ^IO.puts("User get #{user_id}")
  end

  test "should respond with a user" do
    conn = request do
      bearer 123
    end

    assert conn.status == 200
  end
end
```

### affordance

```elixir[affordance<-action]
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
        "name" => ^Dict.get(user, "name"),
        "avatar" => %{
          "src" => ^Dict.get(user, "image")
        }
      }
    end

    affordance do
      %{
        "name" => ^Dict.get(user, "name")
      }
    end
  end

  event do
    ^IO.puts("User get #{user_id}")
  end

  test "should respond with a user" do
    conn = request do
      bearer 123
    end

    assert conn.status == 200
  end
end
```

### error

```elixir[error<-affordance]
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
        "name" => ^Dict.get(user, "name"),
        "avatar" => %{
          "src" => ^Dict.get(user, "image")
        }
      }
    end

    affordance do
      %{
        "name" => ^Dict.get(user, "name")
      }
    end

    error do
      %{
        "error" => %{
          "message" => "Oops, looks like you can't see this user!"
        }
      }
    end
  end

  event do
    ^IO.puts("User get #{user_id}")
  end

  test "should respond with a user" do
    conn = request do
      bearer 123
    end

    assert conn.status == 200
  end
end
```

### link_to

```elixir[link_to<-error]
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
        "name" => ^Dict.get(user, "name"),
        "avatar" => %{
          "src" => ^Dict.get(user, "image")
        }
      }
    end

    affordance do
      %{
        "name" => ^Dict.get(user, "name")
      }
    end

    error do
      %{
        "error" => %{
          "message" => "Oops, looks like you can't see this user!"
        }
      }
    end
  end

  event do
    ^IO.puts("User get #{user_id}")
  end

  test "should respond with a user" do
    conn = request do
      bearer 123
    end

    assert conn.status == 200
  end
end
```

### transition_to
