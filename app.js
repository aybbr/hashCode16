'use strict';

var fs = require('fs');
var grid = {
    columns: 0,
    rows: 0
};
var drones_number = 0;
var drones = [];
var turns_number = 0;
var max_payload = 0;
var product_types = 0;
var product_weights = [];
var warehouses_number = 0;
var warehouses = [];
var orders_number = 0;
var orders = [];
var actions = [];

// var files = ['busy_day', 'mother_of_all_warehouses', 'redundancy'];
var files = ['busy_day'];

files.forEach(function(fileName) {
    fs.readFile('./input/' + fileName + '.in', (err, data) => {
        if (err) throw err;
        var lines = data.toString().split('\n');

        getProblemConfiguration(lines[0]);
        product_types = lines[1];
        product_weights = lines[2].split(' ');
        warehouses_number = lines[3];
        getWarehousesData(warehouses_number, lines);
        orders_number = lines[warehouses_number * 2 + 4];
        getOrdersData(orders_number, lines);
        initDrones();

        var i = 0;
        while (turns_number > 0 && i < orders.length) {
            drones.forEach(function(drone, index) {
                var orderToDeliver = orders[i + index];
                drone.run(orderToDeliver.productTypes, orderToDeliver.coordinates, i + index);
            });
            i += drones.length;
        };

        var output = '' + actions.length + '\n';
        actions.forEach(function(line) {
            output += line.join(' ') + '\n';
        });
        fs.writeFile('./output/' + fileName + '.txt', output);
        // console.log(output)
    });
});

function getProblemConfiguration(line) {
    var t = line.split(' ');
    grid.columns = t[0];
    grid.rows = t[1];
    drones_number = t[2];
    turns_number = t[3];
    max_payload = t[4];
}

function getWarehousesData(warehouses_number, lines) {
    for (var i = 4; i < warehouses_number * 2 + 4; i += 2) {
        var coordinatesLine = lines[i];
        var itemsLine = lines[i + 1];
        warehouses.push({
            coordinates: {
                c: coordinatesLine.split(' ')[0],
                r: coordinatesLine.split(' ')[1]
            },
            items: itemsLine.split(' ')
        });
    };
};

function getOrdersData(orders_number, lines) {
    var t = warehouses_number * 2 + 5;
    for (var i = t; i < orders_number * 3 + t; i += 3) {
        var coordinatesLine = lines[i];
        var productsNumber = lines[i + 1];
        var productTypes = lines[i + 2];
        orders.push({
            coordinates: {
                c: coordinatesLine.split(' ')[0],
                r: coordinatesLine.split(' ')[1]
            },
            productsNumber: productsNumber,
            productTypes: productTypes.split(' ')
        });
    };
};

function initDrones() {
    var initialPosition = {
        c: warehouses[0].coordinates.c,
        r: warehouses[0].coordinates.r
    }
    for (var i = 0; i < drones_number; i++) {
        drones.push({
            id: i,
            position: initialPosition,
            max_payload: max_payload,
            load: function(productType) {
                var self = this;
                var sortedWarehouses = sortWarehousesByDistance(self.position);
                var warehouseContainingProductType = getwarehouseContainingProductType(sortedWarehouses, productType);
                if (warehouseContainingProductType) {
                    var distanceToFly = distance(self.position, warehouseContainingProductType.coordinates);
                    self.position = warehouseContainingProductType.coordinates;
                    turns_number -= Math.ceil(distanceToFly) + 1;
                    var indexOfWarehouse = warehouses.indexOf(warehouseContainingProductType);
                    console.log(warehouses[indexOfWarehouse].items[productType])
                    warehouses[indexOfWarehouse].items[productType]--;
                    actions.push([self.id, 'L', indexOfWarehouse, productType, '1']);
                    return 1;
                } else {
                    return 0;
                }
            },
            deliver: function(customerPosition, customerIndex, productType) {
                var self = this;
                var distanceToFly = distance(self.position, customerPosition);
                self.position = customerPosition;
                turns_number -= Math.ceil(distanceToFly) + 1;
                actions.push([self.id, 'D', customerIndex, productType, '1']);
            },
            run: function(productTypes, customerPosition, customerIndex) {
                var self = this;
                productTypes.forEach(function(productType, i) {
                    if (self.load(productType)) {
                        self.deliver(customerPosition, customerIndex, productType);
                    }
                });
            }
        });
    };
};

function sortWarehousesByDistance(position) {
    var dataToReturn = warehouses;
    dataToReturn.sort(function(a, b) {
        var distanceA = distance(position, a.coordinates);
        var distanceB = distance(position, b.coordinates);
        return distanceA - distanceB;
    });
    return dataToReturn;
};

function getwarehouseContainingProductType(sortedWarehouses, productType) {
    var condition = true,
        i = 0,
        wareHouseToReturn = {};
    while (condition && i < sortedWarehouses.length) {
        if (sortedWarehouses[i].items[productType] >= 1) {
            condition = false;
            wareHouseToReturn = sortedWarehouses[i];
        }
        i++;
    };
    return wareHouseToReturn;
};

function distance(a, b) {
    return Math.sqrt(Math.pow(Math.abs(a.r - b.r), 2) + Math.pow(Math.abs(a.c - b.c), 2));
};
