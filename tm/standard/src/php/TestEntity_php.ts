import { cmp, File, Code, Folder } from '@voxgig/sdkgen'

const TestEntity = cmp(function TestEntity_php(props: any) {
  const { build, entity, model } = props

  Folder({ name: 'tests' }, () => {

    File({ name: entity.Name + 'Test.' + build.name }, () => {

      Code(`<?php
// ${model.Name} ${build.Name} ${entity.Name} Test

use PHPUnit\Framework\TestCase;
use PlantquestSDK\\PlantquestSDK;
use PlantquestSDK\\${entity.Name};

class ${entity.Name}Test extends TestCase {

    protected \$sdk;
    protected \$${entity.Name.toLowerCase()};

    protected function setUp(): void {
        \$options = [
            'apikey' => 'your_api_key',
            'endpoint' => 'https://api.plantquest.com'
        ];

        \$this->sdk = new PlantquestSDK(\$options);
        \$this->${entity.Name.toLowerCase()} = new ${entity.Name}(\$this->sdk);
    }

    public function testSave${entity.Name}() {
        \$data = ['name' => 'Test ${entity.Name}'];
        \$result = \$this->${entity.Name.toLowerCase()}->save(\$data);
        \$this->assertEquals('Test ${entity.Name}', \$result->data['name']);
    }

    public function testLoad${entity.Name}() {
        \$data = ['id' => '123'];
        \$result = \$this->${entity.Name.toLowerCase()}->load(\$data);
        \$this->assertEquals('123', \$result->data['id']);
    }

    public function testList${entity.Name}s() {
        \$result = \$this->${entity.Name.toLowerCase()}->list();
        \$this->assertIsArray(\$result->data);
    }

    public function testRemove${entity.Name}() {
        \$data = ['id' => '123'];
        \$result = \$this->${entity.Name.toLowerCase()}->remove(\$data);
        \$this->assertNull(\$result->data);
    }
}
?>`)
    })
  })
})

export {
  TestEntity
}
