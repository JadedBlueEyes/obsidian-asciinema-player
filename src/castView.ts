import {
  FileView,
  WorkspaceLeaf,
  TFile,
  HoverParent,
  HoverPopover,
} from "obsidian";

import AsciinemaPlayerPlugin from "main";
import * as AsciinemaPlayer from 'asciinema-player';
export const DEFAULT_DATA = ''

export default class CastView extends FileView implements HoverParent {
  id: string = (this.leaf as any).id;
  allowNoFile = false;

  data: string = DEFAULT_DATA

  file: TFile;
  plugin: AsciinemaPlayerPlugin

  hoverPopover: HoverPopover | null;

  playerInstance: any;
  constructor(leaf: WorkspaceLeaf, plugin: AsciinemaPlayerPlugin) {
    super(leaf);
    this.plugin = plugin
  }

  // get the new file content
  // if drawing is in Text Element Edit Lock, then everything should be parsed and in sync
  // if drawing is in Text Element Edit Unlock, then everything is raw and parse and so an async function is not required here
  getViewData() {
    return this.data;
  }

  // clear the view content  
  clear() {
    this?.playerInstance?.dispose()
    this.containerEl.children[1].empty()
  }

  onunload(): void {
    this.clear()
  }

  async setViewData(data: string, clear = false) {
    if (clear) this.clear();
  }

  async onLoadFile(file: TFile): Promise<void> {
    this.file = file

    this.render(file)
  }

  async onUnloadFile(file: TFile): Promise<void> {
    this.clear()
  }

  async render(file: TFile) {
    const castOptions = this.plugin.settingTab.settings

    const resourcePath = this.plugin.app.vault.adapter.getResourcePath(file.path)

    const playerDiv: HTMLDivElement = document.createElement('div')

    this.containerEl.children[1].appendChild(playerDiv)
    this.playerInstance = AsciinemaPlayer.create(resourcePath, playerDiv, castOptions);

  }

  canAcceptExtension(extension: string) {
    return extension == "cast";
  }

  // gets the title of the document
  getDisplayText() {
    if (this.file) return this.file.basename;
    else return 'NOFILE';
  }

  // the view type name
  getViewType() {
    return 'asciicasts';
  }
}
