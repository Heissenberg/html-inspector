HTMLInspector.rules.add(
  "script-placement",
  {
    whitelist: []
  },
  function(listener, reporter) {

    var elements = []
      , whitelist = this.whitelist

    function isWhitelisted(el) {
      if (!whitelist) return false
      if (typeof whitelist == "string") return $(el).is(whitelist)
      if (Array.isArray(whitelist)) {
        return whitelist.length && whitelist.some(function(item) {
          return $(el).is(item)
        })
      }
      return false
    }

    listener.on("element", function(name) {
      elements.push(this)
    })

    listener.on("afterInspect", function() {
      var el
      // scripts at the end of the elements are safe
      while (el = elements.pop()) {
        if (el.nodeName.toLowerCase() != "script") break
      }
      elements.forEach(function(el) {
        if (el.nodeName.toLowerCase() == "script") {
          // scripts with the async or defer attributes are safe
          if (el.async === true || el.defer === true) return
          // at this point, if the script isn't whitelisted, throw an error
          if (!isWhitelisted(el)) {
            reporter.warn(
              "script-placement",
              "<script> elements should appear right before "
              + "the closing </body> tag for optimal performance.",
              el
            )
          }
        }
      })
    })
  }
)