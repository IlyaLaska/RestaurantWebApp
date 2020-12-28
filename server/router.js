'use strict';

const fs = require('fs');
const publish = require('./publisher.js');
const orderHandler = require('./orderToHTML');
const argon2 = require('argon2');
const db = require('../db/dbConnector');

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
    fastify.get('/newUser', (request, reply) => {
        fs.readFile('./resources/register.html', 'binary', (err, file) => {
            reply
                .code(200)
                .type('text/html')
                .send(file);
        });
    });//register page
    fastify.post('/register', async (request, reply) => {
        const data = parseData(request.body);
        publish('register', JSON.stringify({username: data.username, occupation: data.occupation, time: Date.now()}));
        await addUser(data);
        reply
            .code(302)
            .header('Location', `http://${ip}:${port}/`)
            .send('You are being redirected...');
    });//register form handler
    fastify.post('/login', async (request, reply) => {
        const data = parseData(request.body);
        publish('login', JSON.stringify({username: data.username, occupation: data.occupation, time: Date.now()}));
        const validUser = await validateLogin(data);
        if (validUser) {
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
        } else {
            reply
                .code(302)
                .header('Location', `http://${ip}:${port}/`)
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

const addUser = async (data) => {
    data.password = await hashPassword(data.password);
    await db.addUser(data);
};

const hashPassword = async (pass) => {
    // let hash = null;
    try {
        return await argon2.hash(pass);
    } catch (err) {
        console.log('Failed to hash: ', err);
    }
    return null;
};

const validateLogin = async (data) => {
    const foundUsers = await db.validateUser(data.username, data.occupation);
    let foundWithCorrectPass = false;
    // console.log('MATCH: ', foundUsers);
    if (foundUsers)
        foundWithCorrectPass = foundUsers.some(async (user) => {
            return await argon2.verify(user.password, data.password);
        });
    return foundWithCorrectPass;
};

module.exports = routes;