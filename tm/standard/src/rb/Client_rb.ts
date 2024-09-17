import {
  cmp,
  each,
  camelify,
  File,
  Content,
  Folder,
  snakify,
} from '@voxgig/sdkgen';


import { MainEntity } from './MainEntity_rb'


const Client = cmp(async function Client(props: any) {
  const { build } = props;
  const { model } = props.ctx$;

  const entity = model.main.sdk.entity;

  Folder({ name: "lib" }, () => {
    Folder({ name: snakify(model.Name) + "_sdk" }, () => {
      File({ name: "client.rb" }, () => {
        Content(`
# ${model.Name} ${build.Name} SDK

require 'json'
require 'net/http'
        `);

        each(entity, (entity: any) => {
          entity.Name = camelify(entity.name);
          Content(`
require_relative './${snakify(entity.Name)}'
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

        Content(`
module ${model.Name}SDK       
  class Client
    attr_reader :options

    def initialize(opts = {})
        @options = ${model.Name}SDK.options.merge(opts)
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
        ent.nil? && op == 'save' ? 'create' : op
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
        
    private
            
    def required(type, name, options)
      val = options[name.to_sym]
      unless val.is_a?(Object.const_get(type))
          raise ArgumentError, "${model.Name}SDK: Invalid option: #{name}=#{val}: must be of type #{type}"
      end
    end

    def default_fetch(url, method, apikey, body = nil)
      uri = URI(url)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = (uri.scheme == "https")

      request = build_request(uri, method, apikey, body)

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

    def build_request(uri, method, apikey, body)
      request = Net::HTTP.const_get(method.capitalize).new(uri)
      request['Content-Type'] = 'application/json'
      request['Authorization'] = "Bearer #{apikey}"
      request.body = body if %i[post put].include?(method.downcase.to_sym) && body
      request
    end
  end
end
        
        `);
      });
    });
  });
});


export { Client };

