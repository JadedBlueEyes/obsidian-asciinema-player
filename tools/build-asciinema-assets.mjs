//
// Script to generate embeded asscinema assets in ../src/asciinema-assets.ts
//
// usage: node build-asciinema_assets.js <js script file> <css file>
//
//    e.g: node build-asciinema_assets.js asciinema-player.min.js asciinema-player.css
//
// asciinema-player.min.js asciinema-player.css files come from ascinema-player release
//   https://github.com/asciinema/asciinema-player
//   https://github.com/asciinema/asciinema-player/releases/tag/v3.7.1
//
// Files are compressed (gzip), result is base64 encoded and stored in ../src/asciinema-assets.ts
//
import { readFileSync, writeFileSync } from 'fs';
import { gzipSync } from 'zlib';
//
const debug = true // if set to true will generate intermediate gzip files

// function to encode data to base64 encoded string
function base64_encode_buffer(originalString) {

    // convert binary data to base64 encoded string
    const base64String = Buffer.from(originalString).toString('base64');

    return base64String;
}

function zip(file) {
    
    var originalString = readFileSync(file)

    const zbuf =  gzipSync(Buffer.from(originalString))
    if (debug) {
        writeFileSync(file + '.gz', zbuf)
    }
    return zbuf
}


if (!(process.argv.length === 4)) {
    console.error('Expected 2 argument!: <js script file> <css file>');
    process.exit(1);
} 

 const jsFile = process.argv[2]
 const cssFile = process.argv[3]
 


// convert js zip to base64 encoded string
//var base64strJS = base64_encode('asciinema-player.js.gz');

var base64strJS = base64_encode_buffer(zip(jsFile))

// convert base64 string back to zip 
//base64_decode(base64strJS, 'asciinema-player.js.rezip');
// Convert bas64 to buffer and unzip
//unzip(base64strJS, 'asciinema-player.js.txt')

// convert css zip to base64 encoded string
//var base64strCSS = base64_encode('asciinema-player.css.gz');

var base64strCSS = base64_encode_buffer(zip(cssFile))

var codePre = "import { gunzipSync } from 'zlib'\n\
function unzip(buf: string) {\n\
    return gunzipSync(Buffer.from(buf, 'base64'))\n\
}\n"

var codeJS = 'export const getAsciinemaPlayerJSContent = () => {\n    return unzip(`' + base64strJS + '`)\n}\n'
var codeCSS = 'export const getAsciinemaPlayerCSSContent = () => {\n    return unzip(`' + base64strCSS + '`)\n}\n'
var code = codePre + codeJS + codeCSS

writeFileSync('../src/asciinema-assets.ts', code);

console.log('+ Writing file: ../src/asciinema-assets.ts')

