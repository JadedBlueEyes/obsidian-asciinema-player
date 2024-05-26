import { fileURLToPath } from 'url'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname, basename } from 'path'

const modulePath = dirname(fileURLToPath(import.meta.url))
const distDir = '../dist/my-asciinema-plugin/'

if (! existsSync(resolve(modulePath, distDir))) {

    mkdirSync((resolve(modulePath, distDir)), {recursive: true})

}

const files = [ '../main.js', '../styles.css', '../manifest.json' ]



files.forEach(file => {
    copyFileSync(resolve(modulePath, file), resolve(modulePath, distDir + basename(file)))
});





