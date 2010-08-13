var doc = document,
	gameElement = doc.getElementById('g'),
	isIphone = navigator.userAgent.toLowerCase().indexOf('iphone') != -1;
function createControl(text, min, max, dflt) {
	var label = doc.createElement('label');
	label.innerHTML = text + ': ';
	var select = doc.createElement('select');
	select.onchange = update;
	while(min <= max) {
		var option = doc.createElement('option');
		option.innerHTML = min;
		if(min == dflt) option.selected = true;
		select.appendChild(option);
		min++;
	}
	label.appendChild(select);
	return label;
}

var controlsElement = doc.getElementById('c'),
    colsControl = createControl('Columns', 3, 10, 4),
    colorsControl = createControl('Colors', 2, 8, 6);
controlsElement.appendChild(colsControl);
controlsElement.appendChild(doc.createTextNode(' '));
controlsElement.appendChild(colorsControl);

function getSelectValue(label) {
	return parseInt(label.lastChild.options[label.lastChild.selectedIndex].value);
}

var meisterhirn;
function update() {
	if(meisterhirn) meisterhirn.dispose();
	meisterhirn = new Meisterhirn({
		multiple: true,
		cols: getSelectValue(colsControl),
		colors: getSelectValue(colorsControl)
	}, {
		gridWidth: (isIphone) ? 59 : 69,
		selectGridWidth: (isIphone) ? 43: 50
	}, '');
	meisterhirn.inject(gameElement);
	doc.getElementById('w').style.width = meisterhirn.toElement().style.width;
}

update();
