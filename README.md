Features
========

* works offline
* works on the iPhone
* works offline on the iPhone
* can play for you if you're too lazy to think
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
