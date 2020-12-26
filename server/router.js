'use strict';

const fs = require('fs');
const publish = require('./publisher.js');
const orderHandler = require('./orderToHTML');

const port = 80;
const ip = '127.0.0.1';

async function routes(fastify, options) {
    fastify.get('/', (request, reply) => {
        fs.readFile('./resources/login.html', 'binary', (err, file) => {
            reply
                .code(200)
                .type('text/html')
                .send(file);
        });
    });//login page
    fastify.post('/login', (request, reply) => {
        const data = parseData(request.body);
        data.time = Date.now();
        publish('login', JSON.stringify(data));
        if (data.occupation === 'client') {
            reply
                .code(302)
                .header('Location', `http://${ip}:${port}/home`)
                .send('You are being redirected...');
        } else if (data.occupation === 'server') {
            reply
                .code(302)
                .header('Location', `http://${ip}:${port}/orders`)
                .send('You are being redirected...');
        }
    });//login form handler
    fastify.get('/home', (request, reply) => {
        fs.readFile('./resources/makeOrder.html', 'binary', (err, file) => {
            reply
                .code(200)
                .type('text/html')
                .send(file);
        });
    });//make order here
    fastify.get('/orders', (request, reply) => {
        const html = orderHandler.getHTML();
        reply
            .code(200)
            .type('text/html')
            .send(html);
    });//list of all orders
    fastify.post('/order', (request, reply) => {
        const data = parseData(request.body);
        const {tableNum, ...badOrder} = data;
        const order = Object.keys(badOrder);
        const toPub = {
            tableNum: tableNum,
            order: order,
            time: Date.now()
        }
        publish('order', JSON.stringify(toPub));
        // publish('order', `${tableNum} -> ${toPub}`);
        orderHandler.addOrder(tableNum, order);
        reply
            .code(302)
            .header('Location', `http://${ip}:${port}/orderMade`)
            .send('You are being redirected...');
    });//order form handler
    fastify.post('/deleteOrders', (request, reply) => {
        const idsToDel = Object.keys(parseData(request.body));
        idsToDel.forEach(id => {
            const toPub = {
                tableNum: id,
                time: Date.now()
            }
            publish('delOrder', JSON.stringify(toPub));
        });
        // publish('delOrder', idsToDel.toString());
        orderHandler.removeOrders(idsToDel);
        reply
            .code(302)
            .header('Location', `http://${ip}:${port}/orders`)
            .send('You are being redirected...');
    });//delete orders form handler
    fastify.get('/orderMade', (request, reply) => {
        fs.readFile('./resources/orderMade.html', 'binary', (err, file) => {
            reply
                .code(200)
                .type('text/html')
                .send(file);
        });
    });//your orders is being prepared - go back button
}

const parseData = (data) => {
    const values = {};
    data.split('\r\n').forEach(part => {
        const kv = part.split('=');
        if (kv[0]) return values[kv[0]] = kv[1];
    });
    return values;
};

module.exports = routes;