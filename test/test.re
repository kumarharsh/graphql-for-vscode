let input = {|
  <html>
    <head>
      <title>A Simple HTML Document</title>
    </head>
    <body>
      <p>This is a very simple HTML document</p>
      <p>It only has two paragraphs</p>
    </body>
  </html>
|};

let query = {gql|
  query X {
    a
    b
    c
  }
|};

let result = Js.String.match([%re {|/<p>(.*?)<\/p>/gi|}], input);

switch (result) {
| Some(result) => Js.Array.forEach(Js.log, result)
| None => Js.log("no matches")
};