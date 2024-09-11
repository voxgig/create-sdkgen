import {
  cmp,
  File,
  Code,
  Folder,
  snakify,
} from '@voxgig/sdkgen';

const Entity_ruby = cmp(function Entity_ruby(props: any) {
  const { build, entity } = props;
  const { model } = props.ctx$;

  Folder({ name: "lib" }, () => {
    Folder({ name: snakify(model.Name) + "_sdk" }, () => {
      File({ name: snakify(entity.Name) + ".rb" }, () => {
        Code(`
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

    if status == 200
      json = JSON.parse(res.body, symbolize_names: true)
      yield(json)
    else
      raise "HTTP-ERROR: #{op}: asset: #{status}"
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
    status = res.code.to_i

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
    status = res.code.to_i

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
    status = res.code.to_i

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
    status = res.code.to_i

    handle_result(op, res, spec) do |json|
      return json[:list].map { |data| sdk.Asset(data) }
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
    status = res.code.to_i

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


export { Entity_ruby };
