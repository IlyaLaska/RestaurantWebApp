'use strict';

let orders = new Map();
const fs = require('fs');

const addOrder = (tableNum, order) => {
    orders.set(tableNum, order);
}

const removeOrders = (tableNum) => {
    if(Array.isArray(tableNum)) tableNum.forEach(num => orders.delete(num));
    else orders.delete(tableNum);
}

const getHTML = () => {
    let i = 0;
    const htmlHalves = fs.readFileSync('./resources/allOrders.html', 'binary').split('SPLIT HERE');
    let divs = '';
    orders.forEach((order, tableNum) => {
        divs += `                        <div class="form-group">
                            <label for="order${i}" class="text-info">Order for table <strong>${tableNum}</strong>:</label><br>
                            <span>${order}</span> <input type="checkbox" id="order${i}" name="${tableNum}"><br>
                        </div>`;
        i++;
    });
    return htmlHalves[0] + divs + htmlHalves[1];
}

module.exports = {addOrder, removeOrders, getHTML};