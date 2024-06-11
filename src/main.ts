import { Plugin, Notice, WorkspaceLeaf } from 'obsidian'

import CastView from  './castView'
import { t } from './locales/helpers';
import { AsciinemaPlayerSettings, AsciinemaPlayerSettingTab } from './settings'

import { getAsciinemaPlayerJSContent, getAsciinemaPlayerCSSContent } from './asciinema-assets'



export default class AsciinemaPlayerPlugin extends Plugin {

	settings: AsciinemaPlayerSettings;
	settingTab: AsciinemaPlayerSettingTab;

	async onload() {
		try {
			
			this.settingTab = new AsciinemaPlayerSettingTab(this.app, this)
			this.settings = await this.settingTab.loadSettings();
			this.addSettingTab(this.settingTab);
			
			this.registerView('asciicasts', (leaf: WorkspaceLeaf) => new CastView(leaf, this))
			this.registerExtensions(['cast'], 'asciicasts')

			
			if (!this.settings.firstRun) {
				this.settings.firstRun = true
				await this.settingTab.saveSettings()
			}
			//
			// get player assets (js & css)
			//					
			const playerJSContent = getAsciinemaPlayerJSContent()
			const playerCSSContent = getAsciinemaPlayerCSSContent()

			if (playerJSContent.length === 0 || playerCSSContent.length === 0) {
				new Notice('files of obsidian-asciinema-player is corrupted, please reinstall plugin to fix it')
				await this.settingTab.saveSettings()
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
			

			// if no option, get settings options
			// TODO: move this to settings.ts
			if (castOptions == null) {
				
				castOptions = this.plugin.settingTab.getOptionsString()
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


