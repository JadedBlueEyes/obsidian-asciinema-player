import { App, Plugin, Notice, WorkspaceLeaf, Setting, PluginSettingTab } from 'obsidian'

import CastView from  './castView'
import { t } from './locales/helpers';
import { getAsciinemaPlayerJSContent, getAsciinemaPlayerCSSContent } from './asciinema-assets'

/*
interface AsciinemaPlayerSettings {
	firstRun: boolean
	cols: number
	rows: number
	autoPlay: boolean
	preload: boolean
	loop: boolean
	startAt: string
	speed: number
	idleTimeLimit: number
	theme: string
	poster: string
	fit: string
	controls: string
	markers: string
	pauseOnMarkers: boolean
	terminalFontSize: string
	terminalFontFamily: string
	terminalLineHeight: number
}
*/

interface AsciinemaPlayerSettings {
	[key: string] : number | boolean | string,

}

const asciinemaPlayerSettingsDesc = [
	{
		key: 'cols',
		type: 'number',
		default: 80,
		name: 'Width of player\'s terminal in columns',
		desc: 'When not set it defaults to 80 (until asciicast gets loaded) and to terminal width saved in the asciicast file (after it gets loaded). -1 means not set'
	},
	{
		key: 'rows',
		type: 'number',
		default: 24,
		name: 'Height of player\'s terminal in rows (lines).',
		desc: 'When not set it defaults to 24 (until asciicast gets loaded) and to terminal width saved in the asciicast file (after it gets loaded). -1 means not set'
	},	
	{
		key: 'autoPlay',
		type: 'boolean',
		default: false,
		name: 'Auto play',
		desc: 'Set this option to true if the playback should start automatically.'
	},	
	{
		key: 'startAt',
		type: 'string',
		default: '0',
		name: 'Start the playback at a given time',
		desc: 'Supported formats: 123 (number of seconds) | "2:03" ("mm:ss") | "1:02:03" ("hh:mm:ss")'
	}		
]

const DEFAULT_SETTINGS: Partial<AsciinemaPlayerSettings> = {

}

function convertToText(obj) : string {
    //create an array that will later be joined into a string.
    const outString = [];

    //is object
    //    Both arrays and objects seem to return "object"
    //    when typeof(obj) is applied to them. So instead
    //    I am checking to see if they have the property
    //    join, which normal objects don't have but
    //    arrays do.
    if (obj == undefined) {
		return String(obj);
    } else if (typeof(obj) == "object" && (obj.join == undefined)) {
        for (let prop in obj) {
			if (obj.hasOwnProperty(prop))
				outString.push(prop + ": " + convertToText(obj[prop]));
        }
        return "{" + outString.join(",") + "}";
    //is array
    } else if (typeof(obj) == "object" && !(obj.join == undefined)) {
        for(let prop in obj) {
            outString.push(convertToText(obj[prop]));
        }
        return "[" + outString.join(",") + "]";

    //is function
    } else if (typeof(obj) == "function") {
        outString.push(obj.toString())

    //all other values can be done with JSON.stringify
    } else {
        outString.push(JSON.stringify(obj))
    }

    return outString.join(",");
}

export default class AsciinemaPlayerPlugin extends Plugin {

	settings: AsciinemaPlayerSettings;

	async onload() {
		try {
			await this.loadSettings();
			this.addSettingTab(new AsciinemaPlayerSettingTab(this.app, this));
			
			this.registerView('asciicasts', (leaf: WorkspaceLeaf) => new CastView(leaf, this))
			this.registerExtensions(['cast'], 'asciicasts')

			
			if (!this.settings.firstRun) {
				this.settings.firstRun = true
				await this.saveSettings()
			}
			//
			// get player assets (js & css)
			//					
			const playerJSContent = getAsciinemaPlayerJSContent()
			const playerCSSContent = getAsciinemaPlayerCSSContent()

			if (playerJSContent.length === 0 || playerCSSContent.length === 0) {
				new Notice('files of obsidian-asciinema-player is corrupted, please reinstall plugin to fix it')
				await this.saveSettings()
				return
			}

			const cssElement = document.createElement('style')
			cssElement.innerHTML = playerCSSContent.toString('utf-8')
			cssElement.id = 'asciinema-player-css'

			const jsElement: HTMLScriptElement = document.createElement('script')
			jsElement.innerHTML = playerJSContent.toString('utf-8')
			jsElement.id = 'asciinema-player-js'
			
			// css
			const head = document.querySelectorAll('head')
			if (head[0] && !document.getElementById('asciinema-player-css')) {
				head[0].appendChild(cssElement)
			}
			// body

			// TODO: Only add script when note cotains asciinema
			//
			const scripts = document.querySelectorAll('script')
			scripts[scripts.length-1].parentNode?.insertBefore(jsElement, scripts[scripts.length-1].nextSibling)

			//
			// registerMarkdownCodeBlockProcessor
			//
			const processor = new AsscinemaProcessor(this);

			this.registerMarkdownCodeBlockProcessor("asciinema", processor.asciinema)

		} catch(err) {
			new Notice('asciinema-player ' + t('EncounteredAnUnkownError') +  '', err)
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

import {MarkdownPostProcessorContext} from "obsidian";
import { normalizePath } from "obsidian";

interface Processor {
    asciinema: (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => Promise<void>;
}

class AsscinemaProcessor implements Processor {

	plugin: AsciinemaPlayerPlugin
	count = 0;

	constructor(plugin: AsciinemaPlayerPlugin) {

        this.plugin = plugin
    }

	asciinema = async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {

		console.log("+ AsscinemaProcessor")
		// (?<filepath>.*\.cast)
		const matched = source.match(/"(?<filepath>.*)"(\s*(?<opt>{[^}]*}))*/)
		if (matched) {

			// get file name via regexp result
			let castFile = matched.groups?.filepath as string
			let castOptions = matched.groups?.opt as string
			
 
			//const ops: Partial<AsciinemaPlayerSettings> = JSON.parse(castOptions)
			
			//ops = {...this.plugin.settings, ...ops }

			//console.log(ops)

			// if file not present return
			if (castOptions == null) {

				let str = '{\n'
				for (const [key, value] of Object.entries(this.plugin.settings)) {
					//str += key + ': ' + value + ',\n'
					//console.log(`${key}: ${value}`);
					if (typeof value === "string") {
						str += key + ': "' + value + '",\n'
					} else {
						str += key + ': ' + value + ',\n'
					}
				}
				str += '\n}'
				castOptions = str
				console.log(str)
			}


			castFile = normalizePath(castFile)
			if (this.plugin.app.vault.getFileByPath(castFile) == null) {

				const msg = document.createElement('p')
				msg.innerText = castFile + ': file not found'
				el.appendChild(msg)
				return;
			}

			const divId = 'asciinema-new-' + this.count
			
			//const optStr = convertToText(ops)

			//let jsElementPlayer: HTMLScriptElement
			const resourcePath = this.plugin.app.vault.adapter.getResourcePath(castFile)
			const scriptText = 'AsciinemaPlayer.create("' + resourcePath + '", document.getElementById("' + divId + '"), ' + castOptions + ');'

			const jsElementPlayer: HTMLScriptElement = document.createElement('script')
			jsElementPlayer.innerText = "console.log('+ ICI'); " +  scriptText

	
			const jsElementDiv: HTMLDivElement = document.createElement('div')
			jsElementDiv.id = divId

			el.appendChild(jsElementDiv)
			el.appendChild(jsElementPlayer)

			this.count += 1
		} else {
			const msg = document.createElement('p')
			msg.innerText = 'No file found, check syntax: "filename" mind the double quote'
			el.appendChild(msg)
			return;
		}
	}
}


class AsciinemaPlayerSettingTab extends PluginSettingTab {
	plugin: AsciinemaPlayerPlugin;

	constructor(app: App, plugin: AsciinemaPlayerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		const settings = this.plugin.settings
		const plugin = this.plugin

		containerEl.empty();
		containerEl.createEl('h2', {text: t('PluginSettings')});

		asciinemaPlayerSettingsDesc.forEach(function (settingDesc) {

			console.log(settingDesc)

			switch (settingDesc.type) {

				case 'number': {
					
					new Setting(containerEl)
						.setName(settingDesc.name)
						.setDesc(settingDesc.desc)
						.addText(text => text
							.setPlaceholder(settingDesc.default.toString())
							.setValue((settingDesc.key in settings) ? settings[settingDesc.key].toString() : '')
							.onChange(async (value) => {
								if (value != null && value != '')
									settings[settingDesc.key] = parseInt(value);
								else
									delete settings[settingDesc.key]
								await plugin.saveSettings();
							}));
					break
				}

				case 'string': {
					
					new Setting(containerEl)
						.setName(settingDesc.name)
						.setDesc(settingDesc.desc)
						.addText(text => text
							.setPlaceholder(settingDesc.default.toString())
							.setValue((settingDesc.key in settings) ? settings[settingDesc.key].toString() : '')
							.onChange(async (value) => {
								if (value != null && value != '')
									settings[settingDesc.key] = value;
								else
									delete settings[settingDesc.key]
								await plugin.saveSettings();
							}));
					break
				}

				case 'boolean': {
					
					new Setting(containerEl)
						.setName(settingDesc.name)
						.setDesc(settingDesc.desc)
						.addToggle(text => text
							.setValue(plugin.settings[settingDesc.key] as boolean)
							.onChange(async (value) => {
								if (value != null)
									settings[settingDesc.key] = value;
								else
									delete settings[settingDesc.key]
								await plugin.saveSettings();
							}));
					break
				}

			}

		})

		/*
		// cols
		new Setting(containerEl)
		.setName('Width of player\'s terminal in columns')
		.setDesc('When not set it defaults to 80 (until asciicast gets loaded) and to terminal width saved in the asciicast file (after it gets loaded). -1 means not set')
		.addText(text => text
			.setPlaceholder('Enter your secret')
			.setValue(this.plugin.settings.cols.toString())
			.onChange(async (value) => {
				this.plugin.settings.cols = parseInt(value);
				await this.plugin.saveSettings();
			}));
		// rows
		new Setting(containerEl)
		.setName('Height of player\'s terminal in rows (lines).')
		.setDesc('When not set it defaults to 80 (until asciicast gets loaded) and to terminal width saved in the asciicast file (after it gets loaded). -1 means not set')
		.addText(text => text
			.setPlaceholder('Enter your secret')
			.setValue(this.plugin.settings.rows.toString())
			.onChange(async (value) => {
				this.plugin.settings.rows = parseInt(value);
				await this.plugin.saveSettings();
			}));
			*/
	}
}


