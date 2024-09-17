import { cmp, File, Content, Folder } from '@voxgig/sdkgen'



const Main = cmp(function Main(props: any) {
  const { build, model } = props

  Folder({ name: 'src' }, () => {

    File({ name: 'Main.' + build.name }, () => {

      Content(`<?php
// ${model.Name} Main

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

// Example usage
\$asset = new Asset(\$sdk);
\$asset->save(['name' => 'New Asset']);

\$geofence = new Geofence(\$sdk);
\$geofence->save(['name' => 'New Geofence']);

\$room = new Room(\$sdk);
\$room->save(['name' => 'New Room']);

?>`)
    })
  })
})

export {
  Main
}
