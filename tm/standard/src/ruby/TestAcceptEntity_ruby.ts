
import { cmp, camelify, Code } from '@voxgig/sdkgen'


const TestAcceptEntity = cmp(function TestEntity_js(props: any) {
  const { entity } = props

  entity.Name = camelify(entity.name)

  Code(`
    describe '${entity.name}-load' do
      it 'loads the entity correctly' do
        out = @client.${entity.Name}.load(id: 't01')
        puts '${entity.name}-load', out

        expect(out.data).to be_a(Hash)
      end
    end

    describe '${entity.name}-list' do
      it 'lists the entity correctly' do
        out = @client.${entity.Name}.list
        puts '${entity.name}-list', out

        expect(out).to be_a(Array)
      end
    end
  `);
})


export {
  TestAcceptEntity
}
