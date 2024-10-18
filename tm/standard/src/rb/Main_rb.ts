import {
  cmp,
  each,
  camelify,
  File,
  Content,
  Copy,
  Folder,
  snakify,
  names,
} from '@voxgig/sdkgen';

import { Test } from "./Test_rb";
import { Error } from "./Error_rb";
import { MainEntity } from './MainEntity_rb';

const Main = cmp(async function Main(props: any) {
  const { build } = props;
  const { model } = props.ctx$;

  const { entity, feature } = model.main.sdk

  Copy({ from: "tm/" + build.name + "/Gemfile", name: "Gemfile" });
  Copy({ from: "tm/" + build.name + "/" + 'tm.gemspec', name: snakify(model.Name) + "_sdk.gemspec" });
  Copy({ from: "tm/" + build.name + "/Rakefile", name: "Rakefile" });
  Copy({ from: "tm/" + build.name + "/.env.example", name: ".env.example" });


  Test({ model, build });
  Error({ model, build });

  Folder({ name: "src" }, () => {
    File({ name: snakify(model.Name) + "_sdk." + build.name }, () => {
            
      Content(`
require 'json'
require 'net/http'
require 'digest'
require 'securerandom'
      `);
    
      each(entity, (entity: any) => {
        entity.Name = camelify(entity.name);
        Content(`
require_relative './${snakify(model.Name)}_sdk/${snakify(entity.Name)}'
        `);
      });
      
      each(feature, (feature: any) => {
        names(feature, feature.name)
        Content(`
require_relative './telemetry/${feature.Name}Feature'
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
      
      const features = each(feature).map((feature: any) => {
        const configStr = feature.config ? Object.entries(feature.config)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join(', ') : ''
        return `
          ${feature.name}: ${feature.Name}Feature.new(self, {${configStr}})
        `
      }).join('\n')

      Content(`
class ${model.Name}SDK
  attr_reader :options, :features

  def initialize(options)
      @options = options
          ${validate_options}
      @options[:fetch] ||= ->(url, spec) {
          default_fetch(url, spec)
      }

      @features = {
${features}
      }
  end

  def authentication(method, ent, path)
    bearer_auth = -> { 'Bearer ' + options[:apikey] }

    auth_map = {
    'default' => bearer_auth,
    }

    auth_map[options[:env]] ? auth_map[options[:env]].call() : auth_map['default'].call()
  end


  def endpoint(op, ent)
    data = ent.data || ent.query
    definition = ent.def
    base_url = "#{options[:endpoint]}/#{definition[:name]}"

    if (op == 'load' || op == 'remove') && data[:id] != nil
      url = "#{base_url}/#{data[:id]}"
    else
      url = base_url
    end
    return url
  end

  def method(op, ent)
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
    
Content(`

  def options(new_options = nil)
    if new_options
      @options.merge!(new_options)
    else
      @options
    end
  end

  def cmd
    ${model.Name}SDKCmd.new(self)
  end

  def fetch_spec(op, ent)
    method = self.method(op, ent)
    url = self.endpoint(op, ent)
    spec = {
      url: url,
      method: method,
      headers: {
        'Content-Type' => 'application/json',
        'Authorization' => self.authentication(method, ent, url)
      },
      body: 'GET' == method || 'DELETE' == method ? nil : self.body(op, ent),
    }
    puts "url: #{url}"
    puts "method: #{method}"
    puts "headers: #{spec[:headers]}"
    puts "body: #{spec[:body]}"
    spec
  end
    
  private
          
  def required(type, name, options)
    val = options[name.to_sym]
    unless val.is_a?(Object.const_get(type))
        raise ArgumentError, "${model.Name}SDK: Invalid option: #{name}=#{val}: must be of type #{type}"
    end
  end

  def default_fetch(url, spec)
    uri = URI(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = (uri.scheme == "https")

    request = build_request(uri, spec)

    begin
        response = http.request(request)
        response 
    rescue SocketError => e
        raise ${model.Name}NetworkError.new("Network unreachable: #{e.message}")
    rescue Timeout::Error => e
        raise ${model.Name}TimeoutError.new("Request timed out: #{e.message}")
    rescue StandardError => e
        raise ${model.Name}SDKError.new("Unexpected error: #{e.message}")
    end
  end

  def build_request(uri, spec)
    method = spec[:method]
    request = Net::HTTP.const_get(method.capitalize).new(uri)
    spec[:headers]&.each do |key, value|
      request[key] = value
    end
    if %w[POST PUT].include?(method.upcase) && spec[:body]
      request.body = spec[:body]
    end
    request
  end
end

class ${model.Name}SDKCmd
  attr_reader :sdk

  def initialize(sdk)
    @sdk = sdk
  end
end
    
    `);
    });
});
  
});


export { Main };
