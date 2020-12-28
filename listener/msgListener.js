'use strict';

const redis = require('redis');
const subscriber = redis.createClient();
const db = require('../db/dbConnector');

subscriber.on("message", (channel, message) => {
    const {time, ...data} = JSON.parse(message);
    if(channel === 'order') data.action = 'add';
    else if(channel === 'delOrder') data.action = 'remove';
    if(channel === 'login') {
        db.write('logins', time, data);
    } else if(channel === 'register') {
        db.write('register', time, data);
    } else if(channel === 'order') {
        db.write('orders', time, data);
    }
});

subscriber.subscribe('login');
subscriber.subscribe('register');
subscriber.subscribe('order');
subscriber.subscribe('delOrder');
