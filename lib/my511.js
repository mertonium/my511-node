var jsdom = require('jsdom'),
        _ = require('underscore');

var my511 = exports;

my511.token = '123-456-789';

my511.getPrefix = function(source) {
  // Got this array from the nice folks at 511
  var prefixes = {
    muni: '1',
    westcat: '2',
    samtrans: '3',
    goldengatetransit: '4',
    actransit: '5',
    scvta: '6',
    caltrain: '70',
    tridelta: '81',
    emerygoround: '85'
  };

  if(_.keys(prefixes).indexOf(source) != -1) {
    return prefixes[source];
  } else {
    return false;
  }
};

my511.getNextTrip = function() {
  var args = Array.prototype.slice.call(arguments);

  var stopcode = args.shift() || '15838';
  var callback = args.pop() || function() {};
  var options = args.pop() || {};

  var defaults = {
    serviceUrl: 'http://services.my511.org/Transit2.0/GetNextDeparturesByStopCode.aspx'
  };

  options = _.defaults(options, defaults);

  var theUrl = options.serviceUrl+'?token='+my511.token+'&stopcode='+stopcode;
  console.log(theUrl);
  var theDom = jsdom.env(theUrl,
    ['http://ajax.googleapis.com/ajax/libs/jquery/1.6.3/jquery.min.js'],
    function(errors, window) {
      var retObj = my511._scraper(errors, window, { stopcode: stopcode});
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
my511._scraper = function(errors, window, opts) {
   var routes = [], i = 0;
   var $routeList = window.$('Route');
   //console.log($routeList.length);
   var current_time = new Date();

   var retObj = {
     stop_id: opts.stopcode,
     next_departure: '',
     current_time: current_time.getHours() +':'+current_time.getMinutes()
   };
   //console.log(retObj);

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
   return retObj;
};
