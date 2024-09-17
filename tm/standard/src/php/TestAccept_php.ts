import { cmp, each, File, Content } from '@voxgig/sdkgen';


import { TestAcceptEntity } from './TestAcceptEntity_php'


const TestAccept = cmp(function TestMain(props: any) {
  const { build } = props;
  const { model } = props.ctx$;

  File({ name: model.name + 'sdk_accept_test.' + build.name }, () => {
    Content(`
<?php
namespace ${model.name}_test;

use PHPUnit\\Framework\\TestCase;
use Dotenv\\Dotenv;
use Plantquest\\Client;
         `);

    each(model.main.sdk.entity, (entity: any) => {
      TestAcceptEntity({ model, build, entity });
    });

    Content(`
?>
        `);
  });
});

export {
  TestAccept
};
