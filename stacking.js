const grid = [
	['r', 'g', 'b'],
	['g', 'r', 'b'],
	['b', 'g', 'r']
];

let movements = [];

var robotRow = 0;
var robotCol = 0;  // 0-2 for grid, 3-5 for stack columns
var holding = null;

// Separate stacks for each stackColumn (3 stack columns)
const stackColumns = [[], [], []];

function drawGrid() {
	const gridElement = document.getElementById('grid');
	gridElement.innerHTML = '';

	for (let row = 0; row < grid.length; row++) {
		for (let col = 0; col < grid[0].length; col++) {
			const cell = document.createElement('div');
			cell.classList.add('cell');
			if (row === robotRow && col === robotCol) {
				cell.classList.add('cursor');
			}
			cell.textContent = grid[row][col] || '';
			gridElement.appendChild(cell);
		}
	}

	drawStackColumns();
}

function drawStackColumns() {
	const stackElements = document.querySelectorAll('.stackColumn');

	stackElements.forEach((stackElement, index) => {
		stackElement.innerHTML = '';

		const maxStackHeight = 5;  // Number of visible cells in the stack column

		for (let i = 0; i < maxStackHeight; i++) {
			const cell = document.createElement('div');
			cell.classList.add('stackCell');

			const stackPos = stackColumns[index].length - (maxStackHeight - i);

			if (stackPos >= 0) {
				cell.textContent = stackColumns[index][stackPos];
			} else {
				cell.textContent = '';
			}

			stackElement.appendChild(cell);
		}

		// Place robot cursor in the bottom cell if robot is in this stack column
		if (robotCol === grid[0].length + index) {
			const stackCells = stackElement.querySelectorAll('.stackCell');
			const bottomCell = stackCells[0];  // Last (bottom) cell
			bottomCell.classList.add('cursor');
			bottomCell.textContent = holding || '';  // Show what's held, or leave blank
		}
	});
}

function updateHoldingDisplay() {
	document.getElementById('holding').textContent = holding || 'None';
}

function moveRobot(newRow, newCol) {
	const maxCol = grid[0].length + stackColumns.length - 1;  // 0-2 for grid, 3-5 for stacks

	if (newRow >= 0 && newRow < grid.length) {
		if (newCol >= 0 && newCol <= maxCol) {
			robotRow = newRow;
			robotCol = newCol;
			addToHistory(`Owen Bot moved to (${robotRow}, ${robotCol})`, "move"); // Corrected here

			drawGrid();
		}
	}
}

function handleKeydown(event) {
	switch (event.key) {
		case 'ArrowUp':
			moveRobot(robotRow - 1, robotCol);
			break;
		case 'ArrowDown':
			moveRobot(robotRow + 1, robotCol);
			break;
		case 'ArrowLeft':
			moveRobot(robotRow, robotCol - 1);
			break;
		case 'ArrowRight':
			moveRobot(robotRow, robotCol + 1);
			break;
		case 'Enter':
			pickOrPlace();
			checkForWin();  // Check after any grid update
			break;
	}
}

function addToHistory(description, action) {
	movements.push({ Description: description, Action: action });
}

function pickOrPlace() {
	const gridCols = grid[0].length;

	if (robotCol < gridCols) {
		// Inside the grid
		const currentCell = grid[robotRow][robotCol];

		if (holding === null && currentCell) {
			holding = currentCell;
			grid[robotRow][robotCol] = null;
		} else if (holding !== null && currentCell === null) {
			grid[robotRow][robotCol] = holding;
			holding = null;
		}
	} else {
		// In a stack column (robotCol 3, 4, 5)
		const stackIndex = robotCol - gridCols;

		if (holding === null && stackColumns[stackIndex].length > 0) {
			holding = stackColumns[stackIndex].shift();
			addToHistory(`Owen Bot pick up ${holding} circle`, "Pick")
		} else if (holding !== null) {
			const stack = stackColumns[stackIndex];

			// Send stack and holding to backend to check the rules
			fetch('robot.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ stack, newCircle: holding })
			})
				.then(response => response.json())
				.then(data => {
					if (data.canPlace) {
						stackColumns[stackIndex].unshift(holding);
						addToHistory(`Owen Bot stack ${holding} circle`, "Stack")
						holding = null;
						updateHoldingDisplay();
						drawGrid();
					} else {
						alert(data.message);  // Show why the move is illegal
					}
				})
				.catch(error => {
					console.error('Error checking stacking rules:', error);
				});

		}
	}

	updateHoldingDisplay();
	drawGrid();
}

function checkForWin() {
	const isGridEmpty = grid.every(row => row.every(cell => cell === null));
	if (isGridEmpty) {
		alert('You win! All items are cleared.');
	}
}

function convertToCSV() {
  const header = ['Description', 'Action'];
  const rows = movements.map(item => [
    `"${item.Description}"`, item.Action
  ]);

  const csvContent = [header.join(','), ...rows.map(row => row.join(','))].join('\n');
  
  return csvContent;
}


document.getElementById('create-csv').addEventListener('click', function() {
	const csvContent= convertToCSV();

	// Create a Blob from the CSV content
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8,' });

	// Create an object URL for the Blob
	const objUrl = URL.createObjectURL(blob);

	// Create a link element
	const link = document.createElement('a');

	// Set the href attribute to the object URL
	link.setAttribute('href', objUrl);

	// Set the download attribute with a filename
	link.setAttribute('download', 'File.csv');

	// Trigger the link click to start the download
	link.click();
});

document.addEventListener('keydown', handleKeydown);

drawGrid();
updateHoldingDisplay();
