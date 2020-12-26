'use strict';

const port  = 80;
const ip = '127.0.0.1';

const path = require('path');
const fastify = require('fastify')({logger: false});

fastify.register(require('./router'));

fastify.register(require('fastify-static'), {
    root: path.join(__dirname, 'resources'),
});

fastify.listen(port, ip, (err, address) => {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    // fastify.log.info(`server listening on ${address}`);
});