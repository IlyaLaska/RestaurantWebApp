'use strict';

const redis = require('redis');
const admin = require('firebase-admin');
const serviceAccount = require('./key.json');
const subscriber = redis.createClient();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
// let lastLoginID = db.collection('data').doc('logins').

subscriber.on("message", (channel, message) => {
    const {time, ...data} = JSON.parse(message);
    if(channel === 'order') data.action = 'add';
    else if(channel === 'delOrder') data.action = 'remove';
    if(channel === 'login') {
        db.collection('data').doc('logins').set({[time]: JSON.stringify(data)}, { merge: true });
    } else {
        db.collection('data').doc('orders').set({[time]: JSON.stringify(data)}, { merge: true });
    }
});

subscriber.subscribe('login');
subscriber.subscribe('order');
subscriber.subscribe('delOrder');


// db.collection('data').doc('logins').set({k: 'ek'});