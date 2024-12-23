const { default: makeWASocket,
	DisconnectReason,
	useMultiFileAuthState,
	fetchLatestBaileysVersion,
	Browsers
} = require("@whiskeysockets/baileys");
const path = require("path")
const readline = require("readline");
const pino = require("pino");
const fs = require("fs")
const { handleCommands } = require("./handleCommands.ts")

const question = (string) => {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) => rl.question(string, resolve));
}

exports.connection = async () => {
	const { version } = await fetchLatestBaileysVersion();

	const { state, saveCreds } = await useMultiFileAuthState(
		path.resolve(__dirname, ".", "qrcode")
	);

	const sock = makeWASocket({
		printQrInTerminal: true,
		auth: state,
		version,
		logger: pino({ level: "silent" }),
		markOnlineOnConnect: true,
		browser: Browsers.macOS("safari"),
		syncFullHistory: false,
	});

	if (!sock.authState.creds.registered) {
		let phoneNumber = await question("número: ");
		if (!phoneNumber) {
			console.log("telefone incorreto.");
			return;
		}
		const codigo = await sock.requestPairingCode(phoneNumber);
		console.log(`seu código: ${codigo}`)
	}

	sock.ev.on('connection.update', (update) => {
		const { connection, lastDisconnect } = update

		if (connection === 'close') {
			const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
			console.log('🚨🚨🚨error:\n', lastDisconnect.error, '\nReconnecting: ', shouldReconnect)

			if (shouldReconnect) {
				exports.connection()
			} else {
				fs.rmdirSync('./qrcode', { force: true, recursive: true });
				exports.connection()
			}
		} else if (connection === 'open') {
			console.log('conectado com sucesso')
		}
	})

	sock.ev.on('creds.update', saveCreds);

	await handleCommands(sock);
	return sock

	// sock.ev.on('messages.upsert', m => {
	// 	console.log(JSON.stringify(m, undefined, 2))

	// 	console.log('replying to', m.messages[0].key.remoteJid)
	// 	await sock.sendMessage(m.messages[0].key.remoteJid!, { text: 'Hello there!' })
	// })

}

exports.connection()
