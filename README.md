vue-image-edit
==============
[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][npm-url]
[![vue version][vue-image]][npm-url]

[npm-image]: https://img.shields.io/npm/v/npm.svg
[npm-url]: https://www.npmjs.com/package/vue-image-edit
[travis-image]: https://img.shields.io/badge/build-passing-brightgreen.svg
[vue-image]: https://img.shields.io/badge/vue-v2.3.3-blue.svg
[vue-url]: https://vuejs.org/

> vue的图片编辑组件，兼容pc、移动端

### install
```
npm install vue-image-edit
```

### usage

```
<template lang="pug">
      EditImageDialog(v-model="editImageDialog", :img="editImage", @success="editImageSuccess")
</template>
<script>
    import {EditImageDialog} from 'vue-image-edit'
    export default {
        data() {
            return {
                // 弹出图片编辑框
                editImageDialog: false,
                // 图片地址
                editImage      : '/url/statice/image/1.png'
            }
        },
        methods: {
            async editImageSuccess(base) {
                // base 为编辑之后的图片base64文件
            },
        },
        components: {EditImageDialog},
    }
</script>
```
