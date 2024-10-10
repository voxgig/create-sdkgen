import { cmp, Content } from '@voxgig/sdkgen';

const MainEntity = cmp(async function MainEntity(props: any) {
  const { entity } = props;

  const def = JSON.stringify(entity);

  Content(`
  def ${entity.Name}
    ensure_initialized
    ${entity.Name}.new(self)
  end

`);
});

export { MainEntity };
