export interface SSMLOptionsType {
	ssml?: string;
	ssmlContent?: string;
	ssmlData?: string;
	html?: string;
}

export type TagType = "p" | "text" | "br" | "empty" | "action" | "pause";

export interface OptionsType {
	[key: string]: any;
}
