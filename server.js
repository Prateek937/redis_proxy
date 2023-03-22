const express = require('express');
const redis = require('redis');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');

const app = express();
const port = 4500;

const clients = {};
const reconnectStrategy = false;

app.use(bodyParser.json({
    strict: false // allow more than just arrays and options, but also scalar
}));
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(port, () => {
    console.log(new Date(), `running on  ${port}`);
});

const applyCommand = (command, args, next) => {
    const out = spawn(command, args);
    out.stdout.on('data', data => console.log(`${data}`));
    out.stderr.on('data', data => console.log(`${data}`));
    out.on('close', code => (code == 0) ? next() : next(new Error(`child process exited with code ${code}`)));
};

const createConnection = (host, next) => {
    console.log(1);
    const client = redis.createClient({
        socket: {
            host,
            port: '6379',
            reconnectStrategy
        }
    });
    process.on('exit', () => {
        console.log(new Date(), `Disconnecting from Redis ${host}`);
        client.quit();
    });
    client.once('connect', () => {
        console.log(new Date(), `Connected to Redis ${host}`);
        next(client);
    });
    client.on('error', (err) => {
        console.log(3);
        if (reconnectStrategy !== true) delete clients[host];
        console.log(new Date(), `Error using Redis ${host}: ${err.message}`);
    });
    console.log(2);
    client.connect();
};

const getClient = (host, next) => {
    ((next) => {
        if (host in clients) return next(clients[host]);
        createConnection(host, next);
    })(client => {
        next(clients[host] = client)
    });
};

//app.get('/:host/:key', (req, res) => getClient(req.params.host).get(req.params.key).then(reply => res.send(reply)).catch(err => res.status(400).send(err.message)));
app.post('/:host/get', (req, res) => {
    //validate host return error if not valid
    console.log(new Date(), `Requesting GET ${req.url}`);
    getClient(req.params.host, client => client.mGet(req.body).then(reply => res.send(reply)).catch(err => res.status(400).send(err.message)))
});

app.post('/:host/set', (req, res) => {
    //validate host return error if not valid
    console.log(new Date(), `Requesting SET ${req.url}`);
    getClient(req.params.host, client => client.mSet(req.body).then(reply => res.send(reply)).catch(err => res.status(400).send(err.message)))
});

app.post('/:host/stop', (req, res) => {
    //validate host return error if not valid
    console.log(new Date(), `Requesting STOP ${req.url}`)
    applyCommand('/bin/sh', ['-c', `ssh -i /home/ec2-user/redis ec2-user@${req.params.host} sudo systemctl stop redis`], (...a) => {
        console.log(new Date(), 'Service Redis Stopped', ...a)
        res.send('Service Redis Stopped')
    });
});

app.post('/:host/start', (req, res) => {
    //validate host return error if not valid
    console.log(`Requesting START ${req.url}`)
    applyCommand('/bin/sh', ['-c', `ssh -i /home/ec2-user/redis ec2-user@${req.params.host} sudo systemctl start redis`], (...a) => {
        console.log(new Date(), 'Service Redis Started', ...a)
        res.send('Service Redis Started')
    });
});