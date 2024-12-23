const { sleep } = require("bun");
const moment = require("moment")
const fs = require("fs")
const { rm_acentos } = require("./assets/others.js");
const { extractCommand } = require("./extractCommand.js");
const { p, g } = require("./cfg.json")
const atividadeBase = "📍 $titulo\n📖 Disciplina: $materia\n📅 Data: $data\n📋 Descrição: ```$desc```\n";

var { atividades } = require("./assets/atividades.json");

function cap(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

function getDate(atividade) {
	let l = "Data: ";
	let dataindex = atividade.indexOf(l);
	let data = atividade.slice(dataindex + l.length);
	data = data.slice(0, data.indexOf("\n"));
	return data
}

function getDates() {
	let dates = [];
	for (let atividade of atividades) {
		data = getDate(atividade);
		if (data) {
			dates.push(data);
		}
	}
	return dates;
}

function organizarDatas(lista) {
	let dicionario = lista.reduce((acc, valor, index) => {
		acc[index] = valor;  // Usa o índice como chave e o valor como o valor
		return acc;
	}, {});

	// Função auxiliar para extrair o mês e o dia
	function extrairMesDia(data) {
		const [dia, mes] = data.split('/').map(Number);
		return [mes, dia]; // Prioriza o mês na ordenação
	}

	// Converter o objeto em um array de entradas [chave, valor]
	const entradasOrdenadas = Object.entries(dicionario).sort((a, b) => {
		const [mesA, diaA] = extrairMesDia(a[1]);
		const [mesB, diaB] = extrairMesDia(b[1]);

		// Comparar primeiro os meses, depois os dias
		return mesA - mesB || diaA - diaB;
	});

	return entradasOrdenadas; // Retorna como array
}

function organizarAtividades() {
	let dates = getDates();
	let datesIndex = organizarDatas(dates);
	let result = [];
	for (let ls of datesIndex) {
		let index = ls[0];
		result.push(atividades[index]);
	}
	atividades = result;
	saveJson();
}

function saveJson() {
	fs.writeFileSync("./assets/atividades.json", JSON.stringify({ atividades }));
}

function addAtividade(titulo, materia, data, desc) {
	let atividade = atividadeBase;
	atividade = atividade.replace("$titulo", cap(titulo));
	atividade = atividade.replace("$materia", cap(materia));
	atividade = atividade.replace("$data", data);
	atividade = atividade.replace("$desc", cap(desc));
	atividades.push(atividade);
	saveJson();
	return atividade
}

function searchAtividadeIndex(typeofsearch, search) {
	typeofsearch = rm_acentos(typeofsearch.toLowerCase().replace("ç", "c"));
	let index = [];
	for (let i = 0; i < atividades.length; i++) {
		let atividade = atividades[i];
		let indexof = 0;
		let indexofn = 0;
		let l = "";
		switch (typeofsearch) {
			case "titulo":
				l = "📍 ";
				indexof = atividade.indexOf(l);
				atividade = atividade.slice(indexof + l.length);
				indexofn = atividade.indexOf("\n");
				atividade = atividade.slice(0, indexofn);
				break;
			case "disciplina":
				l = "📖 Disciplina: ";
				indexof = atividade.indexOf(l);
				atividade = atividade.slice(indexof + l.length);
				indexofn = atividade.indexOf("\n");
				atividade = atividade.slice(0, indexofn);
				break;
			case "data":
				l = "📅 Data: ";
				indexof = atividade.indexOf(l);
				atividade = atividade.slice(indexof + l.length);
				indexofn = atividade.indexOf("\n");
				atividade = atividade.slice(0, indexofn);
				break;
			case "descricao":
				l = "📋 Descrição: ";
				indexof = atividade.indexOf(l);
				atividade = atividade.slice(indexof + l.length);
				break;
			default:
				return false;
				break;
		}
		if (atividade.toLowerCase().includes(search.toLowerCase())) index.push(i);
	}
	return index;
}

function deleteAtividadebyIndex(index) {
	atividades.splice(index, 1);
	saveJson();
}

// function printatividade(materia, data, desc) {
// 	let atividade = atividadeBase;
// 	atividade = atividade.replace("$materia", materia);
// 	atividade = atividade.replace("$data", data);
// 	atividade = atividade.replace("$desc", desc);
// 	console.log(atividade)
// }

function allatividades() {
	// if (atividades.length == 0) return "Nenhuma atividade"
	listadeatividades = "";
	let n = atividades.length - 1;
	for (let atividade of atividades)
		listadeatividades += atividade == atividades[n] ? atividade : atividade + "\n";
	return listadeatividades
}

function today() {}

function deleteAllAtividades() {
	atividades = [];
	saveJson();
}

function isMyG(from) {
	return from == g;
}

function update() {
	const now = new Date();
	let datas = getDates();

	// for (let data of datas) {
	for (let i = datas.length - 1; i >= 0; i--) {
		let [dia, mes] = datas[i].split('/').map(Number)

		// console.log(`${dia}/${mes} e ${now.getDate()}/${now.getMonth()+1	}`)
		if (now.getMonth() + 1 > mes) {
			// console.log(atividades[i].slice(0,-1))
			atividades.splice(i, 1)
		} else if (now.getMonth() + 1 == mes) {
			if (now.getDate() > dia) {
				// console.log(atividades[i].slice(0,-1))
				atividades.splice(i, 1)
			}
		}
	}
	saveJson();
}

function saveAtividades(sock) {
	sock.groupUpdateDescription(g, allatividades())
}

//a função man é a função que retornará o manual do comando
function man(sock, from, command) {
	manual = {
		"ping": `${p}ping`,
		"comandos": `${p}comandos`,
		"add": `${p}add <titulo> <materia> <data> <descricao>`,
		"listar": `${p}listar`,
		"procurar": `${p}procurar <tipo> {titulo | disciplina | data | descricao} <busca> ...`,
		"del": `${p}del <index>`,
		"dall": `${p}dall`,
		"datas": `${p}datas`
	}
	sock.sendMessage(from, { text: `modo de uso:\n${manual[command]}` });
}

exports.handleCommands = async (sock) => {
	sock.ev.on("messages.upsert", async ({ messages }) => {
		const messageDetails = messages[0];

		if (!messageDetails.message) return;

		try {
			//console.log(extractCommand(messageDetails))
			const { from, isCommand, commandName, args } = extractCommand(messageDetails);
			if ((!isCommand) || (!isMyG(from))) return;
			switch (commandName) {
				case "ping":
					if ((args.length > 0)) {
						man(sock, from, "ping");
						return
					}
					sock.sendMessage(from, { text: "pong" });
					break;
				case "comandos":
				case "c":
					if ((args.length > 0)) {
						man(sock, from, "comandos");
						return
					}
					let menu = `*Comandos*:\n\`\`\`${p}ping\n${p}comandos\n${p}add\n${p}procurar\n${p}listar\n${p}del\n${p}datas\`\`\``;
					sock.sendMessage(from, { text: menu });
					break;
				case "add":
					if ((args.length < 4)) {
						man(sock, from, "add");
						return
					}
					if (args[2].includes("\n")) {
						let i = args[2].indexOf('\n');
						let new_args2 = args[2].substring(0, i);
						let new_args3 = args[2].substring(i + 1);

						args[2] = new_args2;
						args[3] = "\n" + new_args3 + " " + args[3];
					}
					await addAtividade(args[0], args[1], args[2], args.slice(3).join(" "));
					organizarAtividades();
					sock.sendMessage(from, { text: `${cap(args[0])} adicionado(a).` }, { quoted: messageDetails });
					break;
				case "procurar":
					if (args.length < 2) {
						man(sock, from, "procurar");
						return
					}
					listadeindexes = searchAtividadeIndex(args[0], args[1]);
					await sock.sendMessage(from, { text: `Buscando por "${args[1]}" em ${args[0]}...` });
					let atividadesencontradas = "";
					for (let indexe of listadeindexes) {
						atividadesencontradas += atividades[indexe] + `> index: \`${indexe+1}\`\n`;
					}
					if (atividadesencontradas != "") {
						sock.sendMessage(from, { text: `Resultados encontrados:\n${atividadesencontradas}` });
					} else {
						sock.sendMessage(from, { text: `Nenhuma correspondência encontrado.` });
					}
					break;
				case "listar":
				case "ls":
					if ((args.length > 0)) man(sock, from, "listar");
					todasatividades = allatividades();
					todasatividades != "" ? sock.sendMessage(from, { text: `Lista de Atividades:\n${todasatividades}` }) : sock.sendMessage(from, { text: "Não há atividades pendentes." });
					break;
				case "del":
					if ((args.length < 1)) man(sock, from, "del");
					let nargs = args.map(Number);
					nargs.sort((a, b) => a - b);
					for (let i = args.length - 1; i >= 0; i--) {
						deleteAtividadebyIndex(nargs[i-1]);
					}
					break;
				case "dall":
					sock.sendMessage(from, { text: `🚨 Todas as atividades foram deletadas 🚨` })
					console.log("🚨atividades deletadas🚨")
					deleteAllAtividades();
					break;
				case "from":
					sock.sendMessage(from, { text: `${from}` });
					break;
				case "loop":
					sock.sendMessage(from, { text: `${p}loop` });
					break;
				case "datas":
					let list_datas = getDates();
					let datas = "";
					for (let d of list_datas) {
						datas += `${d}\n`;
					}
					sock.sendMessage(from, { text: `${datas}` });
					break;
				case "salvar":
					saveAtividades(sock);
				case "updt":
					update();
					break;
				case "bug":
					
					break;
				default:
					//sock.sendMessage(from, { text: "comando desconhecido" });
					break;
			}
		} catch (erro) {
			console.log("error: ", erro)
		}
	})
}
