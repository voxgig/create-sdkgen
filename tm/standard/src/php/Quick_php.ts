import { cmp, File, Code, Folder } from '@voxgig/sdkgen'

const Quick = cmp(function Quick_php(props: any) {
  const { build, model } = props

  Folder({ name: 'src' }, () => {

    File({ name: 'QuickStart.' + build.name }, () => {

      Code(`<?php
// ${model.Name} QuickStart

require_once __DIR__ . '../../sdk/php/src/PlantquestSDK.php';
require_once __DIR__ . '../../sdk/php/src/Asset.php';
require_once __DIR__ . '../../sdk/php/src/Geofence.php';
require_once __DIR__ . '../../sdk/php/src/Room.php';

use PlantquestSDK\\PlantquestSDK;
use PlantquestSDK\\Asset;
use PlantquestSDK\\Geofence;
use PlantquestSDK\\Room;

// Initialize the SDK
\$options = [
    'apikey' => 'your_api_key',
    'endpoint' => 'https://api.plantquest.com'
];

\$sdk = new PlantquestSDK(\$options);

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
