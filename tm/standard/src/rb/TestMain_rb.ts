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
RSpec.describe '${model.Name}SDK::Client Unit Tests' do  
  before(:each) do
    ${model.Name}SDK.configure do |config|
      config.options = {
        endpoint: 'http://example.com',
        apikey: 'test_api_key',
      }
    end
    @client = ${model.Name}SDK::Client.new
  end

  describe '.configure' do
    it 'creates a new client with the given options' do
      expected_options = { apikey: 'test_api_key', endpoint: 'http://example.com' }
      expect(@client).to be_a(${model.Name}SDK::Client)
      expect(@client.options).to include(expected_options)
    end

    it 'merges the options with the default options' do
      expected_options = { apikey: 'another_api_key', endpoint: 'http://example.com' }
      another_client = ${model.Name}SDK::Client.new(apikey: 'another_api_key')
      expect(another_client.options).to include(expected_options)
    end
  end

  describe '#initialize' do
    it 'sets the options' do
      expected_options = { apikey: 'test_api_key', endpoint: 'http://example.com' }
      expect(@client.options).to include(expected_options)
    end
  end

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

