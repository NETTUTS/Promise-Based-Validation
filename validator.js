var V = (function ($) {


  var validator = {

    // Can add to this, eg a telephone validator
    type: {
      'noCheck': {
        ok: function () { return true; }
      },

      'required': {
        ok: function (value) {
          var emptyString = $.type(value) === 'string' && $.trim(value) === '';
          return value !== undefined && value !== null && !emptyString;
        },
        message: 'This field is required'
      },

      'email': {
        ok: function (value) {
          var re = /[a-z0-9_]+@[a-z0-9_]+\.[a-z]{3}/i;
          return re.test(value);
        },
        message: 'Invalid Email'
      }

    },

    /**
     *
     * @param config
     * {
     *   '<jquery-selector>': string | object | [ string ]
     * }
     */
    validate: function (config) {

      // 1. Normalize the configuration object
      config = normalizeConfig(config);


      var promises = [],
        checks = [];

      // 2. Convert each validation to a promise
      $.each(config, function (idx, v) {
        var value = v.control.val();
        var retVal = v.check.ok(value);

        // Make a promise, check is based on Promises/A+ spec
        if (retVal.then) {
          promises.push(retVal);
        }
        else {
          var p = $.Deferred();

          if (retVal) p.resolve();
          else p.reject();

          promises.push(p.promise());
        }


        checks.push(v);
      });


      // 3. Wrap into a master promise
      var masterPromise = $.Deferred();
      $.when.apply(null, promises)
        .done(function () {
          masterPromise.resolve();
        })
        .fail(function () {
          var failed = [];
          $.each(promises, function (idx, x) {
            if (x.state() === 'rejected') {
              var failedCheck = checks[idx];
              var error = {
                check: failedCheck.checkName,
                error: failedCheck.check.message,
                field: failedCheck.field,
                control: failedCheck.control
              };
              failed.push(error);
            }
          });
          masterPromise.reject(failed);
        });


      // 4. Return the master promise
      return masterPromise.promise();
    }
  };


  /**
   *
   * @param config
   * @returns {Array}
   */
  function normalizeConfig(config) {
    config = config || config;

    var validations = [];

    $.each(config, function (selector, obj) {

      // make an array for simplified checking
      var checks = $.isArray(obj.checks) ? obj.checks : [obj.checks];

      $.each(checks, function (idx, check) {
        validations.push({
          control: $(selector),
          check: getValidator(check),
          checkName: check,
          field: obj.field
        });
      });

    });


    return validations;
  }

  function getValidator(type) {
    if ($.type(type) === 'string' && validator.type[type]) return validator.type[type];

    return validator.noCheck;
  }


  return validator;
})(jQuery);