import {
  cmp,
  File,
  Content,
  Folder,
  snakify,
} from '@voxgig/sdkgen';

const Entity = cmp(function Entity(props: any) {
  const { build, entity } = props;
  const { model } = props.ctx$;

  Folder({ name: "lib" }, () => {
    Folder({ name: snakify(model.Name) + "_sdk" }, () => {
      File({ name: snakify(entity.Name) + ".rb" }, () => {
        Content(`
# ${model.Name} ${build.Name} ${entity.Name}

require 'json'
require 'net/http'

class ${entity.Name}
  attr_accessor :sdk, :def, :data

  def initialize(sdk, data = nil)
    @sdk = sdk
    @def = {
      name: "${entity.name}"
    }
    @data = data
  end

  def handle_result(op, res, spec)
    status = res.code.to_i

    case status
    when 200
      json = JSON.parse(res.body, symbolize_names: true)
      yield(json)
    when 400
      raise ${model.Name}BadRequestError.new("Bad request", status, res.body)
    when 401
      raise ${model.Name}AuthenticationError.new("Authentication failed", status, res.body)
    when 404
      raise ${model.Name}NotFoundError.new("Resource not found", status, res.body)
    when 429
      raise ${model.Name}RateLimitError.new("Rate limit exceeded", status, res.body)
    when 400..499
      raise ${model.Name}ClientError.new("Client error", status, res.body)
    when 500..599
      raise ${model.Name}ServerError.new("Server error", status, res.body)
    else
      raise ${model.Name}SDKError.new("HTTP-ERROR: #{op}: ${entity.name}: #{status}", status, res.body)
    end
  end

  def save(data)
    op = 'save'
    self.data = data
    # TODO: validate data

    body = sdk.body('save', self)
    method = sdk.method('save', self)
    url = sdk.endpoint('save', self)
    
    spec = {}
    res = sdk.options[:fetch].call(url, method, sdk.options[:apikey], body)

    handle_result(op, res, spec) do |json|
      self.data = json
      self
    end
  end

  def create(data)
    op = 'create'
    self.data = data

    body = sdk.body('create', self)
    method = sdk.method('create', self)
    url = sdk.endpoint('create', self)

    spec = {}
    res = sdk.options[:fetch].call(url, method, sdk.options[:apikey], body)

    handle_result(op, res, spec) do |json|
      self.data = json
      self
    end
  end

  def load(data)
    op = 'load'
    self.data = data
    # TODO: check if data.id is defined

    body = sdk.body('load', self)
    method = sdk.method('load', self)
    url = sdk.endpoint('load', self)

    spec = {}
    res = sdk.options[:fetch].call(url, method, sdk.options[:apikey], body)

    handle_result(op, res, spec) do |json|
      self.data = json
      self
    end
  end

  def list(data = {})
    op = 'list'
    self.data = data
    # TODO: check if data.id is defined

    body = sdk.body('load', self)
    method = sdk.method('load', self)
    url = sdk.endpoint('load', self)

    spec = {}
    res = sdk.options[:fetch].call(url, method, sdk.options[:apikey], body)

    handle_result(op, res, spec) do |json|
      return json[:list].map { |data| sdk.${entity.Name}(data) }
    end
  end

  def remove(data)
    op = 'remove'
    self.data = data

    body = sdk.body('remove', self)
    method = sdk.method('remove', self)
    url = sdk.endpoint('remove', self)

    spec = {}
    res = sdk.options[:fetch].call(url, method, sdk.options[:apikey], body)

    handle_result(op, res, spec) do |json|
      self.data = json
      self
    end
  end

end

`);
      });
    });
  });
});


export { Entity };
