'use strict';
angular.module('app', ['ngRoute'])

.config(function($routeProvider, $locationProvider) {
    $routeProvider
    .when('/', {
        templateUrl: 'start.html',
        controller: 'StartCtrl'
    })
    .when('/media/:jsonLink', {
        templateUrl: 'media.html',
        controller: 'MediaCtrl',
    });

  // $locationProvider.html5Mode(true);
})

/*
Factories & Services
************/
.factory('webtest', function($q, $timeout, $http) {
    var Webtest = {
        fetch: function(jsonLink) {

            var deferred = $q.defer();
            // console.log('callback: ',callback);
            $timeout(function() {
                $http.get(jsonLink).success(function(data) {
                    deferred.resolve(data);
                });
            }, 30);
            return deferred.promise;
        }
    };

    return Webtest;
})

/*
CONTROLLERS
************/
.controller('MainCtrl', ['$scope', '$routeParams', function ($scope, $routeParams) {
    $scope.test = 'fdfdsfs';
}])

.controller('StartCtrl', ['$scope', '$routeParams', function ($scope, $routeParams) {
    $scope.test = 'fdfdsfs';
}])

.controller('MediaCtrl', ['$scope', '$http', 'webtest', '$routeParams', function ($scope, $http, webtest, $routeParams) {
	

    console.log('$routeParams: ',$routeParams.jsonLink);
	$scope.mainHeight = 30;

    $scope.updateBox = function(item){
        // console.log('item: ', item);
        $scope.frameInfo = item;
    };

	webtest.fetch('data/'+ $routeParams.jsonLink +'.json').then(function(data) {
        $scope.mediaData = data;
        console.log('$scope.mediaData: ', $scope.mediaData);

        $scope.tags = data.BisicInfo.Genre.split(", ");
        $scope.startNodes(data.KeywordsBubble);
        
        var RGBData = [
        {"value":data.RGB.R}, 
        {"value":data.RGB.G}, 
        {"value":data.RGB.B},
        {"value":data.RGB.Rest}
        ],
        BrightnessData = [
        {"value":data.Brightness.Bright}, 
        {"value":data.Brightness.Dark}, 
        {"value":data.Brightness.Medium}
        ];
        console.log('RGBData: ',RGBData);
        $scope.startPies(RGBData, ["#FF3056", "#4AD663", "#59C7FC", '#eeeeee']);
        $scope.startPies(BrightnessData, ["#eeeeee", "#222222", "#666666"]);
    });

    $scope.startNodes = function(jsonObj){
        var width = 900,
        height = 600;

        var color = d3.scale.category20();

        var force = d3.layout.force()
        .charge(-120)
        .linkDistance(30)
        .size([width, height]);

        var svg = d3.select(".media-section_nodes").append("svg")
        .attr("width", width)
        .attr("height", height)

        force
        .nodes(jsonObj.nodes)
        .links(jsonObj.links)
        .start();

        var link = svg.selectAll(".link")
        .data(jsonObj.links)
        .enter().append("line")
        .attr("class", "link")
        .style("stroke-width", function(d) { return Math.sqrt(d.value); });

        var node = svg.selectAll(".node")
        .data(jsonObj.nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", 8)
        .style("fill", function(d) { return color(d.group); })
        .call(force.drag);

        node.on("click", function(d){
            console.log('d: ',d);
            $( "#nodeInfo" ).css('display', 'inline-block');
            $( "#index" ).html( "<span>Index:</span> " + d.index );
            $( "#wiki" ).html( "<span>WikiId:</span> " + d.wikiid );
            $( "#title" ).html( "<span>Title:</span> " + d.title );

        }) 

        node.append("title")
        .text(function(d) { return d.title; });

        force.on("tick", function() {
            link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

            node.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
        });
    }

    

    $scope.startPies = function (data, colorList) {
        var w = 80,                        //width
        h = 80,                            //height
        r = 40,                            //radius
        // color = d3.scale.category20c();     //builtin range of colors
        color = d3.scale.ordinal()
        .range(colorList);

        var vis = d3.select(".pies")
        .append("svg:svg")              //create the SVG element inside the <body>
        .data([data])                   //associate our data with the document
        .attr("width", w)           //set the width and height of our visualization (these will be attributes of the <svg> tag
        .attr("height", h)
        .append("svg:g")                //make a group to hold our pie chart
        .attr("transform", "translate(" + r + "," + r + ")")    //move the center of the pie chart from 0, 0 to radius, radius

        var arc = d3.svg.arc()              //this will create <path> elements for us using arc data
        .outerRadius(r);

        var pie = d3.layout.pie()           //this will create arc data for us given a list of values
        .value(function(d) { return d.value; });    //we must tell it out to access the value of each element in our data array

        var arcs = vis.selectAll("g.slice")     //this selects all <g> elements with class slice (there aren't any yet)
        .data(pie)                          //associate the generated pie data (an array of arcs, each having startAngle, endAngle and value properties) 
        .enter()                            //this will create <g> elements for every "extra" data element that should be associated with a selection. The result is creating a <g> for every object in the data array
        .append("svg:g")                //create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
        .attr("class", "slice");    //allow us to style things in the slices (like text)

        arcs.append("svg:path")
        .attr("fill", function(d, i) { return color(i); } ) //set the color for each slice to be chosen from the color function defined above
        .attr("d", arc);                                    //this creates the actual SVG path using the associated data (pie) with the arc drawing function

        arcs.append("svg:text")                                     //add a label to each slice
        .attr("transform", function(d) {                    //set the label's origin to the center of the arc
        //we have to make sure to set these before calling arc.centroid
        d.innerRadius = 0;
        d.outerRadius = r;
        return "translate(" + arc.centroid(d) + ")";        //this gives us a pair of coordinates like [50, 50]
        })
        .attr("text-anchor", "middle")                          //center the text on it's origin
        .text(function(d, i) { return data[i].label; });        //get the label from our original data array

    }

}])

;