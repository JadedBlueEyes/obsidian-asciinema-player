import { Plugin, Notice, WorkspaceLeaf } from 'obsidian'

import CastView from './castView'
import { t } from './locales/helpers';
import { AsciinemaPlayerSettings, AsciinemaPlayerSettingTab } from './settings'
import playerStyles from 'asciinema-player/dist/bundle/asciinema-player.css'

export default class AsciinemaPlayerPlugin extends Plugin {

  settings: AsciinemaPlayerSettings;
  settingTab: AsciinemaPlayerSettingTab;

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

      // CSS

      const cssElement = document.createElement('style')
      cssElement.id = 'asciinema-player-css'
      cssElement.textContent = playerStyles
      const head = document.querySelectorAll('head')
      if (head[0] && !document.getElementById('asciinema-player-css')) {
        head[0].appendChild(cssElement)
      }

      this.registerExtensions(['cast'], 'asciicasts')
      console.log("loaded asciinema-player")

      if (!this.settings.firstRun) {
        this.settings.firstRun = true
        await this.settingTab.saveSettings()
      }

    } catch (err) {
      new Notice('asciinema-player ' + t('EncounteredAnUnkownError') + '', err)
    }
  }

}
