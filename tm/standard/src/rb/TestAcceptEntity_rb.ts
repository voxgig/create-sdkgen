
import { cmp, camelify, Content } from '@voxgig/sdkgen'


const TestAcceptEntity = cmp(function TestAcceptEntity(props: any) {
  const { entity } = props

  entity.Name = camelify(entity.name)

  Content(`
    describe '${entity.name}-load' do
      it 'loads the entity correctly' do
        out = @client.${entity.Name}.load(id: 't01')
        # puts '${entity.name}-load', out

        expect(out.data).to be_a(Hash)
      end
    end

    describe '${entity.name}-list' do
      it 'lists the entity correctly' do
        out = @client.${entity.Name}.list
        # puts '${entity.name}-list', out

        expect(out).to be_a(Array)
      end
    end

    describe '${entity.name}-create' do
      it 'creates the entity correctly' do
        out = @client.${entity.Name}.create(${JSON.stringify(generateObjectFromFields(entity.field))})
        # puts '${entity.name}-create', out

        expect(out.data).to be_a(Hash)
      end
    end 

    describe '${entity.name}-save' do
      it 'saves the entity correctly' do
        out = @client.${entity.Name}.save(${JSON.stringify(generateObjectFromFields(entity.field))})
        # puts '${entity.name}-save', out

        expect(out.data).to be_a(Hash)
      end
    end

    describe '${entity.name}-remove' do
      it 'removes the entity correctly' do
        out = @client.${entity.Name}.remove(id: 't01')
        # puts '${entity.name}-remove', out

        expect(out.data).to be_a(Hash)
      end
    end
    
  `);
})

function generateObjectFromFields(fields: any) {
  const defaultValues: Record<string, any> = {
    number: 99,
    string: 'foobar',
    object: { foo: 'bar' },
    boolean: false,
    array: ['foo', 'bar', 'baz'],
  }

  const result: Record<string, any> = {}

  for (const key in fields) {
    result[key] = defaultValues[fields[key].type] ?? null;
  }

  return result
}


export {
  TestAcceptEntity
}
