const { trace } = require('@opentelemetry/api');
const { SimpleSpanProcessor, BasicTracerProvider, ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = require('@opentelemetry/semantic-conventions');


class TelemetryFeature {
  client
  config
  options
  tracer
  
  // Create a new instance for each client instance
  constructor(client, config) {
    this.client = client
    this.config = config

    console.log('TELEMETRY CONFIG', config)

    this.options = client.options.telemetry

    console.log('TELEMETRY OPTIONS', this.options)

    let provider
    let serviceName = process.env.TELEMETRY_SERVICE_NAME || this.options.serviceName
    let serviceVersion = process.env.TELEMETRY_SERVICE_VERSION || this.options.serviceVersion
    let endpoint = process.env.TELEMETRY_ENDPOINT || this.options.endpoint

    if (this.options.provider) {
      provider = this.options.provider
    } else {
      provider = new BasicTracerProvider({ 
        resource: new Resource({ [ATTR_SERVICE_NAME]: serviceName, [ATTR_SERVICE_VERSION]: serviceVersion })
      });
    
      const otlpExporter = new OTLPTraceExporter({ url: endpoint });
    
      provider.addSpanProcessor(new SimpleSpanProcessor(otlpExporter));
      // provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
      provider.register();
    }

    this.tracer = provider.getTracer(serviceName) || trace.getTracer(serviceName)

  }


  // If defined, pass in request spec
  // ctx contains context = { start: <time> }
  modifyRequest(ctx) {
    // console.log('TELEMETRY MODIFY REQUEST', ctx)

    const span = this.tracer.startSpan(ctx.entity.def.name + '.' + ctx.op + '.request')
    span.setAttribute('entity.operation', ctx.op)
    span.setAttribute('entity.name', ctx.entity.def.name)
    span.setAttribute('http.request.url', ctx.spec.url)
    span.setAttribute('http.request.method', ctx.spec.method)
    span.setAttribute('http.request.headers', getHeaders(ctx.spec.headers));
    span.end()


    return ctx.spec
  }

  
  // If defined, pass in request spec and response
  // ctx contains context = { start: <time>, end: <time>, res: <response> }
  modifyResult(ctx) {
    // console.log('TELEMETRY MODIFY RESULT', ctx)

    const span = this.tracer.startSpan(ctx.entity.def.name + '.' + ctx.op + '.response')
    span.setAttribute('entity.operation', ctx.op)
    span.setAttribute('entity.name', ctx.entity.def.name)
    span.setAttribute('http.request.url', ctx.spec.url)
    span.setAttribute('http.request.method', ctx.spec.method)
    span.setAttribute('http.request.body', JSON.stringify(ctx.spec.body))
    span.setAttribute('http.request.headers', getHeaders(ctx.spec.headers))
    span.setAttribute('http.response.body', JSON.stringify(ctx.result))
    span.end()

    return ctx.result
  }

}
function getHeaders(headers) {
  return JSON.stringify(Object.keys(headers)
  .filter(key => ['content-type', 'user-agent', 'accept'].includes(key.toLowerCase()))
  .reduce((obj, key) => ({ ...obj, [key]: headers[key] }), {}));
}

module.exports = {
  TelemetryFeature
}