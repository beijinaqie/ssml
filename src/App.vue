<template>
  <div class="options">
    <el-popover
      v-model:visible="popoverVisible"
      placement="bottom"
      :width="300"
      trigger="click"
      :teleported="false"
    >
      <div class="action-list">
        <div class="item" v-for="item in actionList" :key="item.code">
          <el-button @click="selectAction(item)">{{ item.name }}</el-button>
        </div>
      </div>
      <template #reference>
        <div class="option-btn" ref="actionRef">
          <el-button>插入动作</el-button>
        </div>
      </template>
    </el-popover>
    <el-popover
      v-model:visible="popoverVisible"
      placement="bottom"
      :width="300"
      trigger="click"
      :teleported="false"
    >
      <div class="pause-list">
        <div class="item" v-for="item in pauseList" :key="item.code">
          <el-button @click="selectPause(item)">{{ item.name }}</el-button>
        </div>
      </div>
      <template #reference>
        <div class="option-btn" ref="pauseRef">
          <el-button>插入停顿</el-button>
        </div>
      </template>
    </el-popover>
    <el-popover
      v-model:visible="popoverVisible"
      placement="bottom"
      :width="300"
      trigger="click"
      :teleported="false"
    >
      <template #reference>
        <div class="option-btn" ref="imgRef">
          <el-button>插入图片</el-button>
        </div>
      </template>
    </el-popover>
    <el-popover
      v-model:visible="popoverVisible"
      placement="bottom"
      :width="300"
      trigger="click"
      :teleported="false"
    >
      <template #reference>
        <div class="option-btn" ref="phoneRef">
          <el-button>读音</el-button>
        </div>
      </template>
    </el-popover>
  </div>
  <div class="ssml-wrap">
    <SSMLEditor 
      ref="ssmlEditorRef"
      placeholder="请输入你想要的文本"
      :max-words-len="200"
      :ssml-options="ssmlEditor"
      @change="onSSMLEditorChange"
      :ignore-ele="[actionRef, pauseRef, imgRef, phoneRef]"
    >
    </SSMLEditor>
  </div>
  <div class="display">
    <div class="ssml-content">
      <div>ssml-content</div>
      <div>{{ ssmlEditor.ssmlContent }}</div>
    </div>
    <div class="ssml-data">
      <div>ssml-data</div>
      <div>{{ ssmlEditor.ssmlData }}</div>
    </div>
    <div class="ssml">
      <div>ssml</div>
      <div>{{ ssmlEditor.ssml }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { SSMLEditor } from './components/ssml-editor';

const actionRef = ref<HTMLElement>();
const pauseRef = ref<HTMLElement>();
const imgRef = ref<HTMLElement>();
const phoneRef = ref<HTMLElement>();
const ssmlEditorRef = ref<InstanceType<typeof SSMLEditor>>()
const popoverVisible = ref(false);

const actionList = ref([
  {
    id: "1",
    code: "action001",
    name: "鼓掌",
  },
  {
    id: "2",
    code: "action002",
    name: "打招呼",
  },
  {
    id: "3",
    code: "action003",
    name: "挥手",
  }
])
const pauseList = ref([
  {
    id: "1",
    code: "500",
    name: "0.5s"
  },
  {
    id: "2",
    code: "1000",
    name: "1s"
  },
  {
    id: "3",
    code: "3000",
    name: "3s"
  }
])

const ssmlEditor = ref({
  ssml: "",
  ssmlContent: "",
  ssmlData: ""
})

function onSSMLEditorChange(data: any) {
  console.log(data)
  ssmlEditor.value.ssml = data.ssml;
  ssmlEditor.value.ssmlContent = data.ssmlContent;
  ssmlEditor.value.ssmlData = data.ssmlData;
}

function selectAction(item: any) {
  const html = ssmlEditorRef.value?.createLabelHtml("action", item.name, {
    "data-code": item.code,
    "data-name": item.name,
    "data-id": item.id
  })
  popoverVisible.value = false;
  ssmlEditorRef.value?.insertHtml(html);
}

function selectPause(item: any) {
  const html = ssmlEditorRef.value?.createLabelHtml("pause", item.name, {
    "data-code": item.code,
    "data-name": item.name,
    "data-id": item.id
  })
  popoverVisible.value = false;
  ssmlEditorRef.value?.insertHtml(html);
}

onMounted(() => {
  console.log(actionRef.value)
})
</script>

<style lang="scss">
xiaoi-action, xiaoi-pause {
  display: inline-block;
	box-sizing: border-box;
	padding: 0 12px;
	margin: 0 2px;
	line-height: 26px;
	font-style: normal;
	border-radius: 20px;
	user-select: none;
	border: 1px solid transparent;
  background-clip: padding-box, border-box;
  background-origin: padding-box, border-box;
  background-image: linear-gradient(to right, #fff, #fff),
    linear-gradient(121.31deg, #0095e9 -11.16%, #e600eb 115.61%);
  xiaoi-text {
    background: linear-gradient(121.31deg, #0095e9 -11.16%, #e600eb 115.61%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-fill-color: transparent;
  }
}
</style>

<style scoped lang="scss">
.ssml-wrap {
  width: 600px;
  height: 400px;
  border: 1px solid black;
}
.option-btn {
  display: inline-block;
}

.action-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.pause-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
