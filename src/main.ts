import { Plugin, Notice, WorkspaceLeaf } from 'obsidian'

import CastView from './castView'
import { t } from './locales/helpers';
import { AsciinemaPlayerSettings, AsciinemaPlayerSettingTab } from './settings'
import 'asciinema-player/dist/bundle/asciinema-player.css'
import './styles.css'

export default class AsciinemaPlayerPlugin extends Plugin {

  settings!: AsciinemaPlayerSettings;
  settingTab!: AsciinemaPlayerSettingTab;

  async onload() {
    try {
      this.settingTab = new AsciinemaPlayerSettingTab(this.app, this)
      this.settings = await this.settingTab.loadSettings();
      this.addSettingTab(this.settingTab);

      this.registerView('asciicasts', (leaf: WorkspaceLeaf) => new CastView(leaf, this))

      this.registerHoverLinkSource('asciicasts', {
        display: "Asciinema",
        defaultMod: false
      })

      this.registerExtensions(['cast'], 'asciicasts')
      console.log("loaded asciinema-player")

      if (!this.settings.firstRun) {
        this.settings.firstRun = true
        await this.settingTab.saveSettings()
      }

    } catch (err) {
      new Notice('asciinema-player ' + t('EncounteredAnUnkownError') + '' + err)
    }
  }

}
