var fs = require('fs');

var SRC_FILE  = process.cwd() + '/' + process.argv[2],
    DEST_FILE = process.cwd() + '/' + process.argv[3];

console.log('src file: ' + SRC_FILE);
console.log('dest file: ' + DEST_FILE);

fs.readFile(SRC_FILE, function(err, data) {
	if(err) throw err;
	
	data = data.toString();
	
	// get words
	var words = data.split(/(?:\s|,|;|\+|-|\*|\/|%|\(|\)|\{|\}|\[|\]|\.|:|=|'|"|!|\||&|<|>|\?)/);
	
	// count occurrences of a word
	var dictionary = {},
	    proto = Object.prototype;
	words.forEach(function(word) {
		if(word) {
			if(proto.hasOwnProperty.call(dictionary, word)) {
				dictionary[word]++;
			} else {
				dictionary[word] = 1;
			}
		}
	});
	
	// figure out which words are worth abbreviating
	var abbreviations = [],
	    total_savings = 0;
	for(var word in dictionary) {
		if(Object.prototype.hasOwnProperty.call(dictionary, word)) {
			var occurrences = dictionary[word],
			    length = word.length,
			    savings = (occurrences * length) - (occurrences * 2) - (2 + length);
			if(savings > 0) {
				total_savings += savings;
				abbreviations.push(word);
			}
		}
	}
	console.log(abbreviations.length + ' words will be abbreviated');
	
	// compile
	var compiled = data;
	abbreviations.sort(function(str1, str2) {
		return str2.length - str1.length;
	});
	abbreviations.forEach(function(word, index) {
		index = abbreviations.length - 1 - index;
		compiled = compiled.replace(new RegExp(word, 'g'), String.fromCharCode(256 + index));
		compiled = word + String.fromCharCode(127) + compiled;
	});
	
	// save
	fs.writeFile(DEST_FILE, compiled, function(err) {
		if(err) throw err;
		
		console.log('file saved!');
		
		// measure savings
		fs.stat(SRC_FILE, function(err, src_stats) {
			if(err) throw err;
			fs.stat(DEST_FILE, function(err, dest_stats) {
				if(err) throw err;
				console.log('src size: ' + src_stats.size);
				console.log('dest size: ' + dest_stats.size);
				console.log('=> savings: ' + (src_stats.size - dest_stats.size));
			});
		});
	});
});
