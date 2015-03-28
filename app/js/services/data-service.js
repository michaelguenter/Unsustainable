'use strict';

var servicesModule = require('./_index.js');

/**
 * @ngInject
 */
servicesModule.service('dataService', function ($q, $timeout, sqliteService, $log) {
    var service = {};

    service.getCurrentElements = function () {
        var query = "SELECT e.Id, e.Name, e.Description, e.Image, p.CurrentEnergy, ce.Location, ce.Id AS CeId FROM CurrentElement AS ce " +
            "JOIN Player AS p ON p.Id = ce.PlayerId " +
            "JOIN Element AS e ON e.Id = ce.ElementId " +
            "WHERE p.Id = 1" +
            ";";

        return sqliteService.query(query, []);
    };

    // TODO: Use
    service.getAllElements = function () {
        var query = "SELECT * FROM Elements ";
        return sqliteService.query(query);
    };

    service.getCombinedElement = function (element1, element2) {
        var parameters = [element1.Id, element2.Id, element1.Id, element2.Id];
        var query = "SELECT e.Id, e.Name, e.Description, e.Image, r.EnergyUsage FROM Element AS e " +
            "JOIN Recipe AS r ON r.ResultId = e.Id " +
            "WHERE (r.Element1Id = ? AND r.Element2Id = ?) OR (r.Element2Id = ? AND r.Element1Id = ?)";

        return sqliteService.query(query, parameters);
    };

    service.getElementParts = function (element) {
        var parameters = [element.Id];
        var query = "SELECT e.Id, e.Name, e.Description, e.Image, r.EnergyUsage FROM Element AS e " +
            "JOIN Recipe AS r ON r.Element1Id = e.Id OR r.Element2Id = e.Id " +
            "WHERE r.ResultId = ?";

        return sqliteService.query(query, parameters);
    };

    service.getBaseElements = function () {
        var parameters = [];
        var query = "SELECT e.Id, e.Name, e.Description, e.Image, r.EnergyUsage FROM Element AS e " +
            "LEFT JOIN Recipe AS r ON r.ResultId = e.Id " +
            "WHERE r.ResultId IS NULL";

        return sqliteService.query(query, parameters);
    };

    service.isBaseElement = function (element) {
        var deferred = $q.defer();

        var parameters = [element.Id];
        var query = "SELECT COUNT(*) AS count FROM Element AS e \
            LEFT JOIN Recipe AS r ON r.ResultId = e.Id\
            WHERE r.ResultId IS NULL AND e.Id = ?\
        ";

        sqliteService.query(query, parameters).then(function (result) {
            deferred.resolve(result[0].count == 1);
        });

        return deferred.promise;
    };

    service.restoreBaseElements = function () {
        var deferred = $q.defer();

        service.getBaseElements().then(function (baseElements) {
            var queries = [];
            queries.push("DELETE FROM CurrentElement");

            var location = { x: 100, y: 200};
            angular.forEach(baseElements, function (element) {
                queries.push("INSERT INTO CurrentElement\
                    (PlayerId, ElementId, Location)\
                    VALUES\
                    (1, " + element.Id + ", '" + JSON.stringify(location) + "')\
                ");

                location.x = location.x + 100;
            });

            sqliteService.chain(queries).then(function () {
                deferred.resolve();
            });
        });

        return deferred.promise;
    };

    service.updateCurrentElement = function (element) {
        var parameters = [element.Id, JSON.stringify(element.Location), element.CeId];
        var query = "UPDATE CurrentElement SET \
            ElementId = ?, Location = ?\
            WHERE Id = ?\
        ";

        return sqliteService.query(query, parameters);
    };

    service.updateCurrentEnergy = function (energy) {
        var parameters = [energy];
        var query = "UPDATE Player SET CurrentEnergy = ? WHERE Id = 1";

        return sqliteService.query(query, parameters);
    };

    return service;
});

