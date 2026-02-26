const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((request, response) => {
    console.log('Request...', request.url);

    let filePath = '.' + request.url;
    if (filePath == './') {
        filePath = './index.html';
    }

    // if path ends with / append index.html
    if (filePath.endsWith('/')) {
        filePath += 'index.html';
    }

    serveFile(filePath, response);
});

function serveFile(filePath, response) {
    let extname = String(path.extname(filePath)).toLowerCase();

    // Default to application/octet-stream if unknown
    let contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                fs.readFile('./404.html', (err, cont) => {
                    if (err) {
                        response.writeHead(404, { 'Content-Type': 'text/html' });
                        response.end("404 Not Found", 'utf-8');
                    } else {
                        response.writeHead(404, { 'Content-Type': 'text/html' });
                        response.end(cont, 'utf-8');
                    }
                });
            } else if (error.code === 'EISDIR') {
                // It's a directory, try to read index.html inside it
                serveFile(filePath + '/index.html', response);
            } else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        } else {
            // Re-check extname just in case it was modified by EISDIR retry
            extname = String(path.extname(filePath)).toLowerCase();
            contentType = mimeTypes[extname] || contentType;

            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });
}

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
