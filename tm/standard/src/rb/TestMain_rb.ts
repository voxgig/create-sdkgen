import {
  cmp,
  each,
  File,
  Content,
  snakify,
} from '@voxgig/sdkgen';

import { TestEntity } from './TestEntity_rb'

const TestMain = cmp(function TestMain(props: any) {
  const { build } = props
  const { model } = props.ctx$


  File({ name: snakify(model.name) + "_sdk_spec.rb" }, () => {
    Content(`
RSpec.describe '${model.Name}SDK Unit Tests' do  
  before(:each) do
    @client = ${model.Name}SDK.new(
      endpoint: 'http://example.com',
        apikey: 'test_api_key',
    )
  end

  describe 'initialize' do
    it 'creates a new client with the given options' do
      expected_options = { apikey: 'test_api_key', endpoint: 'http://example.com' }
      expect(@client).to be_a(${model.Name}SDK)
      expect(@client.options).to include(expected_options)
    end

    it 'raises an error if the endpoint is not set' do
      expect { ${model.Name}SDK.new(apikey: 'test_api_key') }.to raise_error(ArgumentError)
    end

    it 'raises an error if the apikey is not set' do
      expect { ${model.Name}SDK.new(endpoint: 'http://example.com') }.to raise_error(ArgumentError)
    end

    # it 'initializes the client' do
    #   expect(@client.initialized).to be(false)
    #   @client.init
    #   expect(@client.initialized).to be(true)
    # end

    # it 'ensures the client is initialized' do
    #   expect(@client.initialized).to be(false)
    #   @client.ensure_initialized
    #   expect(@client.initialized).to be(true)
    # end
  end

  # describe '#initialize' do
  #   it 'sets the options' do
  #     expected_options = { apikey: 'test_api_key', endpoint: 'http://example.com' }
  #     expect(@client.options).to include(expected_options)
  #   end
  # end

`);

    each(model.main.sdk.entity, (entity: any) => {
      TestEntity({ model, build, entity });
    });

    Content(`

end

`);
  });
})

export {
  TestMain
}

