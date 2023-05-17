<template>
	<div
		ref="divEditorRef"
		class="ssml-editor"
		:class="{ 'ssml-editor-empty': isEmpty }"
		contenteditable="true"
		:style="{ '--ssml-placeholder': `'${placeholder}'` }"
		@input="handleInput"
		@focus="handleFocus"
		@blur="handleBlur"
		@click="handleEditorClick"
		@keypress="handleKeypress"
		@compositionstart="handleCompositionStart"
		@compositionupdate="handkeCompositionUpdate"
		@compositionend="handleCompositionEnd"
		@copy="handleCopy"
		@paste="handlePaste"
		@dragover="handleDragOver"
		@drop="handleDrop"
	>
		<p>
			<br />
		</p>
	</div>
</template>

<script setup lang="ts">
import { parseDocument, DomUtils } from "htmlparser2";
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from "vue";
import { createLabelHtml } from "./utils";
import type { SSMLOptionsType } from "./types";

const props = withDefaults(
	defineProps<{
		placeholder?: string;
		// 编辑器限定最大输入 默认不限制
		maxWordsLen?: number;
		ssmlOptions?: SSMLOptionsType;
		ignoreEle?: Array<HTMLElement | undefined>;
	}>(),
	{
		placeholder: "请输入...",
		maxWordsLen: Infinity,
		ssmlOptions: () => {
			return {
				ssml: "",
				ssmlContent: "",
				ssmlData: "",
			};
		},
		ignoreEle: () => [],
	},
);

const emits = defineEmits<{
	(e: "change", data: SSMLOptionsType): void;
	(e: "focus", data: Event): void;
	(e: "blur", data: Event): void;
}>();

// ssml
const ssmlEditor = ref({
	ssmlContent: "",
	ssml: "",
	ssmlData: "",
	html: "",
});
const divEditorRef = ref<HTMLDivElement>();
// 是否是中文输入
const isComposing = ref(false);
// 是否编辑器被禁止输入
const isDisabled = ref(false);
// 编辑器是否聚焦
const isFocus = ref(false);
// 是否是空编辑
const isEmpty = computed(() => {
	return !ssmlEditor.value.ssml.length && !isComposing.value;
});
const inputValue = ref("");
// 光标位置
const cursor: any = ref({
	anchorNode: null,
	anchorOffset: 0,
	focusNode: null,
	focusOffset: 0,
});

const keyLRArr = ["ArrowLeft", "ArrowRight"];
const keyTBArr = ["ArrowUp", "ArrowDown"];
const keyDel = "Backspace";

watch(
	() => props.ssmlOptions,
	(newVal) => {
		if (ssmlEditor.value.ssmlContent !== newVal.ssmlContent) {
			ssmlEditor.value.ssml = ssmlEditor.value.ssmlContent = newVal.ssmlContent ?? "";
			ssmlEditor.value.ssmlData = newVal.ssmlData ?? "";

			parseTextToHtml();
		}
	},
	{
		immediate: true,
		deep: true,
	},
);

// 解析text成html
function parseTextToHtml() {
	const ssml_content = ssmlEditor.value.ssmlContent;
	const ssml_data = ssmlEditor.value.ssmlData;
	let str = "";

	if (ssml_content) {
		const tokens = ssml_content.split("");
		if (ssml_data) {
			const tags = ssml_data.split(",");
			for (const [index, tag] of tags.entries()) {
				const params = tag.split(":");
				const type = params[0];
				const startIndex = Number(params[1]);
				const endIndex = Number(params[2]);
				const code = params[3];
				const name = params[4];
				let html = "";
				if (type === "1") {
					html = createLabelHtml("action", name, {
						"data-code": code,
						"data-name": name,
					});
				} else if (type === "2") {
					html = createLabelHtml("pause", name, {
						"data-code": code,
						"data-name": name,
					});
				}
				tokens.splice(startIndex + index, 0, html);
			}
		}

		const fullHtml = tokens.join("");
		const lines = fullHtml.split("\n");

		// 进行换行拼接
		for (const line of lines) {
			str += `<p>${line ? line : "<br />"}</p>`;
		}
	}

	nextTick(() => {
		divEditorRef.value!.innerHTML = str;
	});
}

// 解析html成text
function parseHtmlTotext() {
	let ssml_content = "";
	let ssml = "";
	let ssml_data = "";

	const innerHTML = divEditorRef.value!.innerHTML;
	const dom = parseDocument(innerHTML);
	const domChildren = DomUtils.getChildren(dom);

	for (const [i, p] of domChildren.entries()) {
		let pChildren = DomUtils.getChildren(p);
		if (pChildren.length) {
			for (const ele of pChildren) {
				if (DomUtils.isText(ele) || (DomUtils.isTag(ele) && DomUtils.getName(ele) === "xiaoi-text")) {
					const content = DomUtils.textContent(ele);
					ssml_content += content;
					ssml += content;
				}
				if (DomUtils.isTag(ele) && DomUtils.getName(ele) === "xiaoi-action") {
					const code = DomUtils.getAttributeValue(ele, "data-code");
					const name = DomUtils.getAttributeValue(ele, "data-name");

					ssml += code;
					ssml_data += `1:${ssml_content.length}:${ssml_content.length}:${code}:${name},`;
				}
				if (DomUtils.isTag(ele) && DomUtils.getName(ele) === "xiaoi-pause") {
					const code = DomUtils.getAttributeValue(ele, "data-code");
					const name = DomUtils.getAttributeValue(ele, "data-name");

					ssml += code;
					ssml_data += `2:${ssml_content.length}:${ssml_content.length}:${code}:${name},`;
				}
			}
		}
		if (i !== domChildren.length - 1) {
			ssml_content += "\n";
			ssml += "\n";
		}
	}

	if (ssml_content.length >= props.maxWordsLen) {
		isDisabled.value = true;
		ssml_content = ssml_content.slice(0, props.maxWordsLen);
	} else {
		isDisabled.value = false;
	}
	ssmlEditor.value.ssmlContent = ssml_content ?? "";
	ssmlEditor.value.ssml = ssml ?? "";
	ssmlEditor.value.ssmlData = ssml_data ? ssml_data.slice(0, -1) : "";
	ssmlEditor.value.html = divEditorRef.value?.innerHTML ?? "";

	emits("change", ssmlEditor.value);
}

// 重置光标
function resetCursor() {
	console.log("清除光标");
	cursor.value.anchorNode = null;
	cursor.value.anchorOffset = 0;
	cursor.value.focusNode = null;
	cursor.value.focusOffset = 0;
}

function insertHtml(html?: string) {
	if (!cursor.value.anchorNode) return;

	divEditorRef.value?.focus();
	setCursorPosition();

	const selection = window.getSelection();
	const range = selection?.getRangeAt(0);

	if (range && html && cursor.value.anchorNode) {
		const node = range.createContextualFragment(html);
		range.insertNode(node);
		range.collapse();

		selection?.removeAllRanges();
		selection?.addRange(range);

		editComposing();

		setTimeout(() => {
			divEditorRef.value?.focus();
		}, 200);
	}
}

function insertActon() {
	if (cursor.value.anchorNode) {
		// divEditorRef.value?.focus()
		// setCursorPosition();
		const html = createLabelHtml("action", "动作", { "data-code": "action001", class: "edit-label edit-action-label" });
		insertHtml(html);
	}
}

function insertPause(e: Event) {
	if (cursor.value.anchorNode) {
		setCursorPosition();
		const html = createLabelHtml("pause", "1s", { "data-code": "1", class: "edit-label edit-pause-label" });
		insertHtml(html);
	}
}

// 确保至少一个p元素在标签内
function setPToEditor() {
	const io = new MutationObserver((mutations) => {
		for (let mutation of mutations) {
			if (!mutation.previousSibling && !mutation.addedNodes.length) {
				const range = new Range();
				const fragment = range.createContextualFragment("<p><br /></p>");
				divEditorRef.value?.appendChild(fragment);
				// 重置元素后，光标位置一并重置
				setTimeout(() => {
					cursor.value.anchorNode = divEditorRef.value?.firstChild;
					cursor.value.anchorOffset = 0;
					cursor.value.focusNode = divEditorRef.value?.firstChild;
					cursor.value.focusOffset = 0;
				}, 200);
			}
		}
	});
	const options = {
		childList: true, // 监视node直接子节点的变动
		subtree: false, // 监视node所有后代的变动
		attributes: false, // 监视node属性的变动
		characterData: false, // 监视指定目标节点或子节点树中节点所包含的字符数据的变化。
		attributeOldValue: false, // 记录任何有改动的属性的旧值
	};
	divEditorRef.value && io.observe(divEditorRef.value!, options);
	onUnmounted(() => {
		io.disconnect();
	});
}

// 键盘抬起事件
function handleKeyUp(e: KeyboardEvent) {
	// console.log("handleKeyUp", e);
	// let position = Cursor.getCurrentCursorPosition(e.target as HTMLDivElement);
	// cursorPosition.value = position;
	if (e.target === divEditorRef.value && keyTBArr.includes(e.key)) {
		emptyLabelToR();
	} else if (e.target === divEditorRef.value && keyLRArr.includes(e.key)) {
		emptyLabelToLR(e.key);
	} else if (e.target === divEditorRef.value && keyDel === e.key) {
		editComposing();
	} else {
		editComposing();
	}
}

// 键盘左移动到标签时，跳过标签
function emptyLabelToL() {
	const selection = window.getSelection();
	if (
		selection &&
		selection.focusNode &&
		(selection.focusNode.parentNode as Element).nodeName === "XIAOI-EMPTY" &&
		selection.focusOffset === 0
	) {
		const firstChild = divEditorRef.value!.firstChild! as Node;
		const node = selection.focusNode.parentNode!;
		if (node !== firstChild) {
			const range = new Range();
			const target = divEditorRef.value as Element;
			range.selectNode(target);
			range.setStart(target, 0);
			range.setEndAfter(node.previousSibling!.previousSibling!);
			range.collapse();
			selection.removeAllRanges();
			selection.addRange(range);
		} else {
			emptyLabelToR();
		}
	}
}

// 键盘右移动到标签时，跳过标签
function emptyLabelToR() {
	const selection = window.getSelection();
	if (selection && selection.focusNode && (selection.focusNode.parentNode as Element).nodeName === "XIAOI-EMPTY") {
		const node = selection.focusNode.parentNode!;
		const range = new Range();
		const target = divEditorRef.value as Element;
		range.selectNode(target);
		range.setStart(target, 0);
		range.setEndAfter(node);
		range.collapse();
		selection.removeAllRanges();
		selection.addRange(range);
	}
}

function emptyLabelToLR(key: string) {
	if (key === "ArrowLeft") {
		emptyLabelToL();
	} else {
		emptyLabelToR();
	}
	getCursorPostition();
}

// 鼠标抬起事件
function handleMouseUp(e: Event) {
	emptyLabelToR();
}

function handleMouseDown(e: Event) {
	console.log("handleMouseDown");
	const list = [...props.ignoreEle, divEditorRef.value];

	for (const value of list) {
		console.log(value)
		if (value?.contains(e.target as HTMLElement)) {
			console.log("不应该清除光标");
			return;
		}
	}
	// 匹配不到则需要重置光标
	resetCursor();
}

function handleKeyDown(e: KeyboardEvent) {
	// console.log(e, "handleKeyDown");
	// if (e.code === "Delete") {
	// e.preventDefault();
	// }
	// if (e.code === "Enter") {
	// 	e.preventDefault();
	// }
}

// 获取鼠标焦点
function getCursorPostition() {
	const selection = window.getSelection();
	// console.log(selection);
	if (selection?.rangeCount) {
		cursor.value.anchorNode = selection.focusNode;
		cursor.value.anchorOffset = selection.focusOffset;
		cursor.value.focusNode = selection.focusNode;
		cursor.value.focusOffset = selection.focusOffset;
	}
}

// 设置鼠标焦点
function setCursorPosition() {
	const target = divEditorRef.value!;
	const selection = window.getSelection();
	const range = new Range();
	range.selectNode(target);
	range.setStart(cursor.value.anchorNode, cursor.value.anchorOffset);
	range.setEnd(cursor.value.focusNode, cursor.value.focusOffset);

	range.collapse();
	selection?.removeAllRanges();
	selection?.addRange(range);
}

function handleInput(e: Event) {
	// console.log("input")
	const value = (e.target as HTMLDivElement)?.textContent ?? "";
	inputValue.value = value;
}

function handleFocus(e: Event) {
	// console.log("focus");
	emits("focus", e);
	isFocus.value = true;
	document.addEventListener("keydown", handleKeyDown);
	document.addEventListener("mousedown", handleMouseDown);
	document.addEventListener("keyup", handleKeyUp);
	document.addEventListener("mouseup", handleMouseUp);
	document.addEventListener("selectionchange", handleSelectionChange);
}
function handleBlur(e: Event) {
	// console.log("blur");
	emits("blur", e);
	isFocus.value = false;
	document.removeEventListener("keydown", handleKeyDown);
	document.removeEventListener("mousedown", handleMouseDown);
	document.removeEventListener("keyup", handleKeyUp);
	document.removeEventListener("mouseup", handleMouseUp);
	document.removeEventListener("selectionchange", handleSelectionChange);
}

function handleSelectionChange(e: Event) {
	// console.log(e)
}

// 可编辑区域点击获取焦点
function handleEditorClick(e: Event) {
	if ((e.target as HTMLElement).nodeName === "IMG") {
		// delLabel(e);
		return;
	}
	// if (!(e.target as HTMLElement).className.includes("editor-area")) {
	// 	return;
	// }
	getCursorPostition();
}

function handleKeypress(e: KeyboardEvent) {
	if (isDisabled.value) {
		e.preventDefault();
	}
}

const compositionCursor = ref({
	anchorOffset: 0,
});
// 中文输入开始
function handleCompositionStart(e: CompositionEvent) {
	console.log("handleCompositionStart");
	isComposing.value = true;
	const selection = window.getSelection();
	compositionCursor.value.anchorOffset = selection?.focusOffset ?? 0;
}

function handkeCompositionUpdate(e: CompositionEvent) {

}

// 中文输入结束
function handleCompositionEnd(e: CompositionEvent) {
	console.log("handleCompositionEnd");
	let dataText = e.data;
	isComposing.value = false;
	// console.log(dataText, ssmlEditor.value.ssmlContent);
	// console.log(dataText, wordCounts.value);
	if (dataText && ssmlEditor.value.ssmlContent.length + dataText.length >= props.maxWordsLen) {
		let n =
			props.maxWordsLen - ssmlEditor.value.ssmlContent.length > 0
				? props.maxWordsLen - ssmlEditor.value.ssmlContent.length
				: 0;
		const selection = window.getSelection();
		let range = selection?.getRangeAt(0);
		if (selection && range) {
			// console.log(cursor.value.focusNode);
			// console.log(compositionCursor.value.anchorOffset, n, compositionCursor.value.anchorOffset + dataText.length);
			range.selectNode(cursor.value.focusNode);
			range.setStart(cursor.value.focusNode, compositionCursor.value.anchorOffset + n);
			range.setEnd(cursor.value.focusNode, compositionCursor.value.anchorOffset + dataText.length);
			range.deleteContents();
			range.collapse();
			selection?.removeAllRanges();
			selection?.addRange(range);
		}
	}
	// handleInput();
}

// 复制事件
function handleCopy(e: ClipboardEvent) {
	// console.log("handleCopy", e);
	const clipboardData = e.clipboardData;
	// console.log(clipboardData);

	if (!clipboardData) return;
	let selection = window.getSelection();
	// console.log(selection);
	const text = window.getSelection()?.toString();
	if (text) {
		// e.preventDefault();
		// clipboardData.setData("text/plain", text + createLabelHtml("生气", "「action001」", "action"));
	}
}

// 黏贴事件
function handlePaste(e: ClipboardEvent) {
	const clipboardData = e.clipboardData?.getData("text");
	e.preventDefault();
	if (!clipboardData || isDisabled.value) return;
	let clipboardDataText = clipboardData;

	if (clipboardData && ssmlEditor.value.ssmlContent.length + clipboardData.length > props.maxWordsLen) {
		clipboardDataText = clipboardData.slice(0, props.maxWordsLen - ssmlEditor.value.ssmlContent.length);
		isDisabled.value = true;
	}
	const selection = window.getSelection()!;
	const range = selection.getRangeAt(0);
	range.deleteContents();
	const textNode = document.createTextNode(clipboardDataText);
	range.insertNode(textNode);
	range.setStart(textNode, 0);
	range.setEnd(textNode, textNode.textContent?.length ?? 0);
	range.collapse();
	selection.removeAllRanges();
	selection.addRange(range);

	// editorVal.value = clipboardDataText;
	// computedWordCount();
}

// 拖放 焦点事件
function handleDragOver(e: DragEvent) {
	// console.log(e, "handleDragOver");
	// getCursorPostition();
}

// 拖放 放事件
function handleDrop(e: DragEvent) {
	const dropData = e.dataTransfer?.getData("text");
	e.preventDefault();
	// if (!dropData || isDisabled.value) return;
	// let dropDataText = dropData;

	// if (dropData && wordCounts.value + dropData.length > maxWordsLen) {
	// 	dropDataText = dropData.slice(0, maxWordsLen - wordCounts.value);
	// 	isDisabled.value = true;
	// }
	// const selection = window.getSelection()!;
	// const range = selection.getRangeAt(0);
	// const textNode = document.createTextNode(dropDataText);
	// range.insertNode(textNode);
	// range.setStart(textNode, 0);
	// range.setEnd(textNode, textNode.textContent?.length ?? 0);
	// range.collapse();
	// selection.removeAllRanges();
	// selection.addRange(range);

	// editorVal.value = dropDataText;
	// computedWordCount();
}

function editComposing() {
	if (!isFocus.value || isComposing.value) return;
	const childNodes = divEditorRef.value!.childNodes;
	// 会有一个问题，没有内容时，标签会超出去

	for (const [p, pEle] of Array.from(childNodes).entries()) {
		for (let i = 0; i < pEle.childNodes.length; i++) {
			const node = pEle.childNodes[i];
			// 如果操作的是empty 节点
			if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === "XIAOI-EMPTY") {
				// 如果在empty节点内输入且empty节点后是标签节点时，需要创建新的文本节点并将其内容移入新的文本节点
				if (
					node.textContent!.length > 1 &&
					(!node.nextSibling || node.nextSibling!.nodeType === Node.ELEMENT_NODE) &&
					!isComposing.value
				) {
					const len = node.textContent!.slice(1).length;
					const textNode = document.createTextNode(node.textContent!.slice(1));
					pEle.insertBefore(textNode, node.nextSibling!);
					node.textContent = node.textContent!.slice(0, 1);
					let selection = window.getSelection()!;
					let range = new Range();
					range.selectNode(textNode);
					range.setStart(node, 0);
					range.setEnd(textNode, len);
					range.collapse();
					selection!.removeAllRanges();
					selection!.addRange(range);
				}
				// 如果在empty节点内输入且empty节点后是文本节点，需要把empty内的文字移入empty后的文本节点
				if (!isComposing.value && node.textContent!.length > 1 && node.nextSibling!.nodeType === Node.TEXT_NODE) {
					const len = node.textContent!.slice(1).length;

					node.nextSibling!.textContent = node.textContent!.slice(1) + node.nextSibling!.textContent;
					node.textContent = node.textContent!.slice(0, 1);
					let selection = window.getSelection();
					let range = new Range();
					range.selectNode(node.nextSibling!);
					range.setStart(node.nextSibling!, 0);
					range.setEnd(node.nextSibling!, len);
					range.collapse();
					selection!.removeAllRanges();
					selection!.addRange(range);
				}
			} else if (
				node.nodeType === Node.ELEMENT_NODE &&
				(node.nodeName === "XIAOI-ACTION" || node.nodeName === "XIAOI-PAUSE")
			) {
				// 如果标签节点后没有空节点则认为是执行了删除操作，应当把标签节点一并删除掉
				const nextNode = node.nextSibling!;
				if (!nextNode || (nextNode && nextNode.nodeName !== "XIAOI-EMPTY")) {
					node.remove();
				}
			}

			// 第一个节点
			if (i === 0) {
				// 处理换行后标签是空节点的问题
				if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === "XIAOI-EMPTY" && !node.nextSibling) {
					const range = new Range();
					const brNode = range.createContextualFragment("<br />");
					pEle.replaceChild(brNode, node);
				}
				// 如果在首位插入标签，应当在插入标签的时候在其前面插入空格元素
				if (
					!node?.textContent?.length &&
					(node.nextSibling?.nodeName === "XIAOI-ACTION" || node.nextSibling?.nodeName === "XIAOI-PAUSE")
				) {
					const emptyLableHtml = createLabelHtml("empty");
					let selection = window.getSelection();
					let range = new Range();
					let emptyNode = range.createContextualFragment(emptyLableHtml);

					pEle.replaceChild(emptyNode, node);
					range.selectNode(pEle);
					range.setStart(pEle, 0);
					range.setEnd(pEle, 3);
					range.collapse();
					selection!.removeAllRanges();
					selection!.addRange(range);
				}
				// 如果删除的首位只剩下标签元素，则在其前面插入空格元素
				if (node.nodeName === "XIAOI-ACTION" || node.nodeName === "XIAOI-PAUSE") {
					const emptyLableHtml = createLabelHtml("empty");
					let selection = window.getSelection();
					let range = new Range();
					let emptyNode = range.createContextualFragment(emptyLableHtml);

					pEle.insertBefore(emptyNode, node);
					range.selectNode(pEle);
					range.setStart(pEle, 0);
					range.setEnd(pEle, 1);
					range.collapse();
					selection!.removeAllRanges();
					selection!.addRange(range);
				}
				// 如果第一个节点是empty空节点，且empty后面的节点为文本节点，则删除掉empty空节点
				if (
					node?.nodeType === Node.ELEMENT_NODE &&
					node.nodeName === "XIAOI-EMPTY" &&
					node?.nextSibling?.nodeType === Node.TEXT_NODE
				) {
					node.remove();
				}
			}
			if (i === pEle.childNodes.length - 1) {
				// 最后一个节点 如果包含换行则删掉
				if (i > 0 && node.nodeType === Node.ELEMENT_NODE && node.nodeName === "BR") {
					node.remove();
				}
			}
		}
	}
	parseHtmlTotext();
	getCursorPostition();
}

defineExpose({
	insertHtml,
	createLabelHtml,
});

onMounted(() => {
	setPToEditor();
	// document.addEventListener("keydown", handleKeyDown);
	// document.addEventListener("mousedown", handleMouseDown);
	// document.addEventListener("keyup", handleKeyUp);
	// document.addEventListener("mouseup", handleMouseUp);
});

onUnmounted(() => {
	document.removeEventListener("keydown", handleKeyDown);
	document.removeEventListener("mousedown", handleMouseDown);
	document.removeEventListener("keyup", handleKeyUp);
	document.removeEventListener("mouseup", handleMouseUp);
});
</script>

<style>
.ssml-editor {
	width: 100%;
	height: 100%;
	line-height: 30px;
	box-sizing: border-box;
	outline: none;
	caret-color: #fd7a1e;
	word-break: break-all;
	position: relative;
	overflow: hidden;
	overflow-y: scroll;
}
.ssml-editor p {
		position: relative;
		margin-top: 0;
		margin-bottom: 10px;
	}
.ssml-editor::--webkit-scrollbar {
	display: none;
}
.ssml-editor-empty p:first-child::before {
	position: absolute;
	cursor: text;
	color: #999;
	font-size: 14px;
	content: var(--ssml-placeholder);
}
</style>
