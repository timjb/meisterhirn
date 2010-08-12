Features
========

* works offline
* works on the iPhone
* works offline on the iPhone
* can play for you if you're too lazy too think
* highly customizable (How many rows and columns do you want? How many colors?)


API
===

	var mh = new Meisterhirn({
		// options for the model: specifying these
		// properties will overwrite the default properties
		colors: 2, // binary!
		multiple: true, // each color may appear multiple times in the solution
		cols: 10,
		rows: 4
	}, {
		// options for the view
		messageWon: 'w00t!',
		colors: ['#f00', '#00f'] // red and blue
		// have a look at the source code for more options!
	});
	mh.inject(document.getElementById('wrapper');


License
=======

(The MIT License)

Copyright (c) 2010 Tim Baumann

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
