import {
  cmp,
  File,
  Content,
  Folder,
  snakify,
} from '@voxgig/sdkgen';

const Error = cmp(function Error(props: any) {
  const { build, entity } = props;
  const { model } = props.ctx$;

  Folder({ name: "lib" }, () => {
    Folder({ name: snakify(model.Name) + "_sdk" }, () => {
      File({ name: "errors.rb" }, () => {
        Content(`
class ${model.Name}SDKError < StandardError
    attr_reader :status, :body, :response
    
    def initialize(message, status = nil, body = nil, response = nil)
      super(message)
      @status = status
      @body = body
      @response = response
    end

    def to_s
      "#{super} (status: #{status || 'N/A'}, response body: #{body || 'N/A'})"
    end
  end

  # Network errors
  class ${model.Name}NetworkError < ${model.Name}SDKError; end
  class ${model.Name}TimeoutError < ${model.Name}SDKError; end

  # API errors
  class ${model.Name}BadRequestError < ${model.Name}SDKError; end
  class ${model.Name}AuthenticationError < ${model.Name}SDKError; end
  class ${model.Name}NotFoundError < ${model.Name}SDKError; end
  class ${model.Name}RateLimitError < ${model.Name}SDKError; end
  class ${model.Name}ClientError < ${model.Name}SDKError; end
  class ${model.Name}ServerError < ${model.Name}SDKError; end
`);
      });
    });
  });
});


export { Error };
