import { cmp, Code } from '@voxgig/sdkgen';

const MainEntity = cmp(async function MainEntity(props: any) {
  const { entity } = props;

  const def = JSON.stringify(entity);

  Code(`
  def ${entity.Name}(data={})
    ${entity.Name}.new(self, data)
  end

`);
});

export { MainEntity };
