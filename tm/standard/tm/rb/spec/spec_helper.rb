require 'bundler/setup'
require 'rspec'
require 'webmock/rspec'
require 'plantquest_sdk'

WebMock.disable_net_connect!(allow_localhost: true)

RSpec.configure do |config|
  # Enable flags like --only-failures and --next-failure
  config.example_status_persistence_file_path = ".rspec_status"

  config.expect_with :rspec do |expectations|
    # This options is used to enable RSpec to display the chain clauses in the error message
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
  end

  config.mock_with :rspec do |mocks|
    # Prevents you from mocking or stubbing a method that does not exist on
    mocks.verify_partial_doubles = true
  end

end
