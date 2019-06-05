About Space
===

Space, the final frontier. These are the voyages of the starship Enterprise. Its 5-year mission, to explore strange new worlds, to seek out new life and new civilizations, to boldly go where no man has gone before.

# Our missions

To view our missions, just run this query on your ship terminals:

```graphql
query {
  viewer {
    missions {
      id
      secretName
      coords
    }
  }
}
```

# The species we've met

In this galaxy there’s a mathematical probability of three million Earth-type planets. And in the universe, three million million galaxies like this. And in all that, and perhaps more, only one of each of us.

```GraphQL
query {
  viewer {
    species(filters: {
      cluster: 'phoenix',
    }, first: 10) {
      name
      homePlanet
    }
  }
}
```
