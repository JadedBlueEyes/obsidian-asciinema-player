import { App, Plugin, Setting, PluginSettingTab } from 'obsidian'
import { t } from './locales/helpers';


const asciinemaPlayerSettingsDesc = [
	{
		key: 'cols',
		type: 'number',
		default: 80,
		name: 'Width of player\'s terminal in columns (cols)',
		desc: 'When not set it defaults to 80 (until asciicast gets loaded) and to terminal width saved in the asciicast file (after it gets loaded). empty means not set'
	},
	{
		key: 'rows',
		type: 'number',
		default: 24,
		name: 'Height of player\'s terminal in lines (rows).',
		desc: 'When not set it defaults to 24 (until asciicast gets loaded) and to terminal width saved in the asciicast file (after it gets loaded). empty means not set'
	},	
	{
		key: 'autoPlay',
		type: 'boolean',
		default: false,
		name: 'Auto play (autoPlay)',
		desc: 'Set this option to true if the playback should start automatically.'
	},	
	{
		key: 'preload',
		type: 'boolean',
		default: false,
		name: 'Preload (preload)',
		desc: 'Set this option to true if the recording should be preloaded on player\'s initialization.'
	},
	{
		key: 'loop',
		type: 'boolean_number',
		default: false,
		name: 'Loop (loop)',
		desc: 'Set this option to either 0 (no loop) or 1 (infinite loop) or a number > 1 if playback should be looped. When set to a number (e.g. 3) then the recording will be re-played given number of times and stopped after that.'
	},			
	{
		key: 'startAt',
		type: 'string',
		default: '0',
		name: 'Start the playback at a given time (startAt)',
		desc: 'Supported formats: 123 (number of seconds) | "2:03" ("mm:ss") | "1:02:03" ("hh:mm:ss")'
	},
	{
		key: 'speed',
		type: 'number',
		default: '1',
		name: 'Playback speed (speed)',
		desc: 'The value of 2 means 2x faster'
	},
	{
		key: 'idleTimeLimit',
		type: 'number',
		default: '',
		name: 'Limit terminal inactivity to a given number of seconds (idleTimeLimit)',
		desc: 'For example, when set to 2 any inactivity (pauses) longer than 2 seconds will be "compressed" to 2 seconds'
	},    
    {
		key: 'theme',
		type: 'string',
		default: '',
		name: 'Terminal color theme (theme)',
		desc: 'See <a href="https://docs.asciinema.org/manual/player/themes/">Terminal themes</a> for a list of available built-in themes, and how to use a custom theme<br/>' + 
                'If this options is not specified, the player uses the original (recorded) theme when available; otherwise, it uses the asciinema theme'
	},  
    {
		key: 'poster',
		type: 'string',
		default: '',
		name: 'Poster (a preview frame) to display until the playback is started (poster)',
		desc: 'The following poster specifications are supported:' + 
                    '<ul><li>npt:1:23 - display recording "frame" at given time using NPT ("Normal Play Time") notation</li>' +
                    '<li>data:text/plain,Poster text - print given text</li></ul>'
	}		        
]

export interface AsciinemaPlayerSettings {
	[key: string] : number | boolean | string,

}


const DEFAULT_SETTINGS: Partial<AsciinemaPlayerSettings> = {

}

const fragWithHTML = (html: string) =>
    createFragment((frag) => (frag.createDiv().innerHTML = html));
  

export class AsciinemaPlayerSettingTab extends PluginSettingTab {
	plugin: Plugin;
    settings: Partial<AsciinemaPlayerSettings> = {}

	constructor(app: App, plugin: Plugin) {
		super(app, plugin);
		this.plugin = plugin;
        this.settings = DEFAULT_SETTINGS
	}

	async loadSettings() :  Promise<AsciinemaPlayerSettings> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.plugin.loadData());
        return this.settings as AsciinemaPlayerSettings
	}

	async saveSettings() {
		await this.plugin.saveData(this.settings);
	}    

    getOptionsString(): string {

        let str = '{\n'
        for (const [key, value] of Object.entries(this.settings)) {
            //str += key + ': ' + value + ',\n'
            //console.log(`${key}: ${value}`);
            if (typeof value === "string") {
                str += key + ': "' + value + '",\n'
            } else {
                str += key + ': ' + value + ',\n'
            }
        }
        str += '\n}'

        console.log(str)

        return str
    }    

	display(): void {
		const {containerEl} = this;

		const settings = this.settings
        

		containerEl.empty();
		containerEl.createEl('h2', {text: t('PluginSettings')});

		asciinemaPlayerSettingsDesc.forEach(settingDesc => {

			//console.log(settingDesc)

			switch (settingDesc.type) {

				case 'number': {
					
					new Setting(containerEl)
						.setName(settingDesc.name)
						.setDesc(fragWithHTML(settingDesc.desc))
						.addText(text => text
							.setPlaceholder(settingDesc.default.toString())
							.setValue((settingDesc.key in settings) ? settings[settingDesc.key].toString() : '')
							.onChange(async (value) => {
								if (! isNaN(parseInt(value)))
									settings[settingDesc.key] = parseInt(value);
								else
									delete settings[settingDesc.key]
								await this.saveSettings();
							}));
					break
				}

				case 'string': {
					
					new Setting(containerEl)
						.setName(settingDesc.name)
						.setDesc(fragWithHTML(settingDesc.desc))
						.addText(text => text
							.setPlaceholder(settingDesc.default.toString())
							.setValue((settingDesc.key in settings) ? settings[settingDesc.key].toString() : '')
							.onChange(async (value) => {
								if (value != null && value != '')
									settings[settingDesc.key] = value;
								else
									delete settings[settingDesc.key]
								await this.saveSettings();
							}));
					break
				}

				case 'boolean': {
					
					new Setting(containerEl)
						.setName(settingDesc.name)
						.setDesc(fragWithHTML(settingDesc.desc))
						.addToggle(text => text
							.setValue(settings[settingDesc.key] as boolean)
							.onChange(async (value) => {
								if (value != null)
									settings[settingDesc.key] = value;
								else
									delete settings[settingDesc.key]
								await this.saveSettings();
							}));
					break
				}

				case 'boolean_number': {

					
					let v = ''

					if (settingDesc.key in settings) {
						v = settings[settingDesc.key].toString()

						if (v === "true")
							v = "1"
						if (v === "false")
							v = "0"

					}

					new Setting(containerEl)
						.setName(settingDesc.name)
						.setDesc(fragWithHTML(settingDesc.desc))
						.addText(text => text
							.setValue(v)
							.onChange(async (value) => {
								if (! isNaN(parseInt(value)))
									if (value === "0")
										settings[settingDesc.key] = false;
									else if (value === "1")
										settings[settingDesc.key] = true;
									else
										settings[settingDesc.key] = parseInt(value);
								else
									delete settings[settingDesc.key]
								await this.saveSettings();
							}));
					break
				}
			}

		})

	}
}
 

