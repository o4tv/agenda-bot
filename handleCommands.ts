import { sleep } from "bun";
import moment from "moment";
import fs from "fs";
import { rm_acentos, cap } from "./assets/others";
import { extractCommand } from "./extractCommand";
import { p, g } from "./cfg.json";
import { atividades as atividadesData } from "./assets/atividades.json";

type CommandFunction = (sock: any, from: string, args: string[], messageDetails: any) => void;

interface Command {
    description: string;
    execute: CommandFunction;
}

class CommandHandler {
    private commands: { [key: string]: Command } = {};

    registerCommand(commandName: string, description: string, commandFunction: CommandFunction): void {
        this.commands[commandName] = { description, execute: commandFunction };
    }

    executeCommand(commandName: string, sock: any, from: string, args: string[], messageDetails: any): void {
        const command = this.commands[commandName];
        if (command) {
            command.execute(sock, from, args, messageDetails);
        } else {
            console.log(`Command "${commandName}" not found.`);
        }
    }

    getCommandManual(commandName: string): string {
        const command = this.commands[commandName];
        if (command) {
            return `Manual de uso:\n${command.description}`;
        } else {
            return `Manual for command "${commandName}" not found.`;
        }
    }
}

class Atividade {
    constructor(
        public titulo: string,
        public disciplina: string,
        public data: string,
        public desc: string
    ) {}

    toString(): string {
        return `📍 ${this.titulo}\n📖 Disciplina: ${this.disciplina}\n📅 Data: ${this.data}\n📋 Descrição: \`\`\`${this.desc}\`\`\``;
    }
}

class AtividadeManager {
    private atividades: Atividade[] = atividadesData.map((a: any) => new Atividade(a.titulo, a.disciplina, a.data, a.desc));

    private saveJson(): void {
        fs.writeFileSync("./assets/atividades.json", JSON.stringify({ atividades: this.atividades }));
    }

    addAtividade(titulo: string, disciplina: string, data: string, desc: string): Atividade {
        const atividade = new Atividade(this.capitalize(titulo), this.capitalize(disciplina), data, this.capitalize(desc));
        this.atividades.push(atividade);
        this.saveJson();
        return atividade;
    }

    deleteAtividadeByIndex(index: number): void {
        this.atividades.splice(index, 1);
        this.saveJson();
    }

    deleteAllAtividades(): void {
        this.atividades = [];
        this.saveJson();
    }

    getAllAtividades(): string {
        return this.atividades.map(a => a.toString()).join("\n");
    }

    searchAtividadeIndex(typeofsearch: string, search: string): number[] {
        typeofsearch = rm_acentos(typeofsearch.toLowerCase().replace("ç", "c"));
        let index: number[] = [];
        for (let i = 0; i < this.atividades.length; i++) {
            let atividade = this.atividades[i];
            let value = "";
            switch (typeofsearch) {
                case "titulo":
                    value = atividade.titulo;
                    break;
                case "disciplina":
                    value = atividade.disciplina;
                    break;
                case "data":
                    value = atividade.data;
                    break;
                case "descricao":
                    value = atividade.desc;
                    break;
                default:
                    return [];
            }
            if (value.toLowerCase().includes(search.toLowerCase())) index.push(i);
        }
        return index;
    }

    getDates(): string[] {
        return this.atividades.map(a => a.data);
    }

    organizeDates(dates: string[]): [number, string][] {
        const dateDict = dates.reduce((acc, date, index) => {
            acc[index] = date;
            return acc;
        }, {} as { [key: number]: string });

        const extractMonthDay = (date: string): [number, number] => {
            const [day, month] = date.split('/').map(Number);
            return [month, day];
        };

        return Object.entries(dateDict).map(([key, value]) => [Number(key), value] as [number, string]).sort((a, b) => {
            const [monthA, dayA] = extractMonthDay(a[1]);
            const [monthB, dayB] = extractMonthDay(b[1]);
            return monthA - monthB || dayA - dayB;
        });
    }

    organizeAtividades(): void {
        const dates = this.getDates();
        const sortedIndexes = this.organizeDates(dates);
        this.atividades = sortedIndexes.map(([index]) => this.atividades[Number(index)]);
        this.saveJson();
    }

    update(): void {
        const now = new Date();
        this.atividades = this.atividades.filter(a => {
            const [day, month] = a.data.split('/').map(Number);
            return now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() <= day);
        });
        this.saveJson();
    }

    saveAtividades(sock: any): void {
        sock.groupUpdateDescription(g, this.getAllAtividades());
    }

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

const atividadeManager = new AtividadeManager();
const commandHandler = new CommandHandler();

var menu: string = "Comandos:\n";

const commands = [
    { name: "ping", description: `${p}ping`, execute: (sock: any, from: string, args: string[], messageDetails: any) => {
        if (args.length > 0) {
            sock.sendMessage(from, { text: commandHandler.getCommandManual("ping") });
            return;
        }
        sock.sendMessage(from, { text: "pong" });
    }},
    { name: "comandos", description: `${p}comandos`, execute: (sock: any, from: string, args: string[], messageDetails: any) => {
        if (args.length > 0) {
            sock.sendMessage(from, { text: commandHandler.getCommandManual("comandos") });
            return;
        }
        sock.sendMessage(from, { text: menu });
    }},
    { name: "add", description: `${p}add <titulo> <disciplina> <data> <descricao>`, execute: (sock: any, from: string, args: string[], messageDetails: any) => {
        if (args.length < 4) {
            sock.sendMessage(from, { text: commandHandler.getCommandManual("add") });
            return;
        }
        const [titulo, disciplina, data, ...descParts] = args;
        const desc = descParts.join(" ");
        atividadeManager.addAtividade(titulo, disciplina, data, desc);
        atividadeManager.organizeAtividades();
        sock.sendMessage(from, { text: `${cap(titulo)} adicionado(a).` }, { quoted: messageDetails });
    }},
    { name: "procurar", description: `${p}procurar <tipo> {titulo | disciplina | data | descricao} <busca> ...`, execute: (sock: any, from: string, args: string[], messageDetails: any) => {
        if (args.length < 2) {
            sock.sendMessage(from, { text: commandHandler.getCommandManual("procurar") });
            return;
        }
        const [tipo, busca] = args;
        const listadeindexes = atividadeManager.searchAtividadeIndex(tipo, busca);
        sock.sendMessage(from, { text: `Buscando por "${busca}" em ${tipo}...` });
        let atividadesencontradas = "";
        for (let indexe of listadeindexes) {
            atividadesencontradas += atividadeManager.getAllAtividades()[indexe] + `> index: \`${indexe + 1}\`\n`;
        }
        if (atividadesencontradas != "") {
            sock.sendMessage(from, { text: `Resultados encontrados:\n${atividadesencontradas}` });
        } else {
            sock.sendMessage(from, { text: `Nenhuma correspondência encontrada.` });
        }
    }},
    { name: "listar", description: `${p}listar`, execute: (sock: any, from: string, args: string[], messageDetails: any) => {
        if (args.length > 0) {
            sock.sendMessage(from, { text: commandHandler.getCommandManual("listar") });
            return;
        }
        const todasatividades = atividadeManager.getAllAtividades();
        todasatividades != "" ? sock.sendMessage(from, { text: `Lista de Atividades:\n${todasatividades}` }) : sock.sendMessage(from, { text: "Não há atividades pendentes." });
    }},
    { name: "del", description: `${p}del <index>`, execute: (sock: any, from: string, args: string[], messageDetails: any) => {
        if (args.length < 1) {
            sock.sendMessage(from, { text: commandHandler.getCommandManual("del") });
            return;
        }
        const nargs = args.map(Number);
        nargs.sort((a, b) => a - b);
        for (let i = args.length - 1; i >= 0; i--) {
            atividadeManager.deleteAtividadeByIndex(nargs[i - 1]);
        }
    }},
    { name: "dall", description: `${p}dall`, execute: (sock: any, from: string, args: string[], messageDetails: any) => {
        sock.sendMessage(from, { text: `🚨 Todas as atividades foram deletadas 🚨` });
        atividadeManager.deleteAllAtividades();
    }},
    { name: "from", description: `${p}from`, execute: (sock: any, from: string, args: string[], messageDetails: any) => {
        sock.sendMessage(from, { text: `${from}` });
    }},
    { name: "datas", description: `${p}datas`, execute: (sock: any, from: string, args: string[], messageDetails: any) => {
        const list_datas = atividadeManager.getDates();
        let datas = "";
        for (let d of list_datas) {
            datas += `${d}\n`;
        }
        if (datas == "") {
            datas = "Não há atividades pendentes.";
        }

        sock.sendMessage(from, { text: `${datas}` });
    }},
    { name: "desc", description: `${p}salvar`, execute: (sock: any, from: string, args: string[], messageDetails: any) => {
        atividadeManager.saveAtividades(sock);
    }},
    { name: "limpar", description: `${p}limpar`, execute: (sock: any, from: string, args: string[], messageDetails: any) => {
        atividadeManager.update();
    }}
];

commands.forEach(command => {
    commandHandler.registerCommand(command.name, command.description, command.execute);
    menu += `\`\`\`${p}${command.name}\`\`\`\n`;
});

export const handleCommands = async (sock: any) => {
    sock.ev.on("messages.upsert", async ({ messages }: any) => {
        const messageDetails = messages[0];

        if (!messageDetails.message) return;

        try {
            const { from, isCommand, commandName, args } = extractCommand(messageDetails);
            if (!isCommand || !isMyG(from)) return;
            commandHandler.executeCommand(commandName, sock, from, args, messageDetails);
        } catch (error) {
            console.log("error: ", error);
        }
    });
};

function isMyG(from: string): boolean {
    return from === g;
}