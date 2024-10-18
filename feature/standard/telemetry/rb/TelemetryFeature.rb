require 'opentelemetry/sdk'
require 'opentelemetry/exporter/otlp'

class TelemetryFeature

  # Create a new instance for each client instance
  def initialize(client, config)
    @client = client
    @config = config

    puts "TELEMETRY CONFIG", @config

    @options = client.options[:telemetry]

    puts "TELEMETRY OPTIONS", client.options

    if client.options[:telemetry][:provider]
      puts "USING EXISTING TRACER"
      @tracer = @options[:provider].tracer('PlantquestSDK')
    else
      puts "CREATING NEW TRACER"
      endpoint = ENV['TELEMETRY_ENDPOINT'] || @options[:endpoint]
      service_name = ENV['TELEMETRY_SERVICE_NAME'] || @options[:serviceName] || 'server-sdk'
      service_version = ENV['TELEMETRY_SERVICE_VERSION'] || @options[:serviceVersion] || '0.0.1'
      puts "SERVICE NAME", service_name
      puts "SERVICE VERSION", service_version
      puts "ENDPOINT", endpoint

      OpenTelemetry::SDK.configure do |c|
        c.service_name = service_name
        c.service_version = service_version
        c.add_span_processor(
          OpenTelemetry::SDK::Trace::Export::BatchSpanProcessor.new(
            OpenTelemetry::Exporter::OTLP::Exporter.new(endpoint: endpoint)
          )
        )
      end

      @tracer = OpenTelemetry.tracer_provider.tracer(service_name)
    end
  end


  # If defined, pass in request spec
  # ctx contains context = { start: <time> }
  def modifyRequest(ctx)
    # puts "MODIFY REQUEST", ctx[:entity]
    @tracer.in_span("#{ctx[:entity].def[:name]}#{ctx[:op]}.request") do |span|
      span.set_attribute("entity.operation", ctx[:op])
      span.set_attribute("entity.name", ctx[:entity].def[:name])
      span.set_attribute("http.request.url", ctx[:spec][:url])
      span.set_attribute("http.request.method", ctx[:spec][:method])
      span.set_attribute("http.request.body", ctx[:spec][:body].to_json)
      span.set_attribute("http.request.headers", getHeaders(ctx[:spec][:headers]))
      span.set_attribute("http.response.body", ctx[:result].to_json)
    end

    # force flush
    OpenTelemetry.tracer_provider.force_flush

    return ctx[:spec]
  end

  # ctx contains context = { start: <time>, end: <time>, res: <response> }
  def modifyResponse(ctx)
    # puts "MODIFY RESPONSE", ctx
    @tracer.in_span("#{ctx[:entity].def[:name]}#{ctx[:op]}.response") do |span|
      span.set_attribute("entity.operation", ctx[:op])
      span.set_attribute("entity.name", ctx[:entity].def[:name])
      span.set_attribute("http.request.url", ctx[:spec][:url])
      span.set_attribute("http.request.method", ctx[:spec][:method])
      span.set_attribute("http.request.body", ctx[:spec][:body].to_json)
      span.set_attribute("http.request.headers", getHeaders(ctx[:spec][:headers]))
      span.set_attribute("http.response.body", ctx[:result].to_json)
    end

    # force flush
    OpenTelemetry.tracer_provider.force_flush

    return ctx[:result]
  end

  def getHeaders(headers)
    whitelisted_headers = ['content-type', 'user-agent', 'accept']
    filtered_headers = headers.select { |key, _| whitelisted_headers.include?(key.downcase) }
    filtered_headers.to_json
  end

end
