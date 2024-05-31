import { 
    Plugin,
    TextFileView, 
    WorkspaceLeaf, 
    TFile,
  } from "obsidian";

  

  export const DEFAULT_DATA = ''

  export default class CastView extends TextFileView {  
    id: string = (this.leaf as any).id;


    data: string = DEFAULT_DATA

    file: TFile;
    plugin: Plugin
  
    constructor(leaf: WorkspaceLeaf, plugin: Plugin) {
      super(leaf);
      this.plugin = plugin
    }

    async save(preventReload=true) {
      await super.save();
    }
  
    // get the new file content
    // if drawing is in Text Element Edit Lock, then everything should be parsed and in sync
    // if drawing is in Text Element Edit Unlock, then everything is raw and parse and so an async function is not required here
    getViewData () {
      return this.data;
    }
  
    // clear the view content  
    clear() {
      this.containerEl.children[1].empty()
    }

    onunload(): void {
      this.clear()
    }
    
    async setViewData (data: string, clear = false) {   
      if(clear) this.clear();
    }

    async onLoadFile(file: TFile): Promise<void> {
      this.file = file

      this.render(file)
  }

  async render(file: TFile) {

    console.log(file)

    const divId = 'asciinema-div'
    const castOptions = ''

    const resourcePath = this.plugin.app.vault.adapter.getResourcePath(file.path)
    const scriptText = 'AsciinemaPlayer.create("' + resourcePath + '", document.getElementById("' + divId + '"), ' + castOptions + ');'

    const jsElementPlayer: HTMLScriptElement = document.createElement('script')

    this.clear()
    
    jsElementPlayer.innerText = "console.log('+ ICI'); " +  scriptText


    const jsElementDiv: HTMLDivElement = document.createElement('div')
    jsElementDiv.id = divId

    //el.appendChild(jsElementDiv)
    //el.appendChild(jsElementPlayer)

    this.containerEl.children[1].appendChild(jsElementDiv)
    this.containerEl.children[1].appendChild(jsElementPlayer)


  }
  
    //Compatibility mode with .excalidraw files
    canAcceptExtension(extension: string) {
      return extension == "cast";
    } 
  
    // gets the title of the document
    getDisplayText() {
      if(this.file) return this.file.basename;
      else return 'NOFILE';
    }
  
    // the view type name
    getViewType() {
      return 'asciicasts';
    }
  }
  