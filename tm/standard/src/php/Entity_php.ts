import { cmp, File, Content, Folder } from '@voxgig/sdkgen'



const Entity = cmp(function Entity(props: any) {
  const { build, entity } = props
  const { model } = props.ctx$

  entity.name = entity.Name.toLowerCase()

  Folder({ name: 'src' }, () => {

    File({ name: entity.Name + '.' + build.name }, () => {

      Content(`<?php
// ${model.Name} ${build.Name} ${entity.Name}

class ${entity.Name} {
    private $sdk;
    private $data = [];

    public function __construct($sdk, $data = []) {
        $this->sdk = $sdk;
        $this->data = $data;
    }

    private function handleResult($op, $response, $handler) {
        $statusContent = $response['status'];

        if ($statusContent == 200) {
            $json = $response['json'];
            return $handler($json);
        } else {
            throw new Exception('HTTP-ERROR: ' . $op . ': ${entity.name}: ' . $statusContent);
        }
    }

    public function save($data) {
        $op = 'save';
        $this->data = $data;

        $spec = $this->sdk->fetchSpec($op, $this->data, $this->def);
        $response = $this->sdk->fetch($spec['url'], $spec);

        return $this->handleResult($op, $response, function($json) {
            $this->data = $json['ent'];
            return $this;
        });
    }

    public function load($data) {
        $op = 'load';
        $this->data = $data;

        $spec = $this->sdk->fetchSpec($op, $this->data, $this->def);
        $response = $this->sdk->fetch($spec['url'], $spec);

        return $this->handleResult($op, $response, function($json) {
            $this->data = $json;
            return $this;
        });
    }

    public function list($data = []) {
        $op = 'list';
        $this->data = $data;

        $spec = $this->sdk->fetchSpec($op, $this->data, $this->def);
        $response = $this->sdk->fetch($spec['url'], $spec);

        return $this->handleResult($op, $response, function($json) {
            $this->data = $json;
            return $this;
        });
    }

    public function remove($data) {
        $op = 'remove';
        $this->data = $data;

        $spec = $this->sdk->fetchSpec($op, $this->data, $this->def);
        $response = $this->sdk->fetch($spec['url'], $spec);

        return $this->handleResult($op, $response, function($json) {
            $this->data = $json;
            return $this;
        });
    }
}
`)
    })
  })
})

export {
  Entity
}
