import { cmp, camelify, Content } from '@voxgig/sdkgen';



const TestAcceptEntity = cmp(function TestEntity(props: any) {
  const { entity } = props;

  entity.Name = camelify(entity.name);

  Content(`
<?php
use PHPUnit\\Framework\\TestCase;
use Dotenv\\Dotenv;
use Plantquest\\Client;

class Test${entity.Name}AcceptList extends TestCase {

    protected function setUp(): void {
        \$dotenv = Dotenv::createImmutable(__DIR__);
        \$dotenv->load();
    }

    public function test${entity.Name}AcceptList() {
        \$endpoint = getenv('PLANTQUEST_ENDPOINT');
        \$apikey = getenv('PLANTQUEST_APIKEY');

        \$client = new Client([
            'endpoint' => \$endpoint,
            'apikey' => \$apikey
        ]);

        \$entities = \$client->${entity.Name}()->list();

        if (empty(\$entities)) {
            \$this->fail("Error getting ${entity.name} accept list length == 0");
        }

        \$got = \$entities[0]['data'];

        if (empty(\$got['id'])) {
            \$this->fail("Error getting ${entity.name} accept list - id equal to empty string");
        }
    }
}

class Test${entity.Name}AcceptLoad extends TestCase {

    protected function setUp(): void {
        \$dotenv = Dotenv::createImmutable(__DIR__);
        \$dotenv->load();
    }

    public function test${entity.Name}AcceptLoad() {
        \$endpoint = getenv('PLANTQUEST_ENDPOINT');
        \$apikey = getenv('PLANTQUEST_APIKEY');

        \$client = new Client([
            'endpoint' => \$endpoint,
            'apikey' => \$apikey
        ]);

        \$data = [
            'id' => 't01'
        ];

        \$${entity.name} = \$client->${entity.Name}()->load(\$data);

        \$got = \$${entity.name}['data'];

        if (empty(\$got['id'])) {
            \$this->fail("Error getting ${entity.name} accept load - id equal to empty string");
        }
    }
}
?>
`);
});

export {
  TestAcceptEntity
};
