---
extends: ../../../../layouts/guide/index.jade
block: content
locals:
  title: Resources - Macros
---

# Macros

When declaring a Mazurka resource several macros are imported for resource construction and definition.

```elixir[initial]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource
end
```

## Resource level

### param

```elixir[param<-initial]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user
end
```

### let

```elixir[let<-param]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user

  let user_id = Params.get("user")
  let user = Users.read(user_id)
end

```

### condition

```elixir[condition<-let]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user

  let user_id = Params.get("user")
  let user = Users.read(user_id)

  condition Auth.user_id == user_id, permission_error
end
```

### mediatype

```elixir[mediatype<-condition]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user

  let user_id = Params.get("user")
  let user = Users.read(user_id)

  condition Auth.user_id == user_id, permission_error

  mediatype Mazurka.Mediatype.Hyperjson do
    # add mediatype actions here
  end
end
```

### event

```elixir[event<-mediatype]
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user

  let user_id = Params.get("user")
  let user = Users.read(user_id)

  condition Auth.user_id == user_id, permission_error

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

  param user

  let user_id = Params.get("user")
  let user = Users.read(user_id)

  condition Auth.user_id == user_id, permission_error

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

  param user

  let user_id = Params.get("user")
  let user = Users.read(user_id)

  condition Auth.user_id == user_id, permission_error

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

  param user

  let user_id = Params.get("user")
  let user = Users.read(user_id)

  condition Auth.user_id == user_id, permission_error

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

  param user

  let user_id = Params.get("user")
  let user = Users.read(user_id)

  condition Auth.user_id == user_id, permission_error

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

  param user

  let user_id = Params.get("user")
  let user = Users.read(user_id)

  condition Auth.user_id == user_id, permission_error

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
