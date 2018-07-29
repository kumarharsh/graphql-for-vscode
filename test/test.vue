<!-- Example.vue -->
<template>
  <query-renderer :environment="environment" :query="query" :variables="variables">
    <template slot-scope="{ props, error, retry }">
      <div v-if="error">{{ error.message }}</div>
      <div v-else-if="props">{{ props.page.name }} is great!</div>
      <div v-else>Loading</div>
    </template>
  </query-renderer>
</template>

<script>
import { QueryRenderer, graphql } from 'vue-relay'

export default {
  name: 'example',
  components: {
    QueryRenderer
  },
  data () {
    return {
      environment: ..., // https://facebook.github.io/relay/docs/en/relay-environment.html
      query: graphql`
        query ExampleQuery($pageID: ID!) {
          page(id: $pageID) {
            name
          }
        }
      `,
      variables: {
        pageID: '110798995619330'
      }
    }
  }
}
</script>
