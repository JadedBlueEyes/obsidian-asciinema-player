# Obsidian Asciinema cast file viewer plugin

This is a [Obsidian](https://obsidian.md) plugin which supports embedding [asciicast](https://github.com/asciinema/asciinema/blob/develop/doc/asciicast-v2.md) files into your Markdown files.

This has been largly inspired by this [plugin](https://github.com/nekomeowww/obsidian-asciinema-player).

This project uses Typescript to provide type checking and documentation.
The repo depends on the latest plugin API (obsidian.d.ts) in Typescript Definition format, which contains TSDoc comments describing what it does.

## How to use

- Clone this repo.
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- goto tools directory
- ....
- `npm run dev` to start compilation in watch mode.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

## Embedding asciicast files

- File name needs to have the `.cast`extension to be visible in the tree view
- Path is relative to the vault root

````markdown
```asciinema
"FOLDER/2024-06-05-rec_short.cast"
```
````

### with options

See asciiplayer options for a full desction of the options (https://docs.asciinema.org/manual/player/options/)

````markdown
```asciinema
"test 2.cast"
{ 
	poster: 'npt:0:0:14', 
	speed: 2, 
	logger: console, 
	theme: 'dracula', 
	pauseOnMarkers: true, 
	markers: [ [13.5, 'top'] ]

}
```
````
