import {
  cmp,
  camelify,
  Content,
} from '@voxgig/sdkgen';

const TestEntity = cmp(function TestEntity(props: any) {
  const { entity, model } = props;

  entity.Name = camelify(entity.name);


  Content(`
    describe '${entity.name}-load' do
      it 'loads the entity with the correct data' do
        stub_request(:get, "http://example.com/${entity.name}/t01")
        .to_return(body: { id: 't01', title: 'T01' }.to_json, headers: { 'Content-Type' => 'application/json' })

        out = @client.${entity.Name}.load(id: 't01')
        expect(out.data).to eq({ id: 't01', title: 'T01' })
      end
    end

    describe '${entity.name}-list' do
      it 'lists the entities with the correct data' do
        stub_request(:get, "http://example.com/${entity.name}")
        .to_return(body: {name: '${entity.name}' ,list:[{ id: 't01', title: 'T01' }, { id: 't02', title: 'T02' }]}.to_json, headers: { 'Content-Type' => 'application/json' })

        out = @client.${entity.Name}.list
        expect(out).to be_an(Array)
        
      end
    end
`);

  // const entityTestCases: Record<string,any> = {
  //   create: {
  //     requestBody: `{ id: 't01', title: 'T01' }`,
  //     responseBody: `{ id: 't01', title: 'T01' }`,
  //     description: 'creates the entity with the correct data'
  //   },
  //   save: {
  //     requestBody: `{ id: 't01', title: 'T01' }`,
  //     responseBody: `{ id: 't01', title: 'T01' }`,
  //     description: 'saves the entity with the correct data'
  //   },
  //   load: {
  //     idParam: 't01',
  //     requestBody: `{ id: 't01' }`,
  //     responseBody: `{ id: 't01', title: 'T01' }`,
  //     description: 'loads the entity with the correct data'
  //   },
  //   list: {
  //     responseBody: `{ name: '${entity.name}', list: [{ id: 't01', title: 'T01' }, { id: 't02', title: 'T02' }]}`,
  //     description: 'lists the entities with the correct data'
  //   },
  //   remove: {
  //     idParam: 't01',
  //     requestBody: `{ id: 't01' }`,
  //     description: 'removes the entity with the correct data'
  //   },
  // }

  // Object.keys(entity.op).forEach((op: any) => {
  //   const testData = entityTestCases[op];
  //   Content(`

  //     describe('${entity.name}-${op}') do
  //       it '${testData.description}' do
  //         stub_request(:${entity.op[op].method}, "http://example.com/${entity.name}${testData.idParam ? `/${testData.idParam}` : ''}")
  //         .to_return(body: ${testData.responseBody ? testData.responseBody : `''`}.to_json, headers: { 'Content-Type' => 'application/json' })

  //         out = @client.${entity.Name}().${op}(${testData.requestBody ? testData.requestBody : ``})
  //         expect(${op == 'list' ? 'out' : 'out.data'}).to eq(${testData.responseBody ? testData.responseBody : ''})
  //       end
  //     end

  //   `);
  // })
});

export { TestEntity };
