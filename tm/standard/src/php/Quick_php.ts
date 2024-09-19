import { cmp, File, Content, Folder } from '@voxgig/sdkgen'



const Quick = cmp(function Quick(props: any) {
  const { build, ctx$: { model } } = props

  Folder({ name: 'src' }, () => {

    File({ name: 'QuickStart.' + build.name }, () => {

      Content(`<?php
// ${model.Name} QuickStart

require_once __DIR__ . '../../sdk/php/src/${model.Name}SDK.php';
require_once __DIR__ . '../../sdk/php/src/Asset.php';
require_once __DIR__ . '../../sdk/php/src/Geofence.php';
require_once __DIR__ . '../../sdk/php/src/Room.php';

use ${model.Name}SDK\\${model.Name}SDK;
use ${model.Name}SDK\\Asset;
use ${model.Name}SDK\\Geofence;
use ${model.Name}SDK\\Room;

// Initialize the SDK
\$options = [
    'apikey' => 'your_api_key',
    'endpoint' => 'https://api.${model.name}.com'
];

\$sdk = new ${model.Name}SDK(\$options);

// Quick example usage
\$asset = new Asset(\$sdk);
\$asset->save(['name' => 'New Asset']);
\$asset->load(['id' => '123']);
\$asset->list();
\$asset->remove(['id' => '123']);

\$geofence = new Geofence(\$sdk);
\$geofence->save(['name' => 'New Geofence']);
\$geofence->load(['id' => '456']);
\$geofence->list();
\$geofence->remove(['id' => '456']);

\$room = new Room(\$sdk);
\$room->save(['name' => 'New Room']);
\$room->load(['id' => '789']);
\$room->list();
\$room->remove(['id' => '789']);

?>`)
    })
  })
})

export {
  Quick
}
