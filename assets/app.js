//document.addEventListener('DOMContentLoaded', function() { // Der Code in der folgenden Funktion wird erst ausgeführt, wenn das Dokument selber (nicht evt. enthaltene Bilder etc.) fertig geladen ist.
	
	var isIphone = navigator.userAgent.toLowerCase().indexOf('iphone') != -1;
	
	var mm = new Meisterhirn({ // Einstellungen zum Spiel selber:
		rows:     8, // Anzahl Zeilen
		colors:   6, // Anzahl Farben
		cols:     4, // Anzahl Spalten
		multiple: true // Darf das Ergebnis mehrfach eine Farbe beinhalten?
	}, { // Einstellungen zur Anzeige des Spiels#
		gridWidth: (isIphone) ? 59 : 69, // auf dem iPhone sind die Felder nur 59 Pixel, ansonsten 69 Pixel groß
		selectGridWidth: (isIphone) ? 43: 50 // s.o., nur für die Farbwahl
		// ein paar Nachrichten:
		//messageWon: 'Wir haben einen Gewinner',
		//messageLost: 'Du Loser!',
		//messageGaveUp: 'Du hast aufgegeben'
		//leftBackgroundColor: '#000'
	});
	mm.inject(document.getElementById('game')); // Spiel mittels der inject-Methode ins Dokument einfügen
	
	// Knöpfe unter dem Feld
	(function(doc) { // Anonyme Funktion, die sofort ausgeführt wird, "document" ist intern auch kürzer als "doc" verfügbar
		if(mm.autosolver) { // Nur wenn das Spiel automatisch gelöst werden kann (Worker werden unterstützt)
			var el = doc.getElementById('controls'); // Element, in das die Buttons eingefügt werden (wird per id aus dem Dokument geholt)
			
			//var propose = doc.createElement('button'); // Neues HTML-Element vom Typ "button"
			//propose.appendChild(doc.createTextNode('Tipp vorschlagen')); // Text im Element => auf dem Button
			//propose.addEventListener('click', function() { // Funktion, die ausgeführt wird, wenn Benutzer auf den Button klickt
				//mm.propose(); // Vorschlag machen
			//}, false); // false bitte ignorieren, hängt damit zusammen, ob ein Event zuerst auf dem umgebenden oder dem inneren Element gefeuert werden soll
			//el.appendChild(propose); // Element ins Dokument einfügen
			
			// Analog wird mit dem "Lösen"-Knopf verfahren
			var solve = doc.createElement('button');
			solve.appendChild(doc.createTextNode('Autopilot!'));
			solve.addEventListener('click', function() {
				mm.solve(); // Eigenständig lösen
			}, false);
			el.appendChild(solve);
		} // Ende if
	})(document); // Ende anonyme Funktion
	
	//alert(applicationCache.status);
	//applicationCache.swapCache();
	
//}, false); // Ende "Funktion, die direkt nach dem Laden des Dokuments ausgeführt wird"
