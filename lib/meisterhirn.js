/*
 * Copyright (c) 2010 Tim Baumann
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */


var Meisterhirn = (function(win, doc, M) { // Closure (Anonyme Funktion, die Sofort ausgeführt wird). Innerhalb ist das globale Objekt window als win, document als doc und Math als M verfügbar
	
	
	/******************
	* Hilfsfunktionen *
	******************/
	
	// Führt eine Funktion fn i-Mal aus
	function times(i, fn) {
		for(var j = 0; j < i; j++) { // Zählvariable j zählt bi i - 1
			fn(j); // Funktion ausführen mit der Nummer der Iteration als Parameter
		}
	}
	
	// Führt für jeden Wert in einem Array oder Objekt "obj" eine Funktion "fn" aus
	function each(obj, fn) {
		if(obj.length) { // Arrays haben eine length-Eigenschaft
			times(obj.length, function(i) { // Für jeden Index i im Array …
				fn(obj[i], i); // … die Funktion mit dem Wert an Stelle i und i als Parametern aufrufen
			});
		} else { // Normales Objekt
			for(var key in obj) { // For-in-Schleife: durchläuft alle Schlüssel in einem Objekt
				if(obj.hasOwnProperty(key)) { // Schlüssel ist im Objekt selber, nicht in einem Objekt in
				// der Prototyp-Kette enthalten
					fn(obj[key], key); // Funktion mit dem Wert und dem Schlüssel als Parameter aufrufen
				}
			}
		}
	}
	
	// Dunkelt eine Farbe ab
	function darker(hex) {
		hex = hex.replace(/^#/, ''); // Raute entfernen
		
		// Kurzform erweitern
		if(hex.length == 3) {
			hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
		}
		
		// Gibt eine Nummber im Hex-Format zurück, immer zweistellig
		function toHex(index) {
			var val = parseInt(hex.substr(index * 2, 2), 16), // Aus Zeichenkette auslesen und zu einer Zahl umrechnen
			    str = M.round(val * val / 470).toString(16); // Wert verringern (je größer ein Wert ist, desto weniger wird er verringert) und in einen String umrechnen (Basis: 16)
			if(str.length == 1) { // Nur eine Stelle?
				str = '0' + str; // Führende 0 hinzufügen
			}
			return str;
		}
		
		// Hex-String bauen und zurückgeben
		return '#' + toHex(0) + toHex(1) + toHex(2);
	}
	
	// Gibt die Position auf der Seite eines Elements "el" zurück
	function getOffsets(el) {
		var left = 0,
		    top  = 0;
		// Berechnung der Position mit den Eigenschaften offsetLeft und offsetTop,
		// die zum offsetParent relativ sind, dessen offsetLeft- und offsetTop-Werte
		// wiederum zu dessen offsetParent relativ sind usw.
		while(el) {
			left += el.offsetLeft;
			top  += el.offsetTop;
			el = el.offsetParent;
		}
		return [left, top]; // x- und y- Wert in Array zurückgeben
	}
	
	
	/*********
	* Mixins *
	*********/
	
	// Fügt in ein Objekt "obj" alle in "mixin" enthaltenen Eigenschaften und Methoden ein
	function mixin(obj, mixin) {
		each(mixin, function(val, key) { // Für jeden Schlüssel und den dazugehörigen Wert in mixin wird eine anonyme Funktion ausgeführt (siehe Funktion each)
			obj[key] = val; // Das obj bekommt für den Schlüssel den gleichen Wert wie mixin
		});
	}
	
	// Options-Mixin: sorgt für konfigurierbare Objekte mit in obj.options gespeicherten Standardwerten
	var Options = {
		setOptions: function(opts) { // opts ist das vom Nutzer übermittelte Konfigurationsobjekt
			var dflt    = this.options, // Standardeinstellungen
			    options = this.options = {}; // Standardeinstallungen leeren
			
			each(dflt, function(val, key) { // für jeden Schlüssel und Wert in den Standardeinstellungen
				options[key] = (opts.hasOwnProperty(key)) // setze die Einstellung. Wenn der Benutzer eine Einstellung definiert hat, dann
					? opts[key] // nimm die Benutzereinstellung
					: val; // ansonsten nimm die Standardeinstallung.
			});
		}
	};
	
	// Ereignisbehandlung
	var Events = {
		// Eine Funktion "fn", soll bei einem bestimmten Ereignis mit Namen "type" ausgeführt werden
		addEventListener: function(type, fn) {
			if(!this.events) { // noch kein this.events-Objekt vorhanden?
				this.events = {}; // this.events initialisieren
			}
			if(!this.events[type]) { // noch keine Event-Listener für diesen Event
				this.events[type] = []; // initalisieren
			}
			this.events[type].push(fn); // Funktion zum Array der Funktionen hinzufügen, die bei dem Ereignis type ausgeführt werden sollen
		},
		// Ereignis "type" auslösen
		fireEvent: function(type) {
			if(this.events) { // Eventbehandlung wurde initialisiert (das ist erst nach mind. einem Aufruf von addEventListener der Fall, siehe oben)
				var evts = this.events[type]; // Events dieses Typs raussuchen
				if(evts) { // Es gibt Events dieses Typs
					var args = Array.prototype.slice.call(arguments, 1); // Erklärung:
					// arguments sind alle Argumente mit denen die aktuelle Funktion (also hier fireEvent) aufgerufen wurde.
					// Der erste Parameter ist ja "type", darum brauchen wir alle ab dem zweiten.
					// Bei Arrays kann ich mit bspArray.slice(1) alle Elemente ab dem zweiten (Index: 1) extrahieren.
					// arguments ist aber aus historischen Gründen kann Array, sondern nur array-ähnlich und unterstützt diese Methode nicht.
					// Wir können aber die Array-Methode (verfügbar über Array.prototype.slice) auf arguments anwenden (mit der call-Methode, die jede Funktion besitzt, dabei ist der erste Parameter das Objekt, auf das sie angewendet werden soll und die nächsten Parameter sind die Parameter, mit denen die Funktion ausgeführt werden soll)
					
					each(evts, function(evt) { // Für jedes der Event-Funktionen …
						evt.apply(null, args); // … die Funktion mit den in der Variable args gespeicherten Parametern ausführen
					});
				}
			}
		}
	};
	
	// Verarbeitet Klicks
	var ClickAreas = {
		// fügt eine Klickzone hinzu:
		// * name ist ein Name, der dieser Klickzone gegeben wird. Es können auch mehrere Klickzonen mit dem gleichen Namen existieren.
		// * zone ist ein Objekt, das die Eigenschaften x, y, width und height besitzt und den Bereich relative zum Element (this.toElement()) beschreibt
		// * fn ist eine Funktion die bei einem Klick in diesen Bereich ausgeführt wird
		// * priority ermöglicht es, andere Bereiche zu überlagern (Klick gilt für den Bereich mit der größten Priorität). Standardwert: 0
		addClickArea: function(name, zone, fn, priority) {
			if(!this.clickAreas) {
				// Initialisierung
				this.clickAreas = {};
				
				var isIphone = navigator.userAgent.toLowerCase().indexOf('iphone') != -1, // handelt es sich um ein iPhone oder einen iPod touch? (navigator.userAgent ist ein besonderen String, der den Browser beschreibt, mit toLowerCase() wird er Kleingeschrieben zurückgegeben und indexOf gibt die Position eines Teilstrings zurück, oder wenn er nicht vorkommt -1
				    event    = (isIphone) ? 'touchstart' : 'click'; // Für iPhones ist das Event auf das gewartet wird 'touchstart' für andere Geräte 'click' (touchstart wird auf dem iPhone früher ausgelöst als click => Performance)
				var el = this.toElement(); // das Element
				
				var _this = this; // this ist das Objekt, auf das eine Funktion angewendet werden soll, Referenz darauf wird in der Variable _this gespeichert
				el.addEventListener(event, function(evt) { // anonyme Funktion soll bei Event mit dem in der Variable event gespeicherten Namen (siehe oben) ausgeführt werden
					if(isIphone) {
						evt = evt.changedTouches[0]; // Beim iPhone sind die Eigenschaften des Events in changedTouches[0] gespeichert (da es beim iPhone mehrere Bildschirmberührungen geben kann)
					}
					var offsets = getOffsets(el), // Absolute Position des Elements in Array
					    x = evt.pageX - offsets[0], // relative X-Position
					    y = evt.pageY - offsets[1]; // relative Y-Position
					_this.handleClick(evt, x, y); // handleClick-Methode mit der relativen Position aufrufen
				}, false); // false bitte nicht beachten
			}
			
			if(!this.clickAreas[name]) { // noch keine Klickzone mit diesem Namen?
				this.clickAreas[name] = []; // initialisieren
			}
			
			this.clickAreas[name].push({
				callback: fn, // die Funktion, die ausgeführt werden soll
				zone: zone, // die Zone
				priority: priority || 0 // die Priorität, oder wenn nicht angegeben, 0
			});
		},
		removeClickAreas: function(name) {
			if(this.clickAreas && this.clickAreas[name]) { // sind die Klickzonen initialisiert und wenn ja, gibt es Klickzonen mit dem Namen?
				delete this.clickAreas[name]; // Löschen
			}
		},
		// verarbeitet einen Klick mit den relativen Koordinatien x und y
		handleClick: function(evt, x, y) {
			var currPriority = -1, // Die erste Priorität
			    zones = []; // Alle Zonen, in die der Klick fällt und die die aktuelle Priorität haben
			
			each(this.clickAreas, function(cz2) {
				each(cz2, function(zone) {
					// Für jede Zone …
					var rect = zone.zone; // … das Rechteck
					if(x >= rect.x
					&& y >= rect.y
					&& x <= rect.x + rect.width
					&& y <= rect.y + rect.height) { // wenn der Punkt (x|y) in dem Rechteck liegt
						if(zone.priority > currPriority) { // Wenn die Zone eine höhere Priorität besitzt
							currPriority = zone.priority; // die aktuelle Priorität wird aktualisiert
							zones = [zone]; // Zonen ist ein neues Array, das nur aus der Zone besteht
						} else if(zone.priority == currPriority) { // Wenn die Zone die gleiche Priorität besitzt
							zones.push(zone); // Zone speichern
						}
					}
				});
			});
			
			var _this = this; // Referenz auf this
			each(zones, function(zone) {
				zone.callback.call(_this, x - zone.zone.x, y - zone.zone.y); // Für jede Zone die Callback-Funktion 
			});
			
			if(zones.length && evt.stopPropagation) {
				evt.stopPropagation();
			}
		}
	};
	
	/***********
	* Bildchen *
	***********/
	
	var makeIcon = function(fn) {
		return function(ctx, x, y, a, color) {
			ctx.save(); // Einstellungen sichern
			ctx.translate(x, y); // Nullpunkt verschieben => Nullpunkt ist in der Mitte
			ctx.scale(a/2, a/2); // Skalieren => von der Mitte bis zur Seite ist es nur 1 lang
			ctx.fillStyle = color; // Füllfarbe setzen
			ctx.strokeStyle = color; // Linienfarbe setzen
			fn(ctx, color);
			ctx.restore(); // Einstellungen wiederherstellen
		};
	};
	
	// Eine Icon-Funktion malt ein Bild in ctx mit Mittelpunkt x, y mit Kantenlänge a und Farbe color
	var icons = {
		questionBubble: function(ctx, x, y, a, color) {
			var r = a/2;
			
			ctx.save();
			ctx.translate(x, y);
			ctx.scale(r, r);
			
			// Kreis
			ctx.beginPath();
			ctx.arc(0, 0, 1, 0, 2 * M.PI, true);
			ctx.fillStyle = color;
			ctx.fill();
			
			ctx.scale(1/r, 1/r); // Muss ausskalieren, da sonst die Browser bei der Schrift Murks machen
			ctx.fillStyle = '#000';
			ctx.globalCompositeOperation = 'destination-out';
			ctx.font = 'bold ' + (1.25 * r) + 'px Helvetica, Arial, sans-serif'; // Schriftart, -Größe und -Stil
			ctx.textAlign = 'center'; // Schrift ist horizontal zentriert am Punkt ausgerichtet
			ctx.textBaseline = 'middle'; // Schrift ist vertikal zentriert am Punkt ausgerichtet
			ctx.fillText('?', 0, .1*r);
			
			ctx.restore();
		},
		eye: makeIcon(function(ctx) {
			// Äußeres Oval
			ctx.beginPath(); // Pfad beginen
			ctx.moveTo(-1, 0); // zur Mitte der linken Kante bewegen
			ctx.quadraticCurveTo(0, -1,  1, 0); // Eine Kurve zur Mitte der rechten Kante
			ctx.quadraticCurveTo(0,  1, -1, 0); // Eine Kurve zur Mitte der linken Kante
			ctx.fill(); // Füllen
			// Innerer Augapfel
			ctx.beginPath(); // Pfad beginnen
			ctx.arc(0, 0, .3, 0, 2 * M.PI, false); // Einen Kreis um das Zentrum zeichnen
			ctx.fillStyle = '#000'; // Füllfarbe setzen
			ctx.globalCompositeOperation = 'destination-out'; // Bereich entfernen (transparent machen)
			ctx.fill(); // Füllen
		}),
		checkmark: makeIcon(function(ctx) {
			ctx.beginPath(); // Pfad beginnen
			ctx.moveTo(-.76, 0); // Ans linke Ende des Hakens bewegen
			ctx.quadraticCurveTo(-.30, .25,  0,  .64); // Kurve zur Spitze des Hakens
			ctx.quadraticCurveTo( .18,   0, .78, -.78); // Kurve zum rechten Ende des Hakens
			ctx.lineWidth = .3; // Strichbreite
			ctx.lineCap = 'square'; // Das Ende einer Linie is eckig
			ctx.stroke(); // Pfad nachzeichnen
		}),
		closedArrow: makeIcon(function(ctx) {
			// Teilkreis
			ctx.beginPath();
			ctx.arc(0, 0, .68, 1, 1.92 * M.PI, false);
			ctx.lineWidth = .3;
			ctx.stroke();
			
			// Pfeilspitze
			ctx.rotate(1.9 * M.PI);
			ctx.translate(.68, 0);
			ctx.beginPath();
			ctx.moveTo(-.4,  0);
			ctx.lineTo( .4,  0);
			ctx.lineTo(  0, .4);
			ctx.fill();
		}),
		bubble: makeIcon(function(ctx, color) {
			// Hintergrund: Verlauf vom Zentrum (Glühen)
			ctx.beginPath();
			ctx.arc(0, 0, 1.4, 0, 2 * M.PI, true); // Kreis
			var gradient = ctx.createRadialGradient(0, 0, 1, 0, 0, 1.4); // Runden Farbverlauf erstellen
			gradient.addColorStop(0, 'rgba(0, 0, 0, .18)'); // Farbe am Anfang des Farbverlaufes: Schwarz, 18% opak
			gradient.addColorStop(1, 'transparent'); // Farbe am Ende: Voll transparentes schwarz
			ctx.fillStyle = gradient; // Füllung: der Farbverlauf
			ctx.fill();
			
			// Kugel
			ctx.beginPath();
			ctx.arc(0, 0, 1, 0, 2 * M.PI, true);
			gradient = ctx.createRadialGradient(-.3, -.3, .03, 0, 0, 1); // Farbverlauf
			gradient.addColorStop(0, color); // Farbe am Anfang: die Farbe
			gradient.addColorStop(1, darker(color)); // Farbe am Ende: die Farbe, abgedunkelt
			ctx.fillStyle = gradient;
			ctx.fill();
		})
	};
	
	
	/*********
	* Modell *
	*********/
	
	// Bewertet eine gesetzte Reihe anhand der Lösung
	function judge(row, solution) {
		// Kopien erstellen, damit Änderungen auf das Array sich nicht außerhalb dieser Funktion auswirken
		row = row.slice();
		solution = solution.slice();
		
		// Anzahl weißer und schwarzer Stecker
		var white = 0,
			black = 0;
		
		// Schwarze Stecker
		var i = row.length; // length-Eigenschaft eines Arrays ist dessen Länge
		while(i) { // Nummern sind wahr, wenn sie ungleich 0 sind
			i--; // i runterzählen
			if(row[i] == solution[i]) { // Diese Position stimmt überein
				black++; // Anzahl der schwarzen Treffer hochzählen
				// Position aus beiden Arrays löschen (=> wird nicht doppelt gezählt)
				row     .splice(i, 1); // splice löscht von der Position i an ein Element
				solution.splice(i, 1); // splice löscht von der Position i an ein Element
			}
		}
		
		// Weiße Stecker
		var i = row.length; // length-Eigenschaft eines Arrays ist dessen Länge
		while(i) { // Nummern sind wahr, wenn sie ungleich 0 sind
			i--; // i runterzählen
			var j = solution.length; // j: Länge der Lösung
			while(j) {
				j--; // j runterzählen
				// Farbe aus erstem Array kommt irgendwo im zweiten Array vor
				if(row[i] == solution[j]) { // Übereinstimmung
					white++; // Anzahl der weißen Treffer hochzählen
					// Diese Positionen löschen
					row     .splice(i, 1); // splice löscht von der Position i an ein Element
					solution.splice(j, 1); // splice löscht von der Position j an ein Element
					break; // innere Schleife beenden
				}
			}
		}
		
		return [black, white]; // Ergebnis als Array zurückgeben
	}
	
	function Model(options) { // Konstruktorfunktion
		this.setOptions(options); // Optionen setzen
	}
	// Instanzmethoden und -Eigenschaften
	Model.prototype = {
		constructor: Model, // Referenz zur Konstruktorfunktion
		
		// Standardoptionen
		options: {
			rows:     8, // Anzahl Reihen
			cols:     4, // Anzahl Spalten
			colors:   6, // Anzahl Farben
			multiple: false // Dürfen Farben in der Lösung doppelt vorkommen?
		},
		
		// Für ein neues Spiel vorbereiten
		reset: function() {
			this.count = 0; // Count-Eigenschaft: Nummer der aktuellen Zeile (beginnt natürlich mit 0)
			this.won   = false; // noch nicht gewonnen.
			this.lost  = false; // aber auch noch nicht verloren.
			
			this.generateSolution(); // Lösung erzeugen
			
			var emptyRow = [];
			times(this.options.cols, function(i) {
				emptyRow[i] = -1;
			}); // Array aus Spalten mal -1 erzeugen, als Vorlage
			
			var guesses = this.guesses = []; // Array mit den bisherigen Versuchen
			// guesses initialisieren: Matrix mit Reihen x Spalten. Für jede Reihe ein Array mit für jeder Spalte den Wert -1
			times(this.options.rows, function(i) { // Reihen mal
				guesses[i] = emptyRow.slice(); // Kopie des Arrays aus -1 hinzufügen
			});
		},
		// Zufällige Farbenkombination, Farben können auch mehrmals vorkommen!
		generateSolution: function() {
			var solution = this.solution = [], // Lösung initialisieren
			    colors   = this.options.colors, // Tipparbeit sparen
			    cols     = this.options.cols; // s.o.
			
			if(this.options.multiple) { // Dürfen Farben mehrmals vorkommen?
				// Ja
				times(cols, function() { // Sooft wie es Spalten gibt …
					solution.push(M.floor(M.random() * colors)); // … soll eine Zufallszahl von 0-1 erzeugt, diese mit der Anzahl der Farben multipliziert und abgerundet werden, bevor sie zum Lösungsarray hinzugefügt wird
				});
			} else {
				// Nein
				
				// Array mit den Farbnummern (0 bis Anzahl der Farben minus 1) erstellen:
				var colorsArray = [];
				times(colors, function(i) {
					colorsArray.push(i);
				});
				
				times(cols, function() { // Sooft wie es Spalten gibt …
					var i = M.floor(M.random() * colorsArray.length); // Eine ganze Zufallszahl von 0 bis zum letzten Index des Farbenarrays generieren
					solution.push(colorsArray[i]); // Farbe an Position der Zufallszahl zur Lösung hinzufügen
					colorsArray.splice(i, 1); // Farbe aus dem Farbenarray Löschen
				});
			}
		},
		nextRow: function() {
			if(this.won || this.lost) { // Spiel schon beendet?
				return; // Funktion verlassen
			}
			
			this.count++; // aktuelle Zeile hochzählen
			
			// Maximalanzahl an Zeilen erreicht?
			if(this.count == this.options.rows) {
				this.lost = true; // Verloren
				this.fireEvent('lose'); // 'lose'-Event feuern
			}
		},
		// Ob die aktuelle Zeile schon vollständig mit Farben bestückt worden ist.
		isRowSet: function() {
			var row = this.guesses[this.count]; // aktuelle Zeile
			var i = row.length;
			while(i) {
				i--;
				if(row[i] < 0) { // Ist die Position i nicht gesetzt?
					return false; // Falschwert zurückgeben
				}
			}
			return true; // Alles gesetzt! (Richtigwert zurückgeben)
		},
		// Farbe color an der Position position in der aktuellen Zeile setzen
		setColor: function(position, color) {
			this.guesses[this.count][position] = color;
		},
		checkRow: function() {
			var result = judge(this.guesses[this.count], this.solution), // Wie viele schwarze und weiße Treffer (Vergleich der aktuellen Zeile mit der Lösung)
			    black  = result[0], // Anzahl schwarz
			    white  = result[1]; // Anzahl weiß
			
			if(black == this.options.cols) { // Gewonnen? (Anzahl der schwarzen Treffer ist gleich der Anzahl der Spalten)
				this.won = true; // Ja!
			}
			
			// Ergebnis melden:
			this.fireEvent('row', black, white); // Event row feuern mit der Anzahl der schwarzen und weißen Treffer als Parameter
			
			// Gewinn melden:
			if(this.won) { // Gewonnen?
				this.fireEvent('win'); // "win"-Event feuern
			}
		}
	};
	mixin(Model.prototype, Options); // Unterstützung von Optionen hinzufügen
	mixin(Model.prototype, Events); // Eventunterstützung hinzufügen
	
	
	/***************
	* Präsentation *
	***************/
	
	function View(model, options) { // Konstruktorfunktion
		this.model = model; // Referenz zum Model in der Instanzvariablen model Speichern
		this.setOptions(options); // Optionen setzen
		this.createInterface(); // Die Benutzeroberfläche aufbauen
	}
	View.prototype = {
		constructor: View, // Referenz von der Instanz zur Konstruktorfunktion
		
		// Optionen
		options: {
			colors: ['#f44', '#4f4', '#ff4', '#4ff', '#fa5', '#ff59e1', '#9d00ce', '#88f'], // Die Farben. Sollte mindestens so lang sein wie die Anzahl der Farben in den Einstellungen des Modells
			ruleWidth: 1, // Breite des Gitters zwischen den Feldern
			ruleColor: '#bbb', // Farbe des Gitters
			gridWidth: 69, // Breite eines Feldes (in Pixeln)
			relativeBubbleRadius: .7, // Durchmesser einer Kugel (relativ zum ganzen Feld)
			backgroundColor: '#eee', // Hintergrundfarbe im eigentlichen Spielfeld
			leftBackgroundColor: '#5B0000', // Hintergrundfarbe links (dort, wo die Zeilennummern oder Treffer stehen)
			bottomBackgroundColor: '#444', // Hintergrundfarbe unten (dort, wo das Ergebnis angezeigt wird und der Knopf zum Neustarten ist)
			numberFont: '30px Georgia, serif', // Schriftgröße und -art der Zeilennummern
			numberColor: '#ffffca', // Die Farbe der Zeilennummern
			iconColor: '#fff', // Die Farbe der Buttons links unten
			relativeIconSize: .75, // Seitenlänge der Knöpfe links unten und zum Akzeptieren einer Zeile relative zum ganzen Feld
			
			// Einstellungen zum Layer, der sich öffnet, wenn man die Farbe auf einem Feld auswählen möchte
			selectTriangleHeight: 16, // Höhe des kleinen Dreiecks, das zum Mittelpunkt des Feldes weist in Pixeln
			selectPadding: 10, // Innenabstand in Pixeln
			selectGridWidth: 50, // Rasterbreite
			selectRelativeBubbleRadius: .8, // Durchmesser einer Kugel, relativ zur Rasterbreite
			selectBorderRadius: 10, // Abrundung des Rands in Pixeln
			selectMargin: 10, // Außenabstand (zum Rand des Spielfeldes)
			selectBackgroundColor: 'rgba(0, 0, 0, 0.6)', // Hintergrundfarbe
			
			questionColor: '#666', // Farbe des verdeckten Erebnisses (die Kreise mit dem Fragezeichen in der Mitte)
			holeColor: '#aaa', // Farbe des Steckplatzes
			relativeHoleRadius: .1, // Radius des Steckplatzes, relativ zur Feldgröße
			
			// Einstellungen zu der Trefferanzeige:
			matchesRelativeWidth: .7, // Welchen Platz nimmt die Trefferanzeige relativ zum ganzen Feld ein
			matchesRelativeRadius: .7, // Radius eines Treffers (relativ, 1 heißt: alle Treffer würden ohne Abstand aneinanderpacken)
			matchesBlackColor: '#ff0', // Farbe für einen "schwarzen" Treffer (gleicher Ort, gleiche Farbe)
			matchesWhiteColor: '#fff', // Farbe für einen "weißen" Treffer (nur gleiche Farbe)

			// Einstellungen zu den eingeblendeten Nachrichten:
			messageFont: '40px Lobster, Palatino, Georgia, serif', // Schriftgröße und -art
			messageColor: '#fff', // Schriftfarbe
			messageGaveUp: 'You gave up', // Nachricht beim Aufgeben
			messageWon: 'We have a winner!', // Nachricht bei Gewinn
			messageLost: 'You\'re a loser!', // Nachricht bei Niederlage
			messageShadowColor: '#fff', // Schriftschattenfarbe
			messageShadowBlur: 20,  // Ungenauigkeit des Schriftschattens in Pixeln
			messageMargin: 10, // minimaler Abstand vom Rand
			messageBackgroundColor: 'rgba(0, 0, 0, 0.5)' // Hintergrundfarbe
		},
		
		// Benutzeroberfläche erstellen
		createInterface: function() {
			this.calculateDimensions(); // Wie groß wird das Feld werden?
			
			this.el = doc.createElement('div'); // Ein div-Element erstellen
			this.el.className      = 'meisterhirn'; // Klasse des Elements: "mastermind"
			this.el.style.position = 'relative'; // Element ist relativ positioniert => Kindelemente können relativ zu diesem Element positioniert werden
			this.el.style.width    = this.width + 'px'; // Breite des Elements auf die mit calculateDimensions errechnete Breite setzen
			this.el.style.height   = this.height + 'px'; // Höhe des Elements auf die mit calculateDimensions errechnete Höhe setzen
			
			this.createBackgroundCanvas(); // Hintergrund erzeugen
			this.createForegroundCanvas(); // Vordergrund erzeugen
		},
		createBackgroundCanvas: function() {
			// Tipparbeit sparen:
			var w    = this.width,
			    h    = this.height,
			    opts = this.options,
			    rw   = opts.ruleWidth,
			    gw   = opts.gridWidth,
			    ww   = rw + gw
			    ctx  = this.background = this.createCanvas(); // neue, leere Zeichenfläche
			
			// Hintergrund malen
			ctx.fillStyle = opts.backgroundColor;
			ctx.fillRect(0, 0, w, h);
			
			// Hintergrund im unteren Bereich (Ergebnis) malen
			ctx.fillStyle = opts.bottomBackgroundColor;
			ctx.fillRect(rw, h - ww, w - 2 * rw, gw);
			
			// Hintergrund im linken Bereich (Zeilennummern, Trefferanzeiger) malen
			ctx.fillStyle = opts.leftBackgroundColor;
			ctx.fillRect(rw, rw, gw, h - gw - 3 * rw);
			
			// Gitter zeichnen
			ctx.fillStyle = opts.ruleColor;
			// Horizontale Gitterlinien zeichnen
			times(this.model.options.rows + 2, function(i) {
				ctx.fillRect(0, i * ww, w, rw);
			});
			// Vertikale Gitterlinien zeichnen
			times(this.model.options.cols + 2, function(i) {
				ctx.fillRect(i * ww, 0, rw, h);
			});
		},
		createForegroundCanvas: function() {
			this.foreground = this.createCanvas(); // Neue leere Zeichenfläche
		},
		
		// Hilfsfunktionen
		// löscht (transparent machen) ein Feld field (mit x, y, width und height) im Vordergrund
		clearField: function(field) {
			this.foreground.clearRect(field.x, field.y, field.width, field.height); // clearRect löscht einen rechteckigen Bereich. Parameter: x, y, width, height
		},
		// Zeichnet einen Knopf mittels "iconFn" im Feld (x|y), fügt die entsprechende Klickzone hinzu (mit dem Namen "clickArea") und feuert beim Klick ein bestimmtes Event
		drawButton: function(iconFn, x, y, clickArea, clickEvent) {
			var field  = this.getField(x, y), // Rechteck des Feldes mit den Koordinaten (x|y)
			    coords = this.getMidpoint(field); // Mittelpunkt des Feldes
			
			// Malen
			this.clearField(field); // Feld löschen
			iconFn(this.foreground, coords[0], coords[1], this.options.gridWidth * this.options.relativeIconSize, this.options.iconColor); // Icon im Vordergrund ausgerichtet am Mittelpunkt des Feldes in der eingestellten Farbe und der eingestellten Größe zeichnen
			
			// Klickbereich
			this.removeClickAreas(clickArea); // Klickzonen mit dem Namen löschen
			var _this = this; // Referenz auf this zur Verwendung in verschachtelten Funktionen speichern
			this.addClickArea(clickArea, field, function() { // Neue Klickzone mit dem Namen clickArea im Rechteck field
				_this.fireEvent(clickEvent); // Event auslösen
			}, 6); // 6 ist die Priorität
		},
		// baut ein Canvas-Element in der Größe des Spielfeldes, fügt es ein und gibt das Zeichenfeld zurück => neuer Layer zum zeichnen
		createCanvas: function() {
			var canvas = doc.createElement('canvas'); // Neues Canvas-Element erzeugen
			canvas.style.position = 'absolute'; // Absolut ausgerichtet => gleiche Position wie Elternelement
			canvas.width  = this.width; // Breite auf die Spielfeldbreite setzen
			canvas.height = this.height; // Höhe auf die Spielfeldhöhe setzen
			this.el.appendChild(canvas); // Ins Dokument als Kindknoten von this.el einfügen
			
			return canvas.getContext('2d'); // Zeichenfläche zurückgeben
		},
		// Zeichnet eine Kugel im Feld (x|y) in der Farbe Nummer color
		drawBubble: function(x, y, color) {
			var a = this.options.gridWidth * this.options.relativeBubbleRadius // Durchmesser
			    field = this.getField(x, y), // Rechteck
			    coords = this.getMidpoint(field); // Rechteckmittelpunkt
		
			this.clearField(field); // Feld löschen
			icons.bubble(this.foreground, coords[0], coords[1], a, this.options.colors[color]); // zeichnen
		},
		// Zeichnet eine verdeckte Kugel im Feld (x|y)
		drawQuestionBubble: function(x, y) {
			var a = this.options.gridWidth * this.options.relativeBubbleRadius // Durchmesser
			    field = this.getField(x, y), // Rechteck
			    coords = this.getMidpoint(field); // Rechtecksmittelpunkt
		
			this.clearField(field); // Feld löschen
			icons.questionBubble(this.foreground, coords[0], coords[1], a, this.options.questionColor); // zeichnen
		},
		// Größen und Positionen berechnen
		calculateDimensions: function() {
			var rows = this.model.options.rows + 1; // Zeilen für das Spielfeld + eine Zeile für das Ergebnis
			this.height = rows * this.options.gridWidth
			              + (rows + 1) * this.options.ruleWidth; // Die Höhe ist die Anzahl der Reihen mal der Rasterbreite plus (die Anzahl der Zeilen plus eins) mal der Gitterbreite
			
			var cols = this.model.options.cols + 1; // Spalten für das Spielfeld + eine Spalte für die Zeilennummern
			this.width = cols * this.options.gridWidth
			             + (cols + 1) * this.options.ruleWidth; // Analog zur Höhe, s.o.
		},
		// Gibt ein Objekt zurück, das mit den Eigenschaften x, y, width und height die Position und Größe des Feldes (x|y)
		getField: function(x, y) {
			var gw = this.options.gridWidth,
			    rw = this.options.ruleWidth;
			return {
				x:      x * gw + (x + 1) * rw, // Die Position ist die Anzahl der vorhergehenden Spalten (x) mal der Gitterbreite plus (die Anzahl der vorhergehenden Spalten plus eins) mal der Gitterbreite
				y:      y * gw + (y + 1) * rw, // Analog, s.o.
				width:  gw, // Die Gitterbreite
				height: gw // s.o.
			};
		},
		// gibt den Mittelpunkt eines Rechtecks, so wie getField eines zurückgibt
		getMidpoint: function(field) {
			var x = field.x + field.width / 2,
			    y = field.y + field.height / 2;
			return [x, y];
		},
		// zeigt eine Nachricht msg, Spielfeld wird wird verdunkelt
		showMessage: function(msg) {
			var ctx = this.message = this.createCanvas(), // neue Zeichenfläche
			    opts = this.options,
			    // Rechteck: ganzes Spielfeld außer der untersten Zeile
			    field = {
			    	x: opts.ruleWidth,
			    	y: opts.ruleWidth,
			    	width: (this.model.options.cols + 1) * (opts.gridWidth + opts.ruleWidth) - opts.ruleWidth,
			    	height: this.model.options.rows * (opts.gridWidth + opts.ruleWidth) - opts.ruleWidth
			    },
			    coords = this.getMidpoint(field);
			ctx.fillStyle    = opts.messageBackgroundColor; // Füllfarbe setzen
			ctx.fillRect(field.x, field.y, field.width, field.height); // damit füllen
			ctx.textAlign    = 'center'; // Text horizontal mittig ausrichten
			ctx.textBaseline = 'middle'; // Text vertikal mittig ausrichten
			ctx.font         = opts.messageFont; // Schriftgröße und -art setzen
			ctx.shadowBlur   = opts.messageShadowBlur; // Schattenunschärfe setzen
			ctx.shadowColor  = opts.messageShadowColor; // Schattenfarbe setzen
			ctx.fillStyle    = opts.messageColor; // Füllfarbe: Schriftfarbe
			ctx.fillText(msg, coords[0], coords[1], this.width - 2 * opts.messageMargin); // Text in der Füllfarbe an die Koordinaten in coords schreiben mit der gesamten Breite minus zweimal dem Abstand als Maximalbreite
		},
		
		// API
		showRestartButton: function() {
			this.drawButton(icons.closedArrow, 0, this.model.options.rows, 'bottomleft', 'restart'); // in der linken unteren Ecke einen kreisförmigen Pfeil zeichnen, bei Klick wird das Event "restart" ausgelöst
		},
		showShowButton: function() {
			this.drawButton(icons.eye, 0, this.model.options.rows, 'bottomleft', 'show'); // analog, s.o.
		},
		showCheckButton: function() {
			this.drawButton(icons.checkmark, 0, this.model.count, 'left', 'check'); // in der aktuellen Zeile links einen Haken malen, bei Klick wird das Event "ckeck" gefeuert
		},
		setBubble: function(position, color) {
			this.drawBubble(position + 1, this.model.count, color); // in der aktuellen Zeile an die Position position eine Kugel in der Farbe Nummer color malen
		},
		drawLineNumbers: function() {
			// Zeilennummern
			var ctx = this.foreground; // Zeichenkontext
			ctx.font         = this.options.numberFont; // Schrift
			ctx.fillStyle    = this.options.numberColor; // Farbe
			ctx.textAlign    = 'center'; // horizontal mittig ausgerichtet
			ctx.textBaseline = 'middle'; // vertikal mittig ausgerichtet
			var _this = this; // Referenz auf this in _this speichern
			times(this.model.options.rows, function(i) { // Für jedes i von 0 bis exklusiv Anzahl der Reihen
				var field  = _this.getField(0, i), // Rechteck links in der Zeile Nummer i
				    coords = _this.getMidpoint(field); // Mittelpunkt
				_this.clearField(field); // Feld löschen
				ctx.fillText(i + 1, coords[0], coords[1]); // Zeilennummer schreiben (i + 1 da normale Leute bei 1 zu zählen beginnen)
			});
		},
		// die Steckplätze malen
		drawHoles: function() {
			var ctx = this.foreground; // Zeichenkontext
			ctx.beginPath(); // Pfad beginnen
			
			var _this = this,
			    radius = this.options.relativeHoleRadius * this.options.gridWidth / 2; // Radius berechnen
			times(this.model.options.rows, function(r) { // Für jede Reihe …
				times(_this.model.options.cols, function(c) { // … und jede Spalte
					var field  = _this.getField(c + 1, r), // das Feld raussuchen
					    coords = _this.getMidpoint(field); // dessen Mittelpunkt
					_this.clearField(field); // Feld löschen
					ctx.moveTo(coords[0], coords[1]); // zum Mittelpunkt bewegen
					ctx.arc(coords[0], coords[1], radius, 0, 2 * M.PI, true); // Kreis zeichnen
				});
			});
			
			ctx.fillStyle = this.options.holeColor; // Füllfarbe
			ctx.fill(); // Füllen
		},
		// Lösung verstecken
		hideSolution: function() {
			// Die Ergebnisanzeige: Versteckt, symbolisiert durch Kreise mit Fragezeichen
			var _this = this;
			times(this.model.options.cols, function(i) { // Für jede Spalte …
				_this.drawQuestionBubble(i + 1, _this.model.options.rows); // in der letzten Zeile an der Position i + 1 (weil die Linke spalte ja die Nummern sind) eine verdeckte Kugel zeichnen
			});
		},
		// Die Lösung anzeigen
		showSolution: function() {
			var _this = this;
			each(this.model.solution, function(color, i) {
				_this.drawBubble(i + 1, _this.model.options.rows, color);
			});
		},
		openSelect: function(i) {
			this.closeSelect(); // Alle evt. offenen Selects schließen
			
			var field  = this.getField(i + 1, this.model.count), // Feld raussuchen: in der aktuellen Zeile, an der Position i + 1 (linke Spalte beachten)
			    coords = this.getMidpoint(field); // Mittelpunkt
			
			var opts = this.options,
			    horizontalSpace = this.width - 2 * (opts.selectPadding + opts.selectMargin),
			    maxCols = M.min(this.model.options.colors, M.floor(horizontalSpace / opts.selectGridWidth)),
			    rows = Math.ceil(this.model.options.colors / maxCols),
			    cols = Math.ceil(this.model.options.colors / rows),
			    w    = 2 * opts.selectPadding + cols * opts.selectGridWidth,
			    h    = 2 * opts.selectPadding + rows * opts.selectGridWidth + opts.selectTriangleHeight; // Breite und Höhe der Select-Blase
			
			// x und y sind die Koordinaten der linken, oberen Ecke
			var x = coords[0] - w / 2; // zentriert
			x = M.min(x, this.width - w - opts.selectMargin); // ragt nicht über den rechten Rand hinaus
			x = M.max(x, opts.selectMargin); // ragt nicht über den linken Rand hinaus
			var y = coords[1];
			
			var ctx = this.select = this.createCanvas(); // Zeichenfläche
			
			var tx = coords[0] - x, // der Abstand von der linken Seite zur Spitze des Dreiecks
			    th = opts.selectTriangleHeight,
			    br = opts.selectBorderRadius;
			
			ctx.save(); // Einstellungen speichern
			ctx.translate(x, y); // der Punkt (x|y) ist nun die linke, obere Ecke
			
			// Das Ding, das so wie eine Sprechblase aussieht
			ctx.beginPath(); // Pfad anfangen
			ctx.moveTo(tx, 0); // Zur Spitze des Dreiecks
			ctx.lineTo(tx + .6 * th, th); // rechte Seite des Dreiecks
			ctx.lineTo(w - br, th); // rechte obere Seite
			ctx.quadraticCurveTo(w, th, w, th + br); // Ecke rechts oben
			ctx.lineTo(w, h - br); // rechte Seite
			ctx.quadraticCurveTo(w, h, w - br, h); // Ecke rechts unten
			ctx.lineTo(br, h); // untere Seite
			ctx.quadraticCurveTo(0, h, 0, h - br); // Ecke links unten
			ctx.lineTo(0, th + br); // linke Seite
			ctx.quadraticCurveTo(0, th, br, th); // Ecke links oben
			ctx.lineTo(tx - .6 * th, th); // linke obere Seite
			ctx.lineTo(tx, 0); // linke Seite des Dreiecks
			
			ctx.fillStyle = opts.selectBackgroundColor; // Füllfarbe setzen
			ctx.fill(); // Füllen
			
			ctx.restore(); // Einstellungen wiederherstellen
			
			// Kugeln malen
			var _this = this,
			    gw = opts.selectGridWidth,
			    pd = opts.selectPadding,
			    r  = gw * opts.selectRelativeBubbleRadius,
			    colors = this.options.colors;
			times(this.model.options.colors, function(j) { // Für jede Farbe eine
				var field = {
					x: x + pd + (j % cols) * gw,
					y: y + th + pd + M.floor(j/cols) * gw,
					width: gw,
					height: gw
				};
				var coords = _this.getMidpoint(field);
				_this.addClickArea('select', field, function() {
					_this.fireEvent('select', i, j); // Für welche Position i welche Farbe j ausgewählt wurde
				}, 9);
				icons.bubble(ctx, coords[0], coords[1], r, colors[j]);
			});
			
			function close() {
				_this.closeSelect(); // diese Auswahl-Blase schließen
				doc.body.removeEventListener('click', close, false);
			}
			
			// Schließbar durch klicken irgendwo im Dokument
			document.body.addEventListener('click', close, false);
			
			// Aber nicht durch klicken in die Blase
			this.addClickArea('bubble', {
				x: x,
				y: y + th, // Nicht der Bereich auf Höhe des Dreicks!
				width: w,
				height: h - th // … deshalb müssen wir die Dreieckshöhe auch von der Gesamthöhe abziehen
			}, function() { /* leere anonyme Funktion */ }, 8);
		},
		closeSelect: function() {
			if(this.select) { // Ist so eine Selectblase eigentlich offen
				// Die in der obigen Funktion definierten Klickbereiche entfernen
				this.removeClickAreas('select');
				this.removeClickAreas('field');
				this.removeClickAreas('bubble');
				var c = this.select.canvas; // Das zur Zeichenfläche korrespondierende Element
				c.parentNode.removeChild(c); // aus dem DOM (Document Object Model) entfernen
				delete this.select; // Referenz auf die Selectblase entfernen
			}
		},
		initRow: function() {
			this.removeClickAreas('left'); // Es kann nicht mehr auf die Stelle geklickt werden, wo der Haken zum Prüfen war
			this.removeClickAreas('row'); // Man kann keine Farben mehr durch Klicken auf die entsprechende Position mehr auswählen
			var y = this.model.count, // aktuelle Zeilennummer
			    _this = this; // Referenz zur Verwendung in einer inneren Funktion:
			times(this.model.options.cols, function(x) { // für jede Spalte
				var field = _this.getField(x + 1, y); // Feld in der aktuellen Zeile und dieser Spalte
				_this.addClickArea('row', field, function() { // und wenn man da hin klickt …
					_this.fireEvent('rowclick', x); // dann wird das Event "rowclick" gefeuert mit der Nummer der Spalte, in die geklickt wurde
				}, 6);
			});
		},
		removeFieldClickAreas: function() {
			this.removeClickAreas('row'); // Man kann nicht mehr auf Felder klicken, um die Farbe auszuwählen
			this.removeClickAreas('left'); // Man kann keine Reihe mehr akzeptieren
		},
		// zeigt in der aktuellen Zeile das Ergebnis (wie viele Kugeln haben die gleiche Farbe und sind am gleichen Ort, wie viele haben nur die gleiche Farbe) an
		showMatches: function(black, white) { // black sind die Volltreffer, white sind die Halbtreffer
			var opts = this.options,
			    a = M.ceil(M.sqrt(this.model.options.cols)); // Seitenlänge im Quadrat in Anzahl von Stiften
			    aw = opts.gridWidth * opts.matchesRelativeWidth, // Seitenlänge des Ergebnisquadrats
			    gw = aw / a, // Welches Quadrat bleibt dem einzelnen Stift?
			    r = gw * opts.matchesRelativeRadius / 2, // Der Radius eines Stiftes innerhalb dieses Quadrates
			    field = this.getField(0, this.model.count), // Das Feld, in dem das Ergebnis gemalt wird
			    coords = this.getMidpoint(field), // Der Mittelpunkt dieses Feldes, in dem die Treffer angezeigt werden
			    ctx = this.foreground; // Da wird drauf gemalt
			
			var position = 0; // Die Position der Kugel
			function draw(color) {
				var col = position % a, // In der wievielten Spalte soll die Kugel gezeichnet werden?
				    row = (position - col) / a, // In der wievielten Zeile soll die Kugel gezeichnet werden?
				    x   = coords[0] - aw / 2 + (col + .5) * gw,
				    y   = coords[1] - aw / 2 + (row + .5) * gw;
				
				ctx.beginPath();
				ctx.arc(x, y, r, 0, 2 * M.PI, false);
				ctx.fillStyle = color;
				ctx.fill();
				
				position++; // nächste Kugel bekommt die nächste Position
			}
			
			this.clearField(field); // Dort wo das Ergebnis gezeichnet werden soll, alles löschen
			// Sooft wie es schwarze Kugeln gibt, eine Kugel in der in den Einstellungen angegebenen Farbe zeichen:
			times(black, function() {
				draw(opts.matchesBlackColor);
			});
			// Sooft wie es weiße Kugeln gibt, eine Kugel in der in den Einstellungen angegebenen Farbe zeichen:
			times(white, function() {
				draw(opts.matchesWhiteColor);
			});
		},
		// Nachrichten zeigen:
		showGaveUpMessage: function() {
			this.showMessage(this.options.messageGaveUp);
		},
		showLostMessage: function() {
			this.showMessage(this.options.messageLost);
		},
		showWonMessage: function() {
			this.showMessage(this.options.messageWon);
		},
		// Die aktuell angezeigte Nachricht verstecken:
		hideMessage: function() {
			if(this.message) { // Nur wenn überhaupt eine Nachricht angezeigt wird.
				var canvas = this.message.canvas; // Das Element, das zur Nachrichten-Zeichenfläche gehört
				canvas.parentNode.removeChild(canvas); // Element aus dem DOM entfernen
				delete this.message; // und die Referenz auf die Zeichenfläche löschen
			}
		},
		// Element-Methoden: Ich baue diese Methoden immer ein, damit ich bei meinen Projekten immer eine einheitliche Methode hat, um an das HTML-Element zu gelangen. Oft will man noch etwas daran verändern, bevor es in den Dokumentbaum eingefügt wird. Abgeguckt vom JS-Framework MooTools
		toElement: function() {
			return this.el;
		},
		// fügt mir das Spiel als Kindknoten von parent in das Dokument ein
		inject: function(parent) {
			parent.appendChild(this.el);
		},
		dispose: function() {
			var parent = this.el.parentNode;
			if(parent) {
				parent.removeChild(this.el);
			}
		}
	};
	mixin(View.prototype, Options);
	mixin(View.prototype, Events);
	mixin(View.prototype, ClickAreas);
	
	
	/************
	* Steuerung *
	************/
	
	// Controller ist die Haupt"klasse" (JS kennt keine Klassen). Diese Klasse erstellt für uns Instanzen von Model und View und vermittelt zwischen diesen mit Events.
	function Controller(modelOptions, viewOptions, autosolver) { // damit wir eigene Optionen für Model und View festlegen können
		this.modelOptions = modelOptions || {}; // Entweder das mitgegebene Objekt oder ein leeres Objekt
		this.viewOptions  = viewOptions  || {}; // s.o.
		
		this.createModel(); // Model erstellen
		this.createView(); // View erstellen
		if(autosolver === undefined) {
			autosolver = 'lib/autosolver.js';
		}
		this.createAutosolver(autosolver); // erstellt einen sogenannten Worker, dem die Ergebnisse mitgeteilt werden und der automatisch das Spiel lösen kann
		
		this.newGame(); // ein neues Spiel starten
	}
	Controller.prototype = {
		constructor: Controller, // Referenz von der Instanz zur Konstruktorfunktion
		
		createModel: function() {
			this.model = new Model(this.modelOptions); // beim Aufruf einer Funktion mit dem new-Operator wird 1. ein neues Objekt erstellt, das von dem prototype-Member der Funktion erbt 2. Das Schlüsselwort this in der Funktion an das neue Objekt gebunden 3. Die Funktion ausgeführt => neue Instanz von Model
			
			// Auf ein paar Events reagieren:
			var _this = this;
			this.model.addEventListener('row', function(black, white) { // wenn eine Zeile bewertet wurde
				if(_this.autosolver) { // wenn die Technik für den Autosolver funktioniert
					_this.autosolver.postMessage(JSON.stringify({
						command: 'row',
						arguments: [_this.model.guesses[_this.model.count], [black, white]]
					})); // teile ihm die Zeile und das Ergebnis mit. JSON.stringify baut mir aus dem Objekt einen String, das Objekt ist eine Art Protokoll, das ich auf die Schnelle erfunden habe für die Kommunikation mit Strings
				}
				_this.view.showMatches(black, white); // das Ergebnis anzeigen
				_this.view.closeSelect(); // möglicherweise offen Farbwahlfenster schließen
				_this.model.nextRow(); // zur nächsten Zeile gehen
				_this.view.initRow(); // die aktuelle Zeile im View initialisieren (z.B. Eventlistener hinzufügen, wenn man in diese Zeile klickt, etc.)
			});
			this.model.addEventListener('win', function() { // wenn der Benutzer gewonnen hat
				_this.view.showWonMessage(); // Nachricht anzeigen
				_this.endGame(); // Spiel beenden
			});
			this.model.addEventListener('lose', function() { // wenn der Benutzer verloren hat
				_this.view.showLostMessage(); // Nachricht anzeigen
				_this.endGame(); // Spiel beenden
			});
		},
		createView: function() {
			this.view = new View(this.model, this.viewOptions); // neuer View
			
			// Auf ein paar Events reagieren:
			var _this = this;
			this.view.addEventListener('show', function() { // Der Benutzer will die Lösung sehen
				if(_this.model.isRowSet()) { // wenn die aktuelle Zeile schon vollständig gesetzt ist …
					_this.model.checkRow(); // … dann überprüf die noch
				}
				_this.view.showGaveUpMessage(); // Nachricht anzeigen, dass der Benutzer aufgegeben hat
				_this.model.lost = true;
				_this.endGame(); // Spiel beenden
			});
			this.view.addEventListener('restart', function() { // Der Benutzer hat auf den Neustarten-Button geklickt
				_this.newGame(); // neues Spiel beginnen
			});
			this.view.addEventListener('select', function(position, color) { // Der Benutzer hat für ein Feld (position) in der aktuellen Reihe eine Farbe Nummer color gewählt
				_this.view.setBubble(position, color); // dann mal die Farbe dahin
				_this.model.setColor(position, color); // im Model die Farbe auch einstellen
				if(_this.model.isRowSet()) { // wenn nun die gesamte Reihe gesetzt ist …
					_this.view.showCheckButton(); // … dann biete dem Benutzer an, die Reihe überprüfen zu lassen
				}
			});
			this.view.addEventListener('rowclick', function(position) { // Der Benutzer hat auf ein Feld in der aktuellen Zeile geklickt
				_this.view.openSelect(position); // Farbwähler öffnen
			});
			this.view.addEventListener('check', function() { // der Benutzer will seine gesetzte Zeile überprüfen lassen
				_this.model.checkRow(); // vom Model überprüfen lassen
			});
		},
		createAutosolver: function(autosolver) {
			if(!win.Worker || !autosolver) { return; }; // Browser unterstützt noch keine WebWorker
			
			this.autosolver = new Worker(autosolver); // Neuer Worker: siehe Datei autosover.js
			this.autosolver.postMessage(JSON.stringify({
				command:   'init',
				arguments: [this.model.options.cols, this.model.options.colors]
			})); // Dem autosolver werden wichtige Einstellungen des Spiels mitgeteilt (Anzahl der Spalten und Farben)
			
			var _this = this;
			// Funktionen, die der Webworker aufrufen kann:
			var commands = {
				log: function() { // Zum Debugging
					if(win.console) { // console stellt Funktionen zum Debugging bereit, ist aber nicht in allen Browsern verfügbar
						console.log.apply(console, arguments); // Alle Parameter, mit denen diese Funktion aufgerufen wurde, in die Debugging-Konsole schreiben
					}
				},
				propose: function(row) { // Worker schlägt eine Kombination vor
					// Die Kombination in Model und View setzen
					each(row, function(color, position) {
						_this.view.setBubble(position, color);
						_this.model.setColor(position, color);
					});
					_this.view.closeSelect(); // evt. offene Farbwahlfenster schließen
					_this.view.showCheckButton(); // dem Benutzer anbieten, die Reihe überprüfen zu lassen
				},
				guess: function() {
					_this.model.checkRow(); // Reihe überprüfen lassen
					_this.view.removeFieldClickAreas(); // Der Benutzer darf nichts tun
					if(!_this.model.won && !_this.model.lost) { // das Spiel ist noch nicht beendet
						_this.autosolver.postMessage(JSON.stringify({
							command: 'guess'
						})); // Der autosolver soll gleich die nächste Reihe vorschlagen
					}
				}
			};
			this.autosolver.addEventListener('message', function(evt) { // wenn diese Datei vom Worker eine Nachricht bekomment
				var obj = JSON.parse(evt.data), // evt.data ist der Inhalt der Nachricht, mit JSON.parse mach ich aus dem Nachricht-String wieder ein Objekt
					command = obj.command, // die Funktion, die hier aufgerufen werden soll
					args = obj.arguments || []; // die Argumente, mit denen die Funktion aufgerufen werden soll
				if(commands[command]) { // die Funktion gibt es hier
					commands[command].apply(commands, args); // aufrufen
				}
			}, false);
		},
		
		newGame: function() { // ein neues Spiel starten
			this.model.reset();
			
			if(this.autosolver) { // Der autosolver existiert
				this.autosolver.postMessage(JSON.stringify({
					command: 'reset'
				})); // Der autosolver kann wieder alle möglichen Kombinationen in Betracht ziehen, da das Spiel neu gestartet wird
			}
			this.view.hideMessage(); // evt. angezeigte Nachrichten verstecken
			this.view.hideSolution(); // Diese Fragezeichen-Kugeln anzeigen
			this.view.drawLineNumbers(); // Zeilennummern zeichnen
			this.view.drawHoles(); // die Steckplätze zeichnen
			this.view.showShowButton(); // der Button zum Zeigen des Ergebnisses
			this.view.initRow(); // Einrichten, was passiert, wenn man in die aktuelle Zeile klickt
		},
		endGame: function() {
			this.view.showRestartButton(); // Einen Button zum Starten eines neuen Spiels einblenden
			this.view.showSolution(); // Die Lösung anzeigen
			this.view.closeSelect(); // evt. offene Farbwahlblasen anzeigen
			this.view.removeFieldClickAreas(); // Nichts passiert mehr, wenn man in das Spielfeld klickt
		},
		
		propose: function() {
			if(!this.autosolver) { return; }; // Browser unterstützt noch keine WebWorker
			if(!this.model.won && !this.model.lost) { // Nur wenn das Spiel noch nicht beendet ist
				this.autosolver.postMessage(JSON.stringify({
					command: 'propose'
				})); // Der autosolver soll mir gefälligst eine Kombination vorschlagen, mit der ich viele Möglichkeiten eliminieren kann
			}
		},
		solve: function() {
			if(!this.autosolver) { return; }; // Browser unterstützt noch keine WebWorker
			if(!this.model.won && !this.model.lost) { // Spiel ist noch nicht beendet
				this.view.removeFieldClickAreas(); // Der Benutzer macht ab jetzt nichts mehr!
				this.autosolver.postMessage(JSON.stringify({
					command: 'guess'
				})); // Der autosolver soll mir eine Kombination vorschlagen, dann das "guess"-Event feuern, woraufhin ihm wieder mitgeteilt wird, dass er die nächste Kombination vorschlagen soll und so weiter bis das Spiel gelöst ist
			}
		},
		
		// Element-Methoden weiterleiten
		toElement: function() {
			return this.view.toElement();
		},
		inject: function(parent) {
			this.view.inject(parent);
		},
		dispose: function() {
			this.view.dispose();
		}
	};
	
	
	return Controller; // Rückgabewert der anonymen Funktion, macht Controller auch extern verfügbar (heißt im globalen Gültigkeitsbereich aber Meisterhirn, siehe Zeile 1
})(window, document, Math); // Ende der anonymen Funktion, sofortiger Aufruf
