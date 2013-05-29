describe("HTMLInspector", function() {

  var originalRules = HTMLInspector.rules
    , originalExtensions = HTMLInspector.extensions

  beforeEach(function() {
    HTMLInspector.rules = {}
  })

  afterEach(function() {
    HTMLInspector.rules = originalRules
    HTMLInspector.extensions = originalExtensions
  })

  it("can add new rules", function() {
    HTMLInspector.addRule("new-rule", $.noop)
    expect(HTMLInspector.rules["new-rule"]).toBeDefined()
  })

  it("can add new extensions", function() {
    HTMLInspector.addExtension("new-extension", {})
    expect(HTMLInspector.extensions["new-extension"]).toBeDefined()
  })

  it("only runs the specified rules (or all rules if none are specified)", function() {
    var rules = []
    HTMLInspector.addRule("one", function(listener, reporter) {
      listener.on("beforeInspect", function(name) { rules.push("one") })
    })
    HTMLInspector.addRule("two", function(listener, reporter) {
      listener.on("beforeInspect", function(name) { rules.push("two") })
    })
    HTMLInspector.addRule("three", function(listener, reporter) {
      listener.on("beforeInspect", function(name) { rules.push("three") })
    })
    HTMLInspector.inspect()
    expect(rules.length).toBe(3)
    expect(rules[0]).toBe("one")
    expect(rules[1]).toBe("two")
    expect(rules[2]).toBe("three")
    rules = []
    HTMLInspector.inspect({rules: ["one"]})
    expect(rules.length).toBe(1)
    expect(rules[0]).toBe("one")
    rules = []
    HTMLInspector.inspect({rules: ["one", "two"]})
    expect(rules.length).toBe(2)
    expect(rules[0]).toBe("one")
    expect(rules[1]).toBe("two")
  })

  it("invokes the complete callback passing in an array of errors", function() {
    var log
    HTMLInspector.addRule("one-two", function(listener, reporter) {
      reporter.addError("one-two", "This is the `one` error message", document)
      reporter.addError("one-two", "This is the `two` error message", document)

    })
    HTMLInspector.addRule("three", function(listener, reporter) {
      reporter.addError("three", "This is the `three` error message", document)
    })
    HTMLInspector.inspect({
      complete: function(errors) {
        log = errors
      }
    })
    expect(log.length).toBe(3)
    expect(log[0].message).toBe("This is the `one` error message")
    expect(log[1].message).toBe("This is the `two` error message")
    expect(log[2].message).toBe("This is the `three` error message")
  })

  it("accepts a variety of options for the config paramter", function() {
    var log = []
      , div = document.createElement("div")
    HTMLInspector.addRule("dom", function(listener, reporter) {
      listener.on("element", function(name) {
        log.push(this)
      })
    })
    HTMLInspector.addRule("rules", function() {
      log.push("rules")
    })
    // if it's an array, assume it's a list of rules
    HTMLInspector.inspect(["dom"])
    expect(log[0]).not.toBe("rules")
    log = []
    // if it's a string, assume it's a selector or HTML representing domRoot
    HTMLInspector.inspect("body")
    expect(log[1]).toBe($("body")[0])
    log = []
    HTMLInspector.inspect("<p>foobar</p>")
    expect(log[1].innerHTML).toBe("foobar")
    log = []
    // if it's a DOM element, assume it's the domRoot
    HTMLInspector.inspect(div)
    expect(log[1]).toBe(div)
    log = []
    // if it's jQuery, assume it's the domRoot
    HTMLInspector.inspect($(div))
    expect(log[1]).toBe(div)
    log = []
    // if it's a function, assume it's complete
    HTMLInspector.inspect(function(errors) {
      log = "func"
    })
    expect(log).toBe("func")
  })

  describe("DOM Traversal and Events", function() {

    var $html = $(''
          + '<section class="section">'
          + '  <h1 id="heading" class="multiple classes">Heading</h1>'
          + '  <p class="first">One</p>'
          + '  <p>More</p>'
          + '  <blockquote>'
          + '    <p>Nested</p>'
          + '    <p class="stuff">Stuff'
          + '      <em id="emphasis">lolz</em>'
          + '    </p>'
          + '  </blockquote>'
          + '</section>'
        )

    it("inspects the HTML starting from the specified domRoot", function() {
      var events = []
      HTMLInspector.addRule("traverse-test", function(listener, reporter) {
        listener.on("element", function(name) {
          events.push(name)
        })
      })
      HTMLInspector.inspect()
      expect(events[0]).toBe("html")
      events = []
      HTMLInspector.inspect({ domRoot: $html })
      expect(events[0]).toBe("section")
    })

    it("triggers `beforeInspect` before the DOM traversal", function() {
      var events = []
      HTMLInspector.addRule("traverse-test", function(listener, reporter) {
        listener.on("beforeInspect", function() {
          events.push("beforeInspect")
        })
        listener.on("element", function() {
          events.push("element")
        })
      })
      HTMLInspector.inspect($html)
      expect(events.length).toBeGreaterThan(2)
      expect(events[0]).toBe("beforeInspect")
      expect(events[1]).toBe("element")
    })

    it("traverses the DOM emitting events for each element", function() {
      var events = []
      HTMLInspector.addRule("traverse-test", function(listener, reporter) {
        listener.on("element", function(name) {
          events.push(name)
        })
      })
      HTMLInspector.inspect($html)
      expect(events.length).toBe(8)
      expect(events[0]).toBe("section")
      expect(events[1]).toBe("h1")
      expect(events[2]).toBe("p")
      expect(events[3]).toBe("p")
      expect(events[4]).toBe("blockquote")
      expect(events[5]).toBe("p")
      expect(events[6]).toBe("p")
      expect(events[7]).toBe("em")
    })

    it("traverses the DOM emitting events for each id attribute", function() {
      var events = []
      HTMLInspector.addRule("traverse-test", function(listener, reporter) {
        listener.on("id", function(name) {
          events.push(name)
        })
      })
      HTMLInspector.inspect($html)
      expect(events.length).toBe(2)
      expect(events[0]).toBe("heading")
      expect(events[1]).toBe("emphasis")
    })


    it("traverses the DOM emitting events for each class attribute", function() {
      var events = []
      HTMLInspector.addRule("traverse-test", function(listener, reporter) {
        listener.on("class", function(name) {
          events.push(name)
        })
      })
      HTMLInspector.inspect($html)
      expect(events.length).toBe(5)
      expect(events[0]).toBe("section")
      expect(events[1]).toBe("multiple")
      expect(events[2]).toBe("classes")
      expect(events[3]).toBe("first")
      expect(events[4]).toBe("stuff")
    })

    it("triggers `afterInspect` after the DOM traversal", function() {
      var events = []
      HTMLInspector.addRule("traverse-test", function(listener, reporter) {
        listener.on("afterInspect", function() {
          events.push("afterInspect")
        })
        listener.on("element", function() {
          events.push("element")
        })
      })
      HTMLInspector.inspect($html)
      expect(events.length).toBeGreaterThan(2)
      expect(events[events.length - 1]).toBe("afterInspect")
    })

  })

})
describe("Listener", function() {

  var Listener = getListenerConstructor()

  function getListenerConstructor() {
    var Listener
      , originalRules = HTMLInspector.rules
    HTMLInspector.addRule("listener", function(listener) {
      Listener = listener.constructor
    })
    HTMLInspector.inspect({
      rules: ["listener"],
      domRoot: document.createElement("div")
    })
    HTMLInspector.rules = originalRules
    return Listener
  }


  it("can add handlers to a specific event", function() {
    var listener = new Listener()
    listener.on("foo", $.noop)
    listener.on("bar", $.noop)
    expect(listener._events.foo).toBeDefined()
    expect(listener._events.bar).toBeDefined()
  })

  it("can trigger handlers on a specific event", function() {
    var listener = new Listener()
    spyOn($, "noop")
    listener.on("foo", $.noop)
    listener.on("bar", $.noop)
    listener.trigger("foo")
    listener.trigger("bar")
    expect($.noop.callCount).toBe(2)
  })

  it("can remove handlers from a specific event", function() {
    var listener = new Listener()
    spyOn($, "noop")
    listener.on("foo", $.noop)
    listener.on("bar", $.noop)
    listener.off("foo", $.noop)
    listener.off("bar", $.noop)
    listener.trigger("foo")
    listener.trigger("bar")
    expect($.noop.callCount).toBe(0)
  })

})
describe("Reporter", function() {

  var Reporter = getReporterConstructor()

  function getReporterConstructor() {
    var Reporter
      , originalRules = HTMLInspector.rules
    HTMLInspector.addRule("reporter", function(reporter, reporter) {
      Reporter = reporter.constructor
    })
    HTMLInspector.inspect({
      rules: ["reporter"],
      domRoot: document.createElement("div")
    })
    HTMLInspector.rules = originalRules
    return Reporter
  }

  it("can add an error to the report log", function() {
    var reporter = new Reporter()
    reporter.addError("rule-name", "This is the message", document)
    expect(reporter._errors.length).toBe(1)
    expect(reporter._errors[0].rule).toBe("rule-name")
    expect(reporter._errors[0].message).toBe("This is the message")
    expect(reporter._errors[0].context).toBe(document)
  })

  it("can get all the errors that have been logged", function() {
    var reporter = new Reporter()
    reporter.addError("rule-name", "This is the first message", document)
    reporter.addError("rule-name", "This is the second message", document)
    reporter.addError("rule-name", "This is the third message", document)
    expect(reporter.getErrors().length).toBe(3)
    expect(reporter.getErrors()[0].message).toBe("This is the first message")
    expect(reporter.getErrors()[1].message).toBe("This is the second message")
    expect(reporter.getErrors()[2].message).toBe("This is the third message")
  })

})
describe("Extensions", function() {
describe("css", function() {

  var css = HTMLInspector.extensions.css
    , originalStyleSheets = css.styleSheets
    , classes = ["alpha", "bar", "bravo", "charlie", "delta", "echo", "foo"]

  afterEach(function() {
    css.styleSheets = originalStyleSheets
  })

  it("can filter the searched style sheets via the styleSheets selector", function() {
    css.styleSheets = "link[href$='jasmine.css']"
    var classes = css.getClassSelectors()
    // limiting the style sheets to only jasmine.css means
    // .alpha, .bravo, and .charlie won't be there
    expect(classes.indexOf("alpha")).toEqual(-1)
    expect(classes.indexOf("bravo")).toEqual(-1)
    expect(classes.indexOf("charlie")).toEqual(-1)
  })

  it("can get all the class selectors in the style sheets", function() {
    css.styleSheets = "link[href$='-spec.css']"
    expect(css.getClassSelectors()).toEqual(classes)
  })

  it("can include both <link> and <style> elements", function() {
    var extraClasses = classes.concat(["style", "fizz", "buzz"]).sort()
    // first remove any style tags browser extensions might be putting in
    $("style").remove()
    $("head").append(""
      + "<style id='style'>"
      + ".style .foo, .style .bar { visiblility: visible }"
      + ".style .fizz, .style .buzz { visiblility: visible }"
      + "</style>"
    )
    css.styleSheets = "link[href$='-spec.css'], style"
    expect(css.getClassSelectors()).toEqual(extraClasses)
    $("#style").remove()
  })

})

})

describe("Rules", function() {

  var originalConfig = HTMLInspector.config

  function setupSandbox(html) {
    return  $("#html-inspector-sandbox").html(html)
  }

  beforeEach(function() {
    // HTMLInspector.config.styleSheets = $("link:not([href*='jasmine'])")
    $('<div id="html-inspector-sandbox"></div>').appendTo("body")
  })

  afterEach(function() {
    // HTMLInspector.config = originalConfig
    $("#html-inspector-sandbox").remove()
  })

describe("nonsemantic-elements", function() {

  var log
    , $sandbox

  function complete(reports) {
    log = []
    reports.forEach(function(report) {
      log.push(report)
    })
  }

  it("warns when unattributed <div> or <span> elements appear in the HTML", function() {
    var html = ''
          + '<div>'
          + '  <span>Foo</span>'
          + '  <p>Foo</p>'
          + '  <div><b>Foo</b></div>'
          + '</div>'

    HTMLInspector.inspect({
      rules: ["nonsemantic-elements"],
      domRoot: $sandbox = setupSandbox(html),
      complete: complete
    })

    expect(log.length).toBe(3)
    expect(log[0].message).toBe("Do not use <div> or <span> elements without any attributes")
    expect(log[1].message).toBe("Do not use <div> or <span> elements without any attributes")
    expect(log[2].message).toBe("Do not use <div> or <span> elements without any attributes")
    expect(log[0].context).toBe($sandbox.find("div")[0])
    expect(log[1].context).toBe($sandbox.find("span")[0])
    expect(log[2].context).toBe($sandbox.find("div")[1])

  })

  it("doesn't warn when attributed <div> or <span> elements appear in the HTML", function() {
    var html = ''
          + '<div data-foo="bar">'
          + '  <span class="alert">Foo</span>'
          + '  <p>Foo</p>'
          + '  <div><b>Foo</b></div>'
          + '</div>'

    HTMLInspector.inspect({
      rules: ["nonsemantic-elements"],
      domRoot: $sandbox = setupSandbox(html),
      complete: complete
    })

    expect(log.length).toBe(1)
    expect(log[0].message).toBe("Do not use <div> or <span> elements without any attributes")
    expect(log[0].context).toBe($sandbox.find("div").last()[0])

  })

  it("doesn't warn when unattributed, semantic elements appear in the HTML", function() {
    var html = ''
          + '<section data-foo="bar">'
          + '  <h1>Foo</h1>'
          + '  <p>Foo</p>'
          + '</section>'

    HTMLInspector.inspect({
      rules: ["nonsemantic-elements"],
      domRoot: $sandbox = setupSandbox(html),
      complete: complete
    })

    expect(log.length).toBe(0)

  })

})

describe("unused-classes", function() {

  var log

  function complete(reports) {
    log = []
    reports.forEach(function(report) {
      log.push(report)
    })
  }

  it("warns when non-whitelisted classes appear in the HTML but not in any stylesheet", function() {
    var html = ''
          + '<div class="fizz buzz">'
          + '  <p class="foo bar baz">This is just a test</p>'
          + '</div>'

    HTMLInspector.inspect({
      rules: ["unused-classes"],
      domRoot: setupSandbox(html),
      complete: complete
    })

    expect(log[0].message).toBe("The class 'fizz' is used in the HTML but not found in any stylesheet")
    expect(log[1].message).toBe("The class 'buzz' is used in the HTML but not found in any stylesheet")
    expect(log[2].message).toBe("The class 'baz' is used in the HTML but not found in any stylesheet")
    expect(log[0].context).toBe($("div.fizz.buzz")[0])
    expect(log[1].context).toBe($("div.fizz.buzz")[0])
    expect(log[2].context).toBe($("p.foo.bar")[0])

  })

  it("doesn't warn when whitelisted classes appear in the HTML", function() {
    var html = ''
          + '<div class="supports-flexbox">'
          + '  <p class="js-alert">This is just a test</p>'
          + '</div>'

    HTMLInspector.inspect({
      rules: ["unused-classes"],
      domRoot: setupSandbox(html),
      complete: complete
    })

    expect(log.length).toBe(0)

  })

})

})
