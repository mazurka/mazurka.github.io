---
extends: ../../../../layouts/guide/index.jade
block: content
locals:
  title: Resources - Macros
---

# Macros

When declaring a Mazurka resource several macros are imported for resource construction and definition.

```elixir
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource
end
```

## Resource level

### param

```elixir
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user_id
end
```

### let

```elixir
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user_id

  let user_id = Params.get("user")
  let user = Users.read(user_id)
end
```

### condition

```elixir
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  param user_id

  let user_id = Params.get("user")
  let user = Users.read(user_id)

  condition Auth.user_id == user_id, permission_error
end
```

### mediatype

```elixir
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

  let user_id = Params.get("user")
  let user = Users.read(user_id)

  condition Auth.user_id == user_id, permission_error

  mediatype Mazurka.Mediatype.Hyperjson do
    # add mediatype actions here
  end
end
```

### event

```elixir
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

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

```elixir
defmodule MyAPI.Resource.Users.Read do
  use Mazurka.Resource

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

### affordance

### error

### link_to

### transition_to
