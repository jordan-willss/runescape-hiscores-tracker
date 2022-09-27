import http from 'http';

const address = '127.0.0.1';
const port = 3000;

let app = http.createServer((req, res) => {
    // Set a response type of plain text for the response
    res.writeHead(200, { 'Content-Type': 'text/plain' });

    // Send back a response and end the connection
    res.end('Hello World!\n');
});

app.listen(port, address);
console.log(`Node server running on port ${port}`);