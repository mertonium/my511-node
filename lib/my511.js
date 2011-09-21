var jsdom = require('jsdom'),
        _ = require('underscore');

exports.getNextTrip = function() {
  var args = Array.prototype.slice.call(arguments);

  var stopcode = args.shift() || '15838';
  var callback = args.pop() || function() {};
  var options = args.pop() || {};

  var defaults = {
    token: '123-456-789',
    serviceUrl: 'http://services.my511.org/Transit2.0/GetNextDeparturesByStopCode.aspx'
  };

  options = _.defaults(options, defaults);

  var theUrl = options.serviceUrl+'?token='+options.token+'&stopcode='+stopcode;
  console.log(theUrl);
  var theDom = jsdom.env(theUrl,
    ['http://ajax.googleapis.com/ajax/libs/jquery/1.6.3/jquery.min.js'],
    function(errors, window) {
      var routes = [], i = 0;

      var $routeList = window.$('Route');
      console.log($routeList.length);

      var retObj = {
        stop_id: stopcode,
        next_departure: '',
        current_time: ''
      };
      console.log(retObj);
      _.each($routeList, function(el, idx){
        el = window.$(el);
        //console.log('--'+idx);
        var dtl = el.find('DepartureTimeList');

        if(dtl.children().length) {
          routes.push({
            route_long_name: el.find('RouteDirection').attr('name'),
            route_short_name: el.attr('name'),
            next_arrival: dtl.find('DepartureTime').first().text()
          });
        }
      });

      retObj.routes = routes;
      console.log(retObj);
      callback(retObj);
    }
  );
};

/** The returned object should look like this:
 *  {
 *    stop_id : (the id of the stop),
 *    next_departure : the time of the next departure from the stop - for any bus,
 *    current_time : the current time according to the info provider,
 *    routes : [    (this array should have an object for each route at the current stop)
 *        {
 *          route_long_name  : the full name of the route,
 *          route_short_name : the short name (if any) of the route,
 *          next_arrival     : either the number of minutes until the next bus (realtime),
 *                             or the time of the (scheduled) time of the next departure
 *        }
 *    ]
 *  }
 */