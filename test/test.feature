Scenario: Logs a user into the system using username
		When I make a graphql request
    """
		mutation {
			UserLogin(input: {username: "foo"}) {
				clientMutationId
			}
		}
		"""

Scenario: Logs a user into the system using username
		When I send this mutation
    """ #graphql
		mutation {
			UserLogin(input: {username: "foo"}) {
				clientMutationId
			}
		}
		"""
		Then I expect the response json
		"""
		{
			"a": "Kumar Harsh"
		}
		"""
