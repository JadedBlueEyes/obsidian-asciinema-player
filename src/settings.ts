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
		desc: 'Set this option to either 0 (no loop) or 1 (infinite loop) or a number > 1 if playback should be looped. When set to a number (e.g. 3)' +
				'then the recording will be re-played given number of times and stopped after that.'
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
		desc: 'For example, when set to 2 any inactivity (pauses) longer than 2 seconds will be "compressed" to 2 seconds' +
			'Defaults to:' +
			'<ul><li>idle_time_limit from asciicast header (saved when passing -i <sec> to asciinema rec),</li>' +
			'<li>no limit, when it was not specified at the time of recording.</li></ul>'
	},    
    {
		key: 'theme',
		type: 'string',
		default: '',
		name: 'Terminal color theme (theme)',
		desc: 'See <a href="https://docs.asciinema.org/manual/player/themes/">Terminal themes</a> for a list of available built-in themes, and how to use a custom theme<br/>' + 
                'If this options is not specified, the player uses the original (recorded) theme when available; otherwise, it uses the asciinema theme' +
				'<br/>(eg.: dracula)'
	},  
    {
		key: 'poster',
		type: 'string',
		default: '',
		name: 'Poster (a preview frame) to display until the playback is started (poster)',
		desc: 'The following poster specifications are supported:' + 
                    '<ul><li>npt:1:23 - display recording "frame" at given time using NPT ("Normal Play Time") notation</li>' +
                    '<li>data:text/plain,Poster text - print given text</li></ul>'
	},
	{
		key: 'fit',
		type: 'choice',
		choices: [['width', 'width'], ['height', 'height'], ['both', 'both'], ['none', 'none']] ,
		default: 'width',
		name: 'Selects fitting (sizing) behaviour with regards to player\'s container element (fit)',
		desc: 'Possible values:' +
					'<ul><li>"width" - scale to full width of the container</li>' +
					'<li>"height" - scale to full height of the container (requires the container element to have fixed height)</li>' +
					'<li>"both" - scale to either full width or height, maximizing usage of available space (requires the container element to have fixed height)</li>' +
					'<li>false / "none" - don\'t scale, use fixed size font (also see fontSize option below)</li></ul>' +
				'Defaults to "width".'
	},
	{
		key: 'controls',
		type: 'choice',
		choices: [['true', true], ['false', false], ['auto', 'auto']] ,
		default: 'auto',
		name: 'Hide or show user controls, i.e. bottom control bar (controls)',
		desc: 'Valid values:' +
					'<ul><li>true - always show controls</li>' +
					'<li>false - never show controls</li>' +
					'<li>"auto" - show controls on mouse movement, hide on lack of mouse movement' +
					'</ul>' +
				'Defaults to "auto".'
	},
	{
		key: 'pauseOnMarkers',
		type: 'boolean',
		default: false,
		name: 'Pause on markers (pauseOnMarkers)',
		desc: 'If pauseOnMarkers is set to true, the playback automatically pauses on every marker encountered and it can be resumed by either pressing the space bar key or ' + 
				'clicking on the play button. The resumed playback continues until the next marker is encountered.' +
				'<br/>This option can be useful in e.g. live demos: you can add markers to a recording, then play it back during presentation, and have the player stop wherever' +
				'you want to explain terminal contents in more detail.' +
				'<br/>Defaults to false.'
	},	
	{
		key: 'terminalFontSize',
		type: 'string',
		default: 'small',
		name: 'Size of the terminal font (terminalFontSize)',
		desc: 'Possible values:' + 
			'<ul><li>any valid CSS font-size value, e.g. "15px"</li>' +
			'<li>"small"</li>' +
			'<li>"medium"</li>' +
			'<li>"big"</li></ul>' +
			'<br/>Defaults to "small".' +
			'<br/>WARNING: This option is effective only when fit: false option is specified as well (see above).'
	},			
	{
		key: 'terminalLineHeight',
		type: 'number',
		default: 1.33333333,
		name: 'Terminal line height override (terminalLineHeight).',
		desc: 'The value is relative to the font size (like em unit in CSS). For example a value of 1' + 
				'makes the line height equal to the font size, leaving no space between lines. A value of 2 makes it double the font size, etc.' +
				'<br/>Defaults to 1.33333333'
	},			        
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


	display(): void {

		const {containerEl} = this;
		const settings = this.settings
        
		containerEl.empty();
		containerEl.createEl('h2', {text: t('PluginSettings')});

		asciinemaPlayerSettingsDesc.forEach(settingDesc => {

			let setting : number | boolean | string

			if (settings[settingDesc.key] !== undefined)
				setting = settings[settingDesc.key] as number | boolean | string
			else
				setting	= settingDesc.default

			//console.log(settingDesc)
			const settingString : string = setting.toString()


			switch (settingDesc.type) {

				case 'number': {
					
					new Setting(containerEl)
						.setName(settingDesc.name)
						.setDesc(fragWithHTML(settingDesc.desc))
						.addText(text => text
							.setPlaceholder(settingDesc.default.toString())
							.setValue(settingString)
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
							.setValue(settingString)
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
							.setValue(setting as boolean)
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
					
					let v = settingString
					
					if (v === "true")
						v = "1"
					if (v === "false")
						v = "0"

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

				case 'choice': {

					const choices : Record<string, string> = { };
					const choicesMap : Map<string, string | number | boolean> = new Map()

					if (settingDesc.choices !== undefined)
						settingDesc.choices.forEach(choice => { choicesMap.set(choice[0] as string, choice[1])})

					choicesMap.forEach((value, key) => choices[value.toString()] = key)

					new Setting(containerEl)
						.setName(settingDesc.name)
						.setDesc(fragWithHTML(settingDesc.desc))
						.addDropdown(text => text
							.addOptions(choices)
							.setValue(settingString)
							.onChange(async (value) => {
								if (value != null)
									settings[settingDesc.key] = choicesMap.get(value);
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
 

