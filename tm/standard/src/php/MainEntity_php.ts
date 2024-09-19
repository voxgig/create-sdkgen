import { cmp, File, Content, Folder } from '@voxgig/sdkgen'



const MainEntity = cmp(function MainEntity(props: any) {
  const { build, entity, model } = props

  Folder({ name: 'src' }, () => {

    File({ name: entity.Name + 'Main.' + build.name }, () => {

      Content(`<?php
// ${model.Name} ${build.Name} ${entity.Name} Main

require_once __DIR__ . '../../sdk/php/src/${model.Name}SDK.php';
require_once __DIR__ . '../../sdk/php/src/${entity.Name}.php';

use ${model.Name}SDK\\${model.Name}SDK;
use ${model.Name}SDK\\${entity.Name};

// Initialize the SDK
\$options = [
    'apikey' => 'your_api_key',
    'endpoint' => 'https://api.${model.name}.com'
];

\$sdk = new ${model.Name}SDK(\$options);

// Example usage
\$${entity.Name.toLowerCase()} = new ${entity.Name}(\$sdk);
\$${entity.Name.toLowerCase()}->save(['name' => 'New ${entity.Name}']);
\$${entity.Name.toLowerCase()}->load(['id' => '123']);
\$${entity.Name.toLowerCase()}->list();
\$${entity.Name.toLowerCase()}->remove(['id' => '123']);

?>`)
    })
  })
})

export {
  MainEntity
}
