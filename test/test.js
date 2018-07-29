const x = gql`
  """
  This is a description
  """
  type Viewer {
    """This is a field level description"""
    sid: String
    "This is a simple description"
    name: String
  }
`;

export default /* GraphQL */`
  query Viewer {
    session {
      id
      isLoggedIn
    }
  }
`;

const Query = Relay.QL`
  query {
    posts(
      first: 1,
      text: "hi"
      contains: """once
       upon
       a time""") {
         id
    }
  }
`;