import { App, Plugin, Notice, TFolder, WorkspaceLeaf, Setting, PluginSettingTab, Vault, TFile } from 'obsidian'

import CastView from  './castView'
import { t } from './locales/helpers';
import { getAsciinemaPlayerJSContent, getAsciinemaPlayerCSSContent } from './asciinema-assets'
const zlib = require('zlib'); 


const pluginName = 'my-asciinema-plugin'

const onlineAsciinemaPlayerScriptURL = 'https://cdnjs.cloudflare.com/ajax/libs/asciinema-player/2.6.1/asciinema-player.min.js'
const onlineAsciinemaPlayerStyleURL = 'https://cdnjs.cloudflare.com/ajax/libs/asciinema-player/2.6.1/asciinema-player.min.css'

const offlineAsciinemaPlayerScriptName = 'asciinema-player.js'
const offlineAsciinemaPlayerStyleName = 'asciinema-player.css'

const write = async (content: string, filepath: string, vault: Vault): Promise<void> => {
	try {
		const file = await vault.getAbstractFileByPath(filepath)
		if (file instanceof TFile) {
			await vault.modify(file as TFile, content)
		}
		else await vault.create(filepath, content)
	} catch (err) {
		throw err
	}
}

const createJSAndCSSFiles = async (pluginPath: string, playerJSPath: string, playerCSSPath: string, vault: Vault) => {

	return

}

const removeJSAndCSSFiles = async (pluginPath: string, playerJSPath: string, playerCSSPath: string, vault: Vault) => {
	const dirExist = await vault.adapter.exists(pluginPath + '/lib')
	if (!dirExist) await vault.adapter.mkdir(pluginPath + '/lib')

	try {
		await vault.adapter.remove(playerCSSPath)
		await vault.adapter.remove(playerJSPath)
	} catch(err) {
		new Notice(t('DeletionFailedNotice').replace('%s', t('EnableOfflineSupport')))
		throw err
	} 
}

interface AsciinemaPlayerSettings {
	enableOfflineSupport: boolean;
	firstRun: boolean;
}

const DEFAULT_SETTINGS: AsciinemaPlayerSettings = {
	enableOfflineSupport: false,
	firstRun: false
}

export default class AsciinemaPlayerPlugin extends Plugin {
	settings: AsciinemaPlayerSettings;

	async onload() {
		try {
			await this.loadSettings();
			this.addSettingTab(new AsciinemaPlayerSettingTab(this.app, this));
			this.registerView('asciicasts', (leaf: WorkspaceLeaf) => new CastView(leaf))
			this.registerExtensions(['cast'], 'asciicasts')

			const pluginPath = this.app.vault.configDir + '/plugins/' + pluginName
			const playerJSPath = pluginPath + '/lib/' + offlineAsciinemaPlayerScriptName
			const playerCSSPath = pluginPath  + '/lib/'+ offlineAsciinemaPlayerStyleName

			if (!this.settings.firstRun) {
				await createJSAndCSSFiles(pluginPath, playerJSPath, playerCSSPath, this.app.vault)
				this.settings.firstRun = true
				await this.saveSettings()
			}

			let cssElement: any
			let jsElement: HTMLScriptElement
			if (this.settings.enableOfflineSupport) {				
				// check
				let playerJSContent = ''
				let playerCSSContent = ''

				try {					
					playerJSContent = getAsciinemaPlayerJSContent()
					playerCSSContent = getAsciinemaPlayerCSSContent()

				} catch(err) {
					new Notice('files of obsidian-asciinema-player is corrupted, please reinstall plugin to fix it', err)
					this.settings.enableOfflineSupport = false
					console.error(err)
				}

				if (playerJSContent === '' || playerCSSContent === '') {
					new Notice('files of obsidian-asciinema-player is corrupted, please reinstall plugin to fix it')
					this.settings.enableOfflineSupport = false
					await this.saveSettings()
					return
				}

				cssElement = document.createElement('style')
				cssElement.innerHTML = playerCSSContent
				cssElement.id = 'asciinema-player-css'

				jsElement = document.createElement('script')
				jsElement.innerHTML = playerJSContent
				jsElement.id = 'asciinema-player-js'
			} else {
				cssElement = document.createElement('link')
				cssElement = (cssElement as HTMLLinkElement)
				cssElement.href = onlineAsciinemaPlayerStyleURL
				cssElement.rel = 'stylesheet'
				cssElement.id = 'asciinema-player-css'

				jsElement = document.createElement('script')
				jsElement.src = onlineAsciinemaPlayerScriptURL
				jsElement.id = 'asciinema-player-js'
			}

			// css
			const head = document.querySelectorAll('head')
			if (head[0] && !document.getElementById('asciinema-player-css')) {
				head[0].appendChild(cssElement)
			}
			// body
			//const body = document.querySelectorAll('body')
			//if (body[0] && !document.getElementById('asciinema-player-js') && (document.createElement('asciinema-player').constructor === HTMLUnknownElement || document.createElement('asciinema-player').constructor === HTMLElement)) {
			//	body[0].appendChild(jsElement)
			//}

			// TODO: Only add script when note cotains asciinema
			//
			const scripts = document.querySelectorAll('script')
			scripts[scripts.length-1].parentNode!.insertBefore(jsElement, scripts[scripts.length-1].nextSibling)

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
	count: number = 0;

	constructor(plugin: AsciinemaPlayerPlugin) {

        this.plugin = plugin
    }

	asciinema = async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {

		console.log("+ AsscinemaProcessor")
		// (?<filepath>.*\.cast)
		const matched = source.match(/(?<filepath>.*\.cast)(\s*(?<opt>{[^}]*}))*/)
		if (matched) {

			// get file name via regexp result
			let castFile = matched.groups?.filepath as string
			let castOptions = matched.groups?.opt as string

			//const opt = JSON.parse(castOptions)
			
			// if file not present return
			castFile = normalizePath(castFile)
			if (this.plugin.app.vault.getFileByPath(castFile) == null) {

				let msg = document.createElement('p')
				msg.innerText = castFile + ': file not found'
				el.appendChild(msg)
				return;
			}

			const divId = 'asciinema-new-' + this.count
			

			let jsElementPlayer: HTMLScriptElement
			const resourcePath = this.plugin.app.vault.adapter.getResourcePath(castFile)
			const scriptText = 'AsciinemaPlayer.create("' + resourcePath + '", document.getElementById("' + divId + '"), ' + castOptions + ');'
			jsElementPlayer = document.createElement('script')
			jsElementPlayer.innerText = "console.log('+ ICI'); " +  scriptText

			let jsElementDiv: HTMLDivElement
			jsElementDiv = document.createElement('div')
			jsElementDiv.id = divId

			el.appendChild(jsElementDiv)
			el.appendChild(jsElementPlayer)

			this.count += 1
		}
	}
}

const getParent = (parent: TFolder) : Array<string> => {
	if ((parent.path === '/' || parent.path === '\\') || !parent.parent) {
		return []
	} else {
		var parents = getParent(parent.parent)
		parents.push(parent.path)
		return parents
	}
}

class AsciinemaPlayerSettingTab extends PluginSettingTab {
	plugin: AsciinemaPlayerPlugin;

	constructor(app: App, plugin: AsciinemaPlayerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', {text: t('PluginSettings')});

		new Setting(containerEl)
			.setName(t('EnableOfflineSupport'))
			.setDesc(t('OfflineSupportOptionDesp'))
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.enableOfflineSupport)
				toggle.onChange(async value => {
					this.plugin.settings.enableOfflineSupport = value;
					const pluginPath = this.app.vault.configDir + '/plugins/' + pluginName
					const playerJSPath = pluginPath + '/lib/' + offlineAsciinemaPlayerScriptName
					const playerCSSPath = pluginPath  + '/lib/'+ offlineAsciinemaPlayerStyleName

					if (value) {	
						try {
							await createJSAndCSSFiles(pluginPath, playerJSPath, playerCSSPath, this.app.vault)
						} catch(err) {
							console.error(err)
							return
						}
					} else {
						try {
							await removeJSAndCSSFiles(pluginPath, playerJSPath, playerCSSPath, this.app.vault)
						} catch(err) {
							console.error(err)
							return
						}
					}
					
					await this.plugin.saveSettings();
				})
			})
	}
}


