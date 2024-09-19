# $$name$$_sdk.gemspec

Gem::Specification.new do |spec|
  spec.name          = "$$name$$_sdk"
  spec.version       = "0.1.0"
  spec.authors       = ["$$Name$$"]
  spec.email         = ["admin@$$name$$.com"]

  spec.summary       = "A Ruby SDK for interacting with the $$Name$$ API"
  spec.description   = "This SDK provides a simple interface to interact with the $$Name$$ API, enabling developers to manage assets, rooms, and other entities within the $$Name$$ ecosystem."
  spec.homepage      = "https://$$name$$.com/"
  spec.license       = "MIT"

  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = "https://$$name$$.com/sdk"
  spec.metadata["changelog_uri"] = "https://$$name$$.com/sdk/changelog"

  spec.required_ruby_version = ">= 2.6"

  spec.files = Dir["lib/**/*.rb"]
  spec.bindir        = "bin"
  spec.executables   = spec.files.grep(%r{^bin/}) { |f| File.basename(f) }
  spec.require_paths = ["lib"]

  # Runtime dependencies
  spec.add_dependency "json", "~> 2.7"

  # Development dependencies
  spec.add_development_dependency "rake", "~> 13.2"
  spec.add_development_dependency "rspec", "~> 3.10"
  spec.add_development_dependency "rspec-json_expectations", "~> 2.2"
  spec.add_development_dependency "webmock", "~> 3.23"
  spec.add_development_dependency "simplecov", "~> 0.22"
  spec.add_development_dependency "codecov"
  spec.add_development_dependency "pry", "~> 0.14"

  # If you use any files in your Gemfile that should be explicitly included in the gem:
  spec.files += Dir["lib/**/*", "bin/*", "README.md", "LICENSE.txt"]
end
