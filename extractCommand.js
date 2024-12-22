const { p } = require("./cfg.json")

exports.extractCommand = (messageDetails) => {
	const extendedTextMessage = messageDetails?.message?.extendedTextMessage?.text;

	const textConversation = messageDetails?.message?.conversation;

	const finalMessageText = extendedTextMessage || textConversation;

	const from = messageDetails?.key?.remoteJid;

	const isCommand = finalMessageText?.startsWith(p) ?? false;

	const commandName = isCommand ? finalMessageText?.slice(1).trim().split(/ +/).shift().toLowerCase() : "";

	const args = isCommand ? finalMessageText?.trim().split(/ +/).slice(1) : "";

	return {
		finalMessageText,
		from,
		isCommand,
		commandName,
		args
	}
}
