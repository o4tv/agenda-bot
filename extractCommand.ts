import type { proto } from "@whiskeysockets/baileys";
const { p } = require("./cfg.json")

export const extractCommand = (messageDetails: proto.IWebMessageInfo) => {
	const extendedTextMessage = messageDetails?.message?.extendedTextMessage?.text;

	const textConversation = messageDetails?.message?.conversation;

	const finalMessageText: string = extendedTextMessage || textConversation || "";

	const from: string = messageDetails?.key?.remoteJid ?? "";

	const isCommand = finalMessageText?.startsWith(p) ?? false;

	const commandName = isCommand ? finalMessageText?.slice(1)?.trim().split(/ +/).shift()?.toLowerCase() ?? "" : "";
  //const commandName = isCommand ? finalMessageText?.slice(1).trim().split(/ +/).shift().toLowerCase() : "";

	const args = isCommand ? finalMessageText?.trim().split(/ +/).slice(1) : [];

	return {
		finalMessageText,
		from,
		isCommand,
		commandName,
		args
	}
}
