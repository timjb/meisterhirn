addEventListener('message', function(evt) { // wenn eine Nachricht eintrifft
	var obj = JSON.parse(evt.data), // Nachricht-Objekt aus dem String bauen
	    command = obj.command, // das Kommando, das aufgerufen werden soll (String)
	    args = obj.arguments || []; // Die Parameter, mit denen es aufgerufen werden soll
	if(commands[command]) { // nur wenn es das Kommando gibt …
		commands[command].apply(commands, args); // wird es mit den den angegebenen Parametern aufgerufen
	}
}, false);

// globale Einstellungen
var cols, colors, combinations, scores, possibilities, first;

var commands = {
	init: function(cols1, colors1) { // die Einstellungen des Spiels werden mitgeteilt
		cols   = cols1; // Wie viele Spalten es gibt.
		colors = colors1; // Wie viele Farben es gibt. 
		
		// => alle möglichen Kombinationen …
		combinations = []; // … werden in einem Array gesammelt
		var count = Math.pow(colors, cols); // Anzahl der Möglichkeiten = Anzahl der Farben hoch Anzahl der Spalten
		for(var i = 0; i < count; i += 1) { // für jedes i von 0 bis exklusiv die Anzahl der Möglichkeiten
			var combination = [], x = i; // eine Kombination
			for(var j = 0; j < cols; j += 1) { // für jede Stelle:
				var y = x % colors; // Module gibt den Rest einer Division zurück
				x = Math.floor(x / colors); // Die Division, abgerundet (wie oft geht color in x) => neues x für die neue Stelle
				combination[j] = y; // Stelle zur Kombination hinzufügen
			}
			combinations[i] = combination; // Kombination zum Array der Kombinationen hinzufügen
		}
		
		// Alle möglichen und unmöglichen Bewertungen einer Zeile
		scores = [];
		var i = cols + 1;
		while(i) { // i: Anzahlen der schwarzen Stifte
			i--;
			var j = cols + 1 - i;
			while(j) { // j: Anzahlen der weißen Stifte
				j--;
				scores.push([i, j]);
			}
		}
	},
	reset: function() {
		first = true; // Das Spiel beginnt neu
		possibilities = combinations.slice(); // Alle Möglichkeiten in Betracht ziehen
	},
	propose: function() {
		// Algorithmus von Don Knuth
		// http://en.wikipedia.org/wiki/Mastermind_%28board_game%29#Five-guess_algorithm
		// 
		// Kurz erklärt:
		// 1. Der erste Tipp ist zur Hälfte die erste und zur anderen Hälfte die zweite Farbe
		
		if(first) {
			var combination = [];
			for(var i = 0, l = cols; i < l; i += 1) {
				combination[i] = (i < l/2) ? 0 : 1; // Wenn Spalte kleiner als die Hälfte der Spaltenanzahl, dann Farbe 1, ansonsten Farbe 2
			}
			send('propose', combination); // vorschlagen
			return; // Funktion verlassen
		}
		
		// 2. Wenn nur noch zwei oder gar nur noch eine Möglichkeit übrig sind, nimm einfach eine davon.
		
		if(possibilities.length <= 2) {
			send('propose', possibilities[0]);
			return;
		}
		
		// 3. Wenn noch mehrere Kombinationen die Lösung sein können, dann gehe jede Kombination (auch die für die Lösung ausgeschlossen durch) und suche diejenige aus, bei der selbst bei ungünstigem Schwarz/Weiß-Ergebnis noch die meisten Kombinationen für das Ergebnis ausgeschlossen werden können
		
		var maxScore = -1, // wieviele Kombinationen bei dem bisher besten Tipp mindestens ausgeschlossen werden können
		    maxCombination; // der bisher beste Tipp
		
		// hiervon werden nachher Kopien erstellt. Siehe unten.
		var scoresTpl = [];
		var i = (cols + 1) * cols;
		while(i) {
			i--;
			scoresTpl.push(0);
		}
		
		// Jede Kombination durchgehen:
		var i = combinations.length;
		while(i) {
			i--;
			var combination = combinations[i];
			
			var possibleScores = scoresTpl.slice(); // Kopie von scoresTpl. Hier wird gespeichert, bei welchem Schwarz/Weiß-Ergebnis wie viele Kombinationen nicht ausgeschlossen werden können
			
			// Jedes noch mögliche Ergebnis durchgehen:
			var j = possibilities.length;
			while(j) {
				j--;
				var judgement = judge(combination, possibilities[j]); // das Ergebnis, bei dem die Kombination nicht ausgeschlossen werden könnte
				possibleScores[(cols + 1) * judgement[0] + judgement[1]]++; // kann nicht ausgeschlossen werden, also dazugehörigen Zähler hochzählen
			}
			
			var score = possibilities.length - Math.max.apply(Math, possibleScores); // wie viele mögliche Ergebnisse selbst bei ungünstigem Schwarz/Weiß-Ergebnis noch verbleiben: Anzahl der verbleibenden Möglichkeiten minus dem Maximum an nicht ausgeschlossenen Kombinationen
			if(score > maxScore) { // gibt es eine neue beste Kombination?
				maxScore = score; // neue beste Anzahl an minimalen Ausschlüssen
				//log('new maxScore: ' + maxScore);
				maxCombination = combination; // neuen besten Tipp setzen
			}
			
		}
		send('propose', maxCombination); // Kombination vorschlagen
	},
	guess: function() {
		this.propose(); // Vorschlag machen
		send('guess'); // mitteilen, dass der Vorschlag gleich geprüft werden soll
	},
	row: function(row, result) { // das Ergebnis wird mitgeteilt
		first = false; // Wir befinden uns nicht mehr in der ersten Zeile
		
		// Über alle offenen Möglichen iterieren und Möglichkeiten ausschließen
		var i = possibilities.length;
		while(i) {
			i--;
			var judgement = judge(row, possibilities[i]); // Die Reihe auf Basis des möglichen Ergebnisses bewerten
			if(judgement[0] != result[0] || judgement[1] != result[1]) { // kommt nicht dasselbe Ergebnis wie mitgeteilt raus
				possibilities.splice(i, 1); // => Möglichkeit ausgeschlossen
			}
		}
	}
};

function send(command) { // sendet ein Kommande an das JavaScript auf der Seite
	postMessage(JSON.stringify({
		command:   command, // die Funktion, die aufgerufen werden soll
		arguments: Array.prototype.slice.call(arguments, 1) // alle Argumente dieser Funktion ab dem zweiten
	}));
}

function log() { // zum Debugging
	var args = Array.prototype.slice.apply(arguments); // Die Argumente, mit der diese Funktion aufgerufen wurde
	args.unshift('log'); // Vorne den String "log" hinzufügen
	send.apply(null, args); // Funktion send mit den Argumenten aufrufen
}

// Für eine Erklärung dieser Funktion bitte meisterhirn.js betrachten
function judge(row, solution) {
	row = row.slice();
	solution = solution.slice();
	
	// Anzahl weißer und schwarzer Stecker
	var white = 0,
		black = 0;
	
	// Schwarze Stecker
	var i = row.length;
	while(i) {
		i--;
		if(row[i] == solution[i]) {
			black++;
			// Position aus beiden Arrays löschen (=> wird nicht doppelt gezählt)
			row     .splice(i, 1);
			solution.splice(i, 1);
		}
	}
	
	// Weiße Stecker
	var i = row.length;
	while(i) {
		i--;
		var j = solution.length;
		while(j) {
			j--;
			// Farbe aus erstem Array kommt irgendwo im zweiten Array vor
			if(row[i] == solution[j]) {
				white++;
				// Diese Positionen löschen
				row     .splice(i, 1);
				solution.splice(j, 1);
				break;
			}
		}
	}
	
	return [black, white];
}
