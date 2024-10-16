# $$name$$_sdk.gemspec

Gem::Specification.new do |spec|
  spec.name          = "$$name$$_sdk"
  spec.version       = "0.1.0"
  spec.authors       = ["$$Name$$"]
  spec.email         = ["$$email$$"]

  spec.summary       = "$$main.sdk.build.rb.desc$$"
  spec.description   = "$$desc$$"
  spec.homepage      = "https://$$name$$.com/"
  spec.license       = "MIT"

  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = "$$main.sdk.build.rb.source_code_uri$$"
  spec.metadata["changelog_uri"] = "$$main.sdk.build.rb.changelog_uri$$"

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
  spec.add_development_dependency "pry", "~> 0.14"
  spec.add_development_dependency 'standard', '~> 1.40.1'

  # If you use any files in your Gemfile that should be explicitly included in the gem:
  spec.files += Dir["lib/**/*", "bin/*", "README.md", "LICENSE.txt"]
end
