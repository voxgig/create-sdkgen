import {
  cmp,
  each,
  camelify,
  File,
  Code,
  Copy,
  Folder,
  snakify,
} from '@voxgig/sdkgen';

import { MainEntity } from "./MainEntity_ruby";
import { Test } from "./Test_ruby";

const Main_ruby = cmp(async function Main_ruby(props: any) {
  const { build } = props;
  const { model } = props.ctx$;

  const entity = model.main.sdk.entity;

  Copy({ from: "tm/" + build.name + "/Gemfile", name: "Gemfile" });
  const gemspecName = snakify(model.Name) + "_sdk.gemspec";
  Copy({ from: "tm/" + build.name + "/" + gemspecName, name: gemspecName });
  Copy({ from: "tm/" + build.name + "/Rakefile", name: "Rakefile" });

  Test({ build });

  Folder({ name: "lib" }, () => {
    File({ name: snakify(model.Name) + "_sdk.rb" }, () => {
      Code(`
# ${model.Name} ${build.Name} SDK

require 'json'
require 'net/http'
`);

      each(entity, (entity: any) => {
        entity.Name = camelify(entity.name);
        Code(`
require_relative './${snakify(model.Name)}_sdk/${snakify(entity.Name)}'
`);
      });

      const validate_options = each(build.options).reduce(
        (a: string, opt: any) =>
          a +
          ("String" === opt.kind
            ? `    required('String','${opt.name}', @options)\n`
            : ""),
        ""
      );

      Code(`

module ${model.Name}SDK
  @options = {}

  def self.config
    @options
  end

  def self.configure(&block)
    block.call(config)
  end

end

    
class ${model.Name}SDK::Client
  attr_reader :options

  # def self.configure(options)
  #  return new(options)
  # end

  def initialize(options = nil)
    @options = ${model.Name}SDK.config.merge(options || {})

    ${validate_options}

    @options[:fetch] ||= ->(url, method, apikey, body = nil) {
      default_fetch(url, method, apikey, body)
    }
  end

  def endpoint(op, ent)
    data = ent.data
    definition = ent.def
    base_url = "#{options[:endpoint]}/#{definition[:name]}"

    if (op == 'load' || op == 'remove') && data[:id] != nil
      "#{base_url}/#{data[:id]}"
    else
      base_url
    end
  end

  def method(op, ent)
    # key = ent.nil? || ent[:id].nil? && op == 'save' ? 'create' : op
    key = ent.nil? && op == 'save' ? 'create' : op
    {
      'create' => 'POST',
      'save' => 'PUT',
      'load' => 'GET',
      'list' => 'GET',
      'remove' => 'DELETE'
    }[op]
  end

  def body(op, ent)
    msg = ent.data.dup
    JSON.generate(msg)
  end

`);

      each(entity, (entity: any) => {
        MainEntity({ model, build, entity });
      });

      Code(`
end

private

  def required(type, name, options)
    val = options[name.to_sym]
    unless val.is_a?(Object.const_get(type))
      raise "${model.Name}SDK: Invalid option: #{name}=#{val}: must be of type #{type}"
    end
  end

  def default_fetch(url, method, apikey, body = nil)
    uri = URI(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = (uri.scheme == "https")

    request = Net::HTTP.const_get(method.capitalize).new(uri)
    request['Content-Type'] = 'application/json'
    request['Authorization'] = "Bearer #{apikey}"

    if %w[POST PUT].include?(method.upcase)
      request.body = body if body
    end

    response = http.request(request)
    response
  end

`);
    });
  });
});


export { Main_ruby };
