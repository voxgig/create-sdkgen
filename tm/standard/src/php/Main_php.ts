import { cmp, File, Code, Folder } from '@voxgig/sdkgen'

const Main_php = cmp(function Main_php(props: any) {
  const { build, model } = props

  Folder({ name: 'src' }, () => {

    File({ name: 'Main.' + build.name }, () => {

      Code(`<?php
// ${model.Name} Main

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
    'endpoint' => 'https://api.plantquest.com'
];

\$sdk = new ${model.Name}SDK(\$options);

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
  Main_php
}
