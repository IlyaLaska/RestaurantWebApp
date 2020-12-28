'use strict';

const admin = require('firebase-admin');
const serviceAccount = require('./key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const write = async (document, key, value) => {
    try {
        await db.collection('data').doc(document).set({[key]: JSON.stringify(value)}, { merge: true });
    } catch (e) {
        console.log('ERROR: ', e);
    }
};

const addUser = async (data) => {
    try {
        await db.collection('users').add(data);
    } catch (e) {
        console.log('ERROR: ', e);
    }
};

const validateUser = async (username, occupation) => {
    try {
        const doc = await db.collection('users')
            .where('username', '==', username)
            // .where('password', '==', password)
            .where('occupation', '==', occupation).get();
        if(doc.empty) return null;
        else {
            let ret = [];
            doc.forEach(el => {
                // console.log(el.id, '=>', el.data());
                ret.push(el.data());
            });
            return ret;
        }
    } catch (e) {
        console.log('ERROR: ', e);
        return null;
    }
}

module.exports = {write, addUser, validateUser};