import { isEmpty } from "lodash-es";
import { parseDocument } from "htmlparser2";
import type { TagType, OptionsType } from "./types";

export const defaultOptions = {
	prefix: "xiaoi",
};

const prefix = () => defaultOptions.prefix;

// 创建标签片段
export function createLabelHtml(tag: TagType, text = "", options?: OptionsType) {
	const labelHtml = {
		p: createPHtml,
		text: createTextHtml,
		action: createActionHtml,
		pause: createPauseHtml,
		br: createBrHtml,
		empty: createEmptyHtml,
		img: createImgHtml,
	};
	let attrsHtml = "";
	const len = arguments.length;

	if (!isEmpty(options)) {
		for (const key in options) {
			attrsHtml += `${key}="${options[key]}" `;
		}
	}

	return labelHtml[tag](text, attrsHtml);
}

// 创建htmlparser2节点
export function createNodeByHtml(html: string, mutiple = false) {
	return mutiple ? parseDocument(html) : parseDocument(html).children[0];
}

// 创建p
export function createPHtml(text = "", attrsHtml = "") {
	const textHtml = text ? createTextHtml(text) : "";
	const brHtml = createBrHtml();
	return `<${prefix()}-p ${attrsHtml}>${textHtml}${brHtml}</${prefix()}-p>`;
}

// 创建文本
export function createTextHtml(text = "", attrsHtml = "") {
	return `<${prefix()}-text>${text}</${prefix()}-text>`;
}

// 创建图片
export function createImgHtml(src?: string, attrsHtml = "") {
	return `<${prefix()}-img ${attrsHtml}>x</${prefix()}-img>`;
}

// 创建换行
export function createBrHtml(text = "", attrsHtml = "") {
	return `<${prefix()}-br ${attrsHtml}><br /></${prefix()}-br>`;
}

// 创建empty
export function createEmptyHtml(text = "", attrsHtml = "") {
	return `<${prefix()}-empty ${attrsHtml}>&#xFEFF;</${prefix()}-empty>`;
}

// 创建动作
export function createActionHtml(text = "", attrsHtml = "") {
	const textHtml = createTextHtml(text);
	const imgHtml = createImgHtml();
	const emptyHtml = createEmptyHtml();
	return `<${prefix()}-action contenteditable="false" ${attrsHtml}>${textHtml}${imgHtml}</${prefix()}-action>${emptyHtml}`;
}

// 创建停顿
export function createPauseHtml(text = "", attrsHtml = "") {
	const textHtml = createTextHtml(text);
	const imgHtml = createImgHtml();
	const emptyHtml = createEmptyHtml();
	return `<${prefix()}-pause contenteditable="false" ${attrsHtml}>${textHtml}${imgHtml}</${prefix()}-pause>${emptyHtml}`;
}
