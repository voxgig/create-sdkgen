
import { cmp, File, Code, Folder } from '@voxgig/sdkgen'


const Entity_python = cmp(function Entity_python(props: any) {
  const { build, entity } = props
  const { model } = props.ctx$

  // console.log('build.name: ', entity.Name, build.name)

  Folder({ name: 'src/' + model.name + '_sdk' }, () => {

    File({ name: entity.Name + '.' + build.extension }, () => {

      Code(`

# from pydantic import BaseModel
# from .Model import Data

# ${model.Name} ${build.Name} ${entity.Name}

class ${entity.Name}:
    def __init__(self, sdk, data = {}):
        self.sdk = sdk
        self.definition = {
          'name': '${entity.name}'
        }
        self.id = data.get('id') or ''
        self.data = data

    def handle_result(self, op, res, spec, handler):
        status = res['status']
        if(200 == status):
            json = res['json']

            return handler(json)
        else:
            raise Exception('HTTP-ERROR: ' + op + '${entity.name}: ' + str(statusCode))

    def create(self, data):
        op = 'create'
        self.data = data
        # TODO: validate data

        spec = self.sdk.fetchSpec(op, self)
        res = self.sdk.options.fetch(spec['url'], spec)

        return self.handle_result(op, res, spec, lambda json: json)

    def save(self, data):
        op = 'save'
        self.data = data
        # TODO: validate data

        spec = self.sdk.fetchSpec(op, self)
        res = self.sdk.options.fetch(spec['url'], spec)

        return self.handle_result(op, res, spec, lambda json: json)

    def load(self, data):
        op = 'load'
        self.data = data
        # TODO: validate data

        spec = self.sdk.fetchSpec(op, self)
        res = self.sdk.options.fetch(spec['url'], spec)

        return self.handle_result(op, res, spec, lambda json: json)

    def list(self, data = {}):
        op = 'list'
        self.data = data
        # TODO: validate data

        spec = self.sdk.fetchSpec(op, self)
        res = self.sdk.options.fetch(spec['url'], spec)

        return self.handle_result(op, res, spec, lambda json: json)


`)
    })
  })
})


export {
  Entity_python
}
