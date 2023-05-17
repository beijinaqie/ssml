<template>
  <div class="options">
    <el-button>插入动作</el-button>
    <el-button>插入停顿</el-button>
    <el-button>插入图片</el-button>
    <el-button>读音</el-button>
  </div>
  <div class="ssml-wrap">
    <SSMLEditor></SSMLEditor>
  </div>
</template>

<script setup lang="ts">
import { SSMLEditor } from './components/ssml-editor';
</script>

<style scoped>
.ssml-wrap {
  width: 600px;
  height: 400px;
  border: 1px solid black;
}
</style>
