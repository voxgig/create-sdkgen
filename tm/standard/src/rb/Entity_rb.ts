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
require_relative 'errors'

class ${entity.Name}
  attr_accessor :sdk, :def, :data, :query

  def initialize(sdk)
    @sdk = sdk
    @def = {
      name: "${entity.name}"
    }
    @data = nil
    @query = nil
  end

  def data(new_data = nil)
    if new_data
      @data = new_data
    else
      @data
    end
  end

  def query(new_query = nil)
    if new_query
      @query = new_query
    else
      @query
    end
  end

  def handle_result(op, res, spec)
    status = res.code.to_i

    case status
    when 200
      if res.body.is_a?(String) && !res.body.empty?
        json = JSON.parse(res.body, symbolize_names: true)
        yield(json)
      elsif res.body.nil? || res.body.empty?
        yield(nil)
      else
        raise TypeError, "Unexpected response body type: #{res.body.class}"
      end
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

  def save(data = nil, flags = {})
    op = 'save'
    @data = data if data

    # check if @data.id is defined
    if @data.nil? || @data[:id].nil?
      raise ${model.Name}SDKError.new("HTTP-ERROR: #{op}: ${entity.name}: id is required", 400, "id is required")
    end

    spec = sdk.fetch_spec('save', self)
    res = sdk.options[:fetch].call(spec[:url], spec)

    handle_result(op, res, spec) do |json|
      self.data = json
      self
    end
  end

  def create(data = nil, flags = {})
    op = 'create'
    @data = data if data

    spec = sdk.fetch_spec('create', self)
    res = sdk.options[:fetch].call(spec[:url], spec)

    handle_result(op, res, spec) do |json|
      self.data = json
      self
    end
  end

  def load(query = nil, flags = {})
    op = 'load'
    @query = query if query
    # TODO: check if data.id is defined

    spec = sdk.fetch_spec('load', self)
    res = sdk.options[:fetch].call(spec[:url], spec)

    handle_result(op, res, spec) do |json|
      self.data = json
      self
    end
  end

  def list(query = nil, flags = {})
    op = 'list'
    @query = query if query
    # TODO: check if data.id is defined

    spec = sdk.fetch_spec('list', self)
    res = sdk.options[:fetch].call(spec[:url], spec)

    handle_result(op, res, spec) do |json|
      json[:list].map do |data| 
        entity = ${entity.Name}.new(sdk)
        entity.data(data)
        entity
      end
    end
  end

  def remove(data = nil, flags = {})
    op = 'remove'
    @data = data if data

    spec = sdk.fetch_spec('remove', self)
    res = sdk.options[:fetch].call(spec[:url], spec)

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
