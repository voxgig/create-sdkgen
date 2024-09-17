import {
  cmp,
  File,
  Content,
  Copy,
  Folder,
  snakify,
} from '@voxgig/sdkgen';

import { Test } from "./Test_rb";
import { Error } from "./Error_rb";
import { Client } from './Client_rb';

const Main = cmp(async function Main(props: any) {
  const { build } = props;
  const { model } = props.ctx$;

  Copy({ from: "tm/" + build.name + "/Gemfile", name: "Gemfile" });
  Copy({ from: "tm/" + build.name + "/" + 'tm.gemspec', name: snakify(model.Name) + "_sdk.gemspec" });
  Copy({ from: "tm/" + build.name + "/Rakefile", name: "Rakefile" });

  Test({ build });
  Error({ model, build });
  Client({ model, build });

  Folder({ name: "lib" }, () => {
    File({ name: snakify(model.Name) + "_sdk.rb" }, () => {
      Content(`
# ${model.Name} ${build.Name} SDK
`);

      Content(`

require_relative "${model.name}_sdk/client"

module ${model.Name}SDK
  class << self
    attr_accessor :options

    def options
      @options ||= {}
    end

    def configure
      yield self
    end
  end
end
      `);
    });
  });
});


export { Main };
