'use strict';

const redis = require('redis');

const pub = redis.createClient();


const publish = (topic, value) => {
    pub.publish(topic, value);
}

module.exports = publish;