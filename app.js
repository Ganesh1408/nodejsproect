import http, { createServer } from 'http'

const hostname ='localhost';
const port =3000;

const server = http.createServer((req,res)=>{
    res.satus=200;
    res.setHeader('content-type','text/html')

    if (req.url ="/"){
        res.end('<h1>welcome to ganesh node.js server</h1>')
    }else{
        req.statuscode=404;
        res.end('<h1>404- not found</h1>')
    }
})

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

