async function fetchBattleData() {
    try {
        
        const response_nodes = await fetch('nodes.json');
        if (!response_nodes.ok) {
            throw new Error(`HTTP error! status: ${response_nodes.status}`);
        }
        const response_units = await fetch('units.json');
        if (!response_units.ok) {
            throw new Error(`HTTP error! status: ${response_units.status}`);
        }
        const response_meleeNetwork = await fetch('melee_interactions.json');
        if (!response_meleeNetwork.ok) {
            throw new Error(`HTTP error! status: ${response_meleeNetwork.status}`);
        }
        const response_archerNetwork = await fetch('archer_interactions.json');
        if (!response_archerNetwork.ok) {
            throw new Error(`HTTP error! status: ${response_archerNetwork.status}`);
        }
        const response_flierNetwork = await fetch('flier_interactions.json');
        if (!response_flierNetwork.ok) {
            throw new Error(`HTTP error! status: ${response_flierNetwork.status}`);
        }



        nodes = await response_nodes.json();
        console.log("Nodes fetched:", nodes);
        units = await response_units.json();
        console.log("Units fetched:", units);

        meleeNetwork = await response_meleeNetwork.json();
        console.log("meleeNetwork fetched:", meleeNetwork);
        archerNetwork = await response_archerNetwork.json();
        console.log("archerNetwork fetched:", archerNetwork);
        flierNetwork = await response_flierNetwork.json();
        console.log("flierNetwork fetched:", flierNetwork);

    } catch (error) {
        console.error('Error fetching JSON:', error);
    }
}

let deploymentLevel
let nodes
let units

let meleeNetwork
let archerNetwork
let flierNetwork

document.addEventListener('DOMContentLoaded', () => {
    fetchBattleData().then(createBattle);
});
    
function createBattle() {

    // Get HTML elements
    const battlefield = document.getElementById("battlefield");
    const slider = document.getElementById("difficultySlider");
    const sliderValue = document.getElementById("sliderValue");
    const setDifficultyButton = document.getElementById("setDifficultyButton");
    const logTextbox = document.getElementById("logTextbox");
    logTextbox.value = ""

    // Add their listeners
    sliderValue.textContent =  parseInt(slider.value, 10);
    slider.addEventListener("input", function() {
        sliderValue.textContent = slider.value;
    });
    setDifficultyButton.addEventListener("click", function() {
        location.reload();
    });
    

    // Nodes & units
    deploymentLevel = parseInt(slider.value, 10);
    nodes = createNodes(nodes);
    units = createUnits(units, deploymentLevel);

    
    // Networks
    meleeNetwork = createMeleeNetwork(meleeNetwork);
    archerNetwork = createArcherNetwork(archerNetwork);
    flierNetwork = createFlierNetwork(flierNetwork);

    
    // Set CSS variables
    const numberNodes = nodes.length;
    const nodeSizePercentage = 1.8 * 100/Math.sqrt(numberNodes**2);
    let nodeSize = vhToPixels(`${nodeSizePercentage}vh`);
    setCSSVariables(nodeSizePercentage)

    drawAll(nodes, units, meleeNetwork, archerNetwork, flierNetwork, nodeSize)
}


// CREATE functions
function createNodes(nodes) {
    return invertYScale(nodes) 
}

function invertYScale(nodes) {
    const maxY = Math.max(...nodes.map(node => node.y));
    return nodes.map(node => ({
        ...node,
        y: maxY - node.y + 1
    }));
}

function createUnits(units, deploymentLevel) {
    units = units.filter(unit => (unit.min_deployment <= deploymentLevel) & (deploymentLevel <=  unit.max_deployment));
    return units
}

function createMeleeNetwork(meleeNetwork) {
    return meleeNetwork
}

function createArcherNetwork(archerNetwork) {
    return archerNetwork

}

function createFlierNetwork(flierNetwork) {
    return flierNetwork
}

function createPairs(element, list) {
    // Initialize an empty array to store the pairs
    let pairs = [];

    // Loop through each item in the list and create a pair
    list.forEach(item => {
        pairs.push([element, item]);
    });

    return pairs; // Return the array of pairs
}

// HELPER functions
function writeToLog(message) {
    logTextbox.value = `${logTextbox.value}\n${message}`;
    logTextbox.scrollTop = logTextbox.scrollHeight;
}

function vhToPixels(value) {
    // Extract the numerical part from the value (e.g., "30vh" -> 30)
    const numericValue = parseFloat(value);

    // Calculate the pixel equivalent using the window's inner height
    const pixels = (window.innerHeight * numericValue) / 100;
    return pixels;
}


function setCSSVariables(nodeSizePercentage) {
    document.documentElement.style.setProperty('--node-size', `${nodeSizePercentage}vh`);
    document.documentElement.style.setProperty('--unit-size', `${nodeSizePercentage}vh`);
    document.documentElement.style.setProperty('--node-size-highlight', `${nodeSizePercentage*1.2}vh`);
    document.documentElement.style.setProperty('--unit-size-highlight', `${nodeSizePercentage*1.2}vh`);
}


// DRAW functions
function drawAll(nodes, units, meleeNetwork, archerNetwork, flierNetwork, nodeSize){
    
    drawNodes(nodes, units, nodeSize, meleeNetwork, archerNetwork, flierNetwork)
    drawMobileElements(nodes, units, meleeNetwork, archerNetwork, flierNetwork, nodeSize)


    // Create SVG element for lines
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    battlefield.appendChild(svg);


    // Set the focal point to the center of the page
    let maxNodesX = Math.max(...nodes.map(node => node.x)) * nodeSize;
    let maxNodesY = Math.max(...nodes.map(node => node.y)) * nodeSize;
    const focalPointX = maxNodesX / 2;
    const focalPointY = maxNodesY / 2;

    createConnections(svg, nodes, nodeSize, meleeNetwork, "red", nodeSize/10, "", 0, false);
    createConnections(svg, nodes, nodeSize, archerNetwork, "green", nodeSize/10, "10,10", 0, false);
    createConnections(svg, nodes, nodeSize, flierNetwork, "blue", nodeSize/300, "", 0, true, focalPointX, focalPointY, 150);

}

function drawMobileElements(nodes, units, meleeNetwork, archerNetwork, flierNetwork, nodeSize){

    drawUnits(nodes, units, nodeSize, meleeNetwork, archerNetwork, flierNetwork);
    drawUnitsTable(units);
    updateHealthBar(units);
    
}

function drawNodes(nodes, units, nodeSize, meleeNetwork, archerNetwork, flierNetwork) {
    nodes.forEach(node => {
        const div = document.createElement("div");
        div.classList.add("node");
        div.style.left = `${node.x * nodeSize}px`;
        div.style.top = `${node.y * nodeSize}px`;
        div.dataset.nodeId = node.id; // Assign the node ID as a data attribute

        // Drag and drop callbacks
        div.addEventListener("dragover", handleDragOver);
        div.addEventListener("drop", (event) => {handleDrop(event, nodes, units, meleeNetwork, archerNetwork, flierNetwork, nodeSize);});
        div.addEventListener('mouseenter', (event) => {handleNodeHoverHighlightAccessibleUnitsNodes(event, units, meleeNetwork, archerNetwork, flierNetwork);});
        div.addEventListener('mouseleave', handleNodeLeaveHighlight);

        // Click and click callbacks
        div.addEventListener('click', (event) => {handleNodeClick(event, nodes, units, meleeNetwork, archerNetwork, flierNetwork, nodeSize);});

        battlefield.appendChild(div);
    });
}

function drawUnits(nodes, units, nodeSize, meleeNetwork, archerNetwork, flierNetwork) {
    const existingUnits = document.querySelectorAll(".unit-circle");
    existingUnits.forEach(unit => unit.remove());
    units.forEach(unit => {
        const node = nodes.find(n => n.id === unit.node);
        if (!node) return; // Skip if the node is not found

        // Create the circular div for the unit
        const circle = document.createElement("div");
        circle.classList.add("unit-circle", `team-${unit.team}`, `type-${unit.type}`);
        circle.textContent = unit.id;
        circle.setAttribute("draggable", "true"); // Make the unit circle draggable

        // Position the circle at the node's coordinates
        circle.style.left = `${node.x * nodeSize}px`;
        circle.style.top = `${node.y * nodeSize}px`;

        // Set unit ID as a data attribute for reference
        circle.dataset.unitId = unit.id;
        circle.dataset.nodeId = unit.node;
        circle.dataset.type = unit.type;

        // Create a tooltip to show unit details on hover
        const tooltip = document.createElement("div");
        tooltip.classList.add("unit-tooltip");
        tooltip.innerHTML = `
            <strong>ID:</strong> ${unit.id}<br>
            <strong>Team:</strong> ${unit.team}<br>
            <strong>Name:</strong> ${unit.name}<br>
            <strong>Type:</strong> ${unit.type}<br>
            <strong>Attack:</strong> ${unit.attack}<br>
            <strong>Defense:</strong> ${unit.defense}<br>
            <strong>Health:</strong> ${unit.health}<br>
            <strong>Node:</strong> ${unit.node}<br>
            <strong>Deployment:</strong> ${unit.deployment}
        `;
        circle.appendChild(tooltip);
        battlefield.appendChild(circle); // Append the unit circle to the battlefield

        // Drag and drop callbacks
        circle.addEventListener('mouseenter', (event) => {handleNodeHoverHighlightAccessibleUnitsNodes(event, units, meleeNetwork, archerNetwork, flierNetwork);});
        circle.addEventListener('mouseleave', handleNodeLeaveHighlight);
        circle.addEventListener("dragstart", handleDragStart);
        circle.addEventListener("dragover", handleDragOver);
        circle.addEventListener("drop", (event) => {handleDrop(event, nodes, units, meleeNetwork, archerNetwork, flierNetwork, nodeSize);});
        

        // Click and click callback
        circle.addEventListener("click", (event) => {handleUnitClick(event, nodes, units, meleeNetwork, archerNetwork, flierNetwork, nodeSize);});

    });
}

function drawUnitsTable(units) {
    const tableBody = document.querySelector("#unitTable tbody");
    tableBody.innerHTML = ""; // Clear any existing table rows

    units.forEach(unit => {
        const row = document.createElement("tr");

        // Create non-editable cells for each property
        for (let key in unit) {
            const cell = document.createElement("td");
            cell.textContent = unit[key]; // Set the cell content
            row.appendChild(cell); // Append the cell to the row
        }

        tableBody.appendChild(row); // Append the row to the table body
    });
}

function createConnections(svg, nodes, nodeSize, network, color, width, dashArray, lateralOffset, curvedLine, focalPointX, focalPointY, curvatureStrength) {
    network.forEach(pair => {
        const node1 = nodes.find(node => node.id === pair[0]);
        const node2 = nodes.find(node => node.id === pair[1]);
        if (node1 && node2) {
            drawLine(svg, 
                node1.x * nodeSize + nodeSize / 2, node1.y * nodeSize + nodeSize / 2,
                node2.x * nodeSize + nodeSize / 2, node2.y * nodeSize + nodeSize / 2,
                color, width, dashArray, lateralOffset, curvedLine, focalPointX, focalPointY, curvatureStrength
            );
        }
    });
}

function drawLine(svg, x1, y1, x2, y2, color, width, dashArray, lateralOffset = 0, curvedLine = false, curvatureFocalPointX, curvatureFocalPointY, curvatureStrength = 100) {
    if (curvedLine) {
        // If curvedLine is true, use the drawCurvedLine function
        drawCurvedLine(svg, x1, y1, x2, y2, color, width, dashArray, curvatureFocalPointX, curvatureFocalPointY, curvatureStrength);
    } else {
        // Adjust the coordinates by the lateral offset for a straight line
        const adjustedX1 = x1 + lateralOffset;
        const adjustedY1 = y1;
        const adjustedX2 = x2 + lateralOffset;
        const adjustedY2 = y2;

        // Draw a thicker black line as the border
        const borderLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        borderLine.setAttribute("x1", adjustedX1);
        borderLine.setAttribute("y1", adjustedY1);
        borderLine.setAttribute("x2", adjustedX2);
        borderLine.setAttribute("y2", adjustedY2);
        borderLine.setAttribute("stroke", "black");
        borderLine.setAttribute("stroke-width", `${width}`);
        borderLine.setAttribute("stroke-linecap", "round");
        borderLine.setAttribute("stroke-dasharray", dashArray);
        svg.appendChild(borderLine);

        // Draw the colored line on top
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", adjustedX1);
        line.setAttribute("y1", adjustedY1);
        line.setAttribute("x2", adjustedX2);
        line.setAttribute("y2", adjustedY2);
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", `${width/2}`);
        line.setAttribute("stroke-linecap", "round");
        line.setAttribute("stroke-dasharray", dashArray);
        svg.appendChild(line);
    }
}

function drawCurvedLine(svg, x1, y1, x2, y2, color, width, dashArray, focalPointX, focalPointY, curvatureStrength = 100) {
    // Calculate the midpoint of the line
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    // Calculate the direction vector from the focal point to the midpoint
    let directionX = midX - focalPointX;
    let directionY = midY - focalPointY;

    // Normalize the direction vector to get a unit vector
    const length = Math.sqrt(directionX * directionX + directionY * directionY);
    if (length !== 0) { // Avoid division by zero
        directionX /= length;
        directionY /= length;
    }

    // Adjust the control point to bend the line away from the focal point
    const controlX = midX + curvatureStrength * directionX;
    const controlY = midY + curvatureStrength * directionY;

    // Create an SVG path element for the curved line
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
    path.setAttribute("d", d);
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", `${width}`);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-dasharray", dashArray);

    // Draw a thicker black path as the border
    const borderPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    borderPath.setAttribute("d", d);
    borderPath.setAttribute("stroke", "black");
    borderPath.setAttribute("stroke-width", `${width/2}`);
    borderPath.setAttribute("fill", "none");
    borderPath.setAttribute("stroke-dasharray", dashArray);
    svg.appendChild(borderPath);

    // Append the colored curved line
    svg.appendChild(path);
}


// BATTLE STATUS callbacks
function updateHealthBar(units) {
    const healthBar = document.getElementById("healthBar");
    healthBar.innerHTML = ""; // Clear previous content

    // Aggregate health points by team
    const teamHealth = {};
    let totalHealth = 0;

    units.forEach(unit => {
        if (unit.health > 0) {
            if (!teamHealth[unit.team]) {
                teamHealth[unit.team] = 0;
            }
            teamHealth[unit.team] += unit.health;
            totalHealth += unit.health;
        }
    });

    // Create a section for each team
    Object.keys(teamHealth).forEach(team => {
        const healthPercentage = (teamHealth[team] / totalHealth) * 100;
        const teamSection = document.createElement("div");
        teamSection.classList.add("team-section");
        teamSection.style.width = `${healthPercentage}%`;

        // Set a color for each team (you can customize these colors)
        if (team == 1) {
            teamSection.style.backgroundColor = "green";
        } else if (team == 2) {
            teamSection.style.backgroundColor = "orange";
        }

        healthBar.appendChild(teamSection);
    });
}


// HOVER callbacks
function handleNodeHoverHighlightAccessibleUnitsNodes(event, units, meleeNetwork, archerNetwork, flierNetwork) {
    let nodeId;
    let networksToUse = [];

    // Check if the hovered element is a node
    if (event.target.classList.contains('node')) {
        nodeId = parseInt(event.target.dataset.nodeId); // Get the ID of the hovered node
        networksToUse = [meleeNetwork]; // Use only the melee network for nodes
    } else {
        // If the hovered element is a unit, get the unit details
        const unitType = event.target.dataset.type; // Get the type of the hovered unit
        nodeId = parseInt(event.target.dataset.nodeId); // Get the ID of its node

        // Determine which networks to use based on unit type
        if (unitType === 'M') {
            networksToUse = [meleeNetwork];
        } else if (unitType === 'A') {
            networksToUse = [meleeNetwork, archerNetwork];
        } else if (unitType === 'F') {
            networksToUse = [meleeNetwork, flierNetwork];
        }
    }

    // Find and highlight all reachable nodes for each network
    networksToUse.forEach(network => {
        const accessibleNodes = network
            .filter(pair => pair[0] === nodeId || pair[1] === nodeId)
            .map(pair => (pair[0] === nodeId ? pair[1] : pair[0]));

        accessibleNodes.forEach(id => {
            // Check if there is a unit on the current node
            const unitOnNode = units.find(unit => unit.node === id);

            if (unitOnNode) {
                // If a unit is found, highlight the unit circle
                const unitCircleElement = document.querySelector(`[data-unit-id='${unitOnNode.id}']`);
                if (unitCircleElement) {
                    unitCircleElement.classList.add('highlight'); // Add highlight class to the unit circle
                }
            } else {
                // If no unit is found, highlight the node
                const nodeElement = document.querySelector(`[data-node-id='${id}']`);
                if (nodeElement) {
                    nodeElement.classList.add('highlight'); // Add highlight class to the node
                }
            }
        });
    });
}

function handleNodeLeaveHighlight(event) {
    // Remove highlight from all nodes
    document.querySelectorAll('.highlight').forEach(node => {
        node.classList.remove('highlight');
    });
}


// DRAG AND DROP callbacks
let draggedUnitId = null; // Variable to store the ID of the dragged unit --> THIS IS SHARED BETWEEN handleDragStart() and handleDrop()

function handleDragStart(event) {
    draggedUnitId = event.target.dataset.unitId; // Store the ID of the dragged unit
    event.dataTransfer.effectAllowed = "move";

    // Hide the hover text (tooltip)
    const tooltip = event.target.querySelector('.unit-tooltip');
    if (tooltip) {
        tooltip.style.display = 'none'; // Hide the tooltip
}
}

function handleDragOver(event) {
    event.preventDefault(); // Allow dropping by preventing the default behavior
}

function handleDrop(event, nodes, units, meleeNetwork, archerNetwork, flierNetwork, nodeSize) {
    event.preventDefault();
    const targetNodeId = event.target.dataset.nodeId; // Get the ID of the node being dropped on (it can come from the node itself or from a unit that belongs to it)

    if (draggedUnitId && targetNodeId) {
        const draggedUnit = units.find(unit => unit.id == draggedUnitId);
        const draggedUnitNodeIdInt = parseInt(draggedUnit.node);
        const targetNodeIdInt = parseInt(targetNodeId);

        if (draggedUnit) {
            // Check if there is a unit already assigned to the target node
            const targetUnit = units.find(unit => unit.node === targetNodeIdInt); 

            if (targetUnit) {
                if (draggedUnit.team === targetUnit.team) {
                    // Swap the nodes
                    if (networkContainsConnection(meleeNetwork, draggedUnit.node, targetUnit.node) & networkContainsConnection(meleeNetwork, targetUnit.node, draggedUnit.node)){
                        const tempNode = draggedUnit.node;
                        draggedUnit.node = targetUnit.node;
                        targetUnit.node = tempNode;
                        writeToLog(`\nSwapped unit:${draggedUnit.id} <-> unit:${targetUnit.id}`);
                    } else {
                        writeToLog(`\nCannot swap unit:${draggedUnit.id} <-> unit:${targetUnit.id}`);
                    }
                } else {
                    // If not same team, combat
                    units = handleCombat(draggedUnit, targetUnit, draggedUnitNodeIdInt, targetNodeIdInt, units, meleeNetwork, archerNetwork, flierNetwork)}
                
            } else {
                // If no unit is in the target node, simply move the dragged unit to the target node
                handleMoveDrag(draggedUnit, draggedUnitNodeIdInt, targetNodeIdInt, meleeNetwork, archerNetwork, flierNetwork)
            }

            // Redraw the units to update their positions         
            drawMobileElements(nodes, units, meleeNetwork, archerNetwork, flierNetwork, nodeSize);
        }
    }
}

function handleMoveDrag(u, x, y, meleeNetwork, archerNetwork, flierNetwork) {
    console.log('handleMoveDrag')
    const draggedUnitIdInt = parseInt(u.id);
    if (networkContainsConnection(meleeNetwork, x, y)) {
        writeToLog(`\nmove unit ${draggedUnitIdInt} from node:${x} -> node:${y}`)
        u.node = y;
    } else if (u.type === 'F' && networkContainsConnection(flierNetwork, x, y)){
        writeToLog(`\nfly unit ${draggedUnitIdInt} from node:${x} -> node:${y}`)
        u.node = y
    } else {
        writeToLog(`cannot move unit ${draggedUnitIdInt} from node:${x} -> node:${y}`)
    }

    return networkContainsConnection(meleeNetwork, x, y);
}

function networkContainsConnection(network, x, y) {
    return network.some(pair => pair[0] === x && pair[1] === y);
}

// CLICK AND CLICK callbacks
let selectedUnitId = null; // Variable to store the ID of the selected unit

// Function to handle click on a unit
function handleUnitClick(event, nodes, units, meleeNetwork, archerNetwork, flierNetwork, nodeSize) {
    console.log(selectedUnitId)
    // If a unit is already selected and the user clicks on another unit of the same team, swap positions
    if (selectedUnitId) {
        console.log(selectedUnitId)
        const clickedUnitId = event.target.dataset.unitId;
        const clickedUnit = units.find(unit => unit.id == clickedUnitId);
        const selectedUnit = units.find(unit => unit.id == selectedUnitId);
        console.log(clickedUnitId)

        if (clickedUnit && selectedUnit) {
            if (selectedUnit.team === clickedUnit.team) {
                // Swap the nodes
                
                if (networkContainsConnection(meleeNetwork, selectedUnit.node, clickedUnit.node) & networkContainsConnection(meleeNetwork, clickedUnit.node, selectedUnit.node)){
                    const tempNode = selectedUnit.node;
                    selectedUnit.node = clickedUnit.node;
                    clickedUnit.node = tempNode;
                    writeToLog(`\nSwapped unit:${selectedUnit.id} <-> unit:${clickedUnit.id}`);
                } else {
                    writeToLog(`\Cannot swap unit:${selectedUnit.id} <-> unit:${clickedUnit.id}`);
                }
            } else {
                // Different teams: initiate combat
                units = handleCombat(selectedUnit, clickedUnit, selectedUnit.node, clickedUnit.node, units, meleeNetwork, archerNetwork, flierNetwork);
            }
        }
        selectedUnitId = null; // Reset the selected unit after using it
    } else {
        // If no unit is selected, select this unit
        selectedUnitId = event.target.dataset.unitId;
        writeToLog(`\nSelected unit: ${selectedUnitId}`);
    }

    drawMobileElements(nodes, units, meleeNetwork, archerNetwork, flierNetwork, nodeSize);
}

// Function to handle click on a node
function handleNodeClick(event, nodes, units, meleeNetwork, archerNetwork, flierNetwork, nodeSize) {
    if (selectedUnitId) {
        const targetNodeId = parseInt(event.target.dataset.nodeId);
        const selectedUnit = units.find(unit => unit.id == selectedUnitId);

        if (selectedUnit) {
            // Check if there's another unit on the target node
            const targetUnit = units.find(unit => unit.node === targetNodeId);

            if (targetUnit) {
                // If there's a unit on the target node, handle combat or swapping
                if (selectedUnit.team === targetUnit.team) {
                    if (networkContainsConnection(meleeNetwork, selectedUnit.node, clickedUnit.node) & networkContainsConnection(meleeNetwork, clickedUnit.node, selectedUnit.node)){
                        // Friendly unit: swap nodes
                        const tempNode = selectedUnit.node;
                        selectedUnit.node = targetNodeId;
                        targetUnit.node = tempNode;
                        writeToLog(`\nSwapped unit:${selectedUnit.id} <-> unit:${targetUnit.id}`);
                    } else {
                        writeToLog(`\Cannot swap unit:${selectedUnit.id} <-> unit:${clickedUnit.id}`);
                    }
                    
                } else {
                    // Enemy unit: initiate combat
                    units = handleCombat(selectedUnit, targetUnit, selectedUnit.node, targetNodeId, units, meleeNetwork, archerNetwork, flierNetwork);
                }
            } else {
                // No unit on the target node: move the selected unit
                handleMoveDrag(selectedUnit, selectedUnit.node, targetNodeId, meleeNetwork, archerNetwork, flierNetwork);
            }

            selectedUnitId = null; // Reset the selected unit
            console.log('draw')
            drawAll(nodes, units, meleeNetwork, archerNetwork, flierNetwork, nodeSize);
        }
    }
}

// Add click event listeners to units and nodes
function addClickEventListeners() {
    const unitCircles = document.querySelectorAll(".unit-circle");
    unitCircles.forEach(circle => {
        circle.addEventListener("click", handleUnitClick);
    });

    const nodeElements = document.querySelectorAll(".node");
    nodeElements.forEach(node => {
        node.addEventListener("click", handleNodeClick);
    });
}



// COMBAT logic
function handleCombat(u, v, x, y, units, meleeNetwork, archerNetwork, flierNetwork) {
    console.log('handleCombat')
    if (u.team === v.team) {
        writeToLog(`\nswap unit:${u.id} <-> unit:${v.id}`)
        const tempNode = u.node;
        u.node = v.node;
        v.node = tempNode;
        return units;
    }

    if (u.type === 'M') {
        writeToLog(`\nmelee attack unit:${u.id} -> unit:${v.id}`)
        units = handleMeleeDrag(u, v, x, y, units, meleeNetwork, archerNetwork, flierNetwork)
    } else if (u.type === 'A') {
        writeToLog(`\nshoot unit:${u.id} -> unit:${v.id}`)
        units = handleArcherDrag(u, v, x, y, units, meleeNetwork, archerNetwork, flierNetwork)
    } else if (u.type === 'F') {
        writeToLog(`\nflying attack unit:${u.id} -> unit:${v.id}`)
        units = handleFlierDrag(u, v, x, y, units, meleeNetwork, archerNetwork, flierNetwork)
    } else{
        writeToLog(`\ncannot attack unit:${u.id} -> unit:${v.id}`)
    }

    console.log('filter health units')
    return units.filter(u => u.health > 0)
}

function handleMeleeDrag(u, v, x, y, units, meleeNetwork, archerNetwork, flierNetwork) {
    console.log('handleMeleeDrag')
    if (networkContainsConnection(meleeNetwork, x, y)) {
        return handleMeleeCombat(u, v, x, y, units)
    } else {
        writeToLog('cannot attack')
        return units
    } 
}

function handleArcherDrag(u, v, x, y, units, meleeNetwork, archerNetwork, flierNetwork) {
    console.log('handleArcherDrag')
    if (networkContainsConnection(meleeNetwork, x, y)) {
        return handleArcherCombat(u, v, x, y, units)
    } else if (networkContainsConnection(archerNetwork, x, y)) {
        return handleArcherCombat(u, v, x, y, units)
    } else {
        writeToLog('cannot attack')
        return units
    }
}

function handleFlierDrag(u, v, x, y, units, meleeNetwork, archerNetwork, flierNetwork) {
    console.log('handleFlierDrag')
    if (networkContainsConnection(meleeNetwork, x, y)) {
        writeToLog('Flier attacks by land.')
        return handleMeleeCombat(u, v, x, y, units)
    } else if (networkContainsConnection(flierNetwork, x, y)){
        writeToLog('Flier attacks by air.')
        return handleMeleeCombat(u, v, x, y, units)
    } else {
        writeToLog('cannot attack')
        return units
    }
}

function handleMeleeCombat(attacker, defender, x, y, units){
    while (attacker.health > 0 && defender.health > 0) {
        // Attacker attacks first
        let damage = Math.max(1, attacker.attack - defender.defense);
        defender.health -= damage;
        if (defender.health <= 0) {
            writeToLog(`Attacker wins with ${attacker.health} health left.`)
            // Defender is defeated: move attacker to node, remove defender, stop combat
            attacker.node = defender.node
            return units.filter(u => u.id !== defender.id);
        }

        // Defender attacks back
        damage = Math.max(1, defender.attack - attacker.defense);
        attacker.health -= damage;
        if (attacker.health <= 0) {
            writeToLog(`Defender wins with ${defender.health} health left.`)
            // Attacker is defeated: remove attacker, stop combat
            return units.filter(u => u.id !== attacker.id);
        }
    }
}

function handleArcherCombat(attacker, defender, x, y, units){
    let damage = Math.max(1, attacker.attack - defender.defense);
    writeToLog(`Archer deals ${damage} damage.`)
    defender.health -= damage;
    if (defender.health <= 0) {
        writeToLog('Archer kills target.')
        // Defender is defeated
        units = units.filter(u => u.id !== defender.id);
    } else {
        writeToLog(`Target has ${defender.health} health left.`)
    }
    return units
}


// Instructions Modal
document.getElementById("instructionsButton").addEventListener("click", function() {
    const modal = document.getElementById("instructionsModal");
    const instructionsText = document.getElementById("instructionsText");

    instructionsText.innerHTML = `
        Welcome to Battle! This is a tactics battlefield game where two or more teams clash in a turn-based battle until one side has no units left. Each team is controlled by one human player, in a shared PC or tablet, just like a tabletop game. The players can decide on a different victory condition and some maps propose ideas. Master your strategy, plan your moves, and outwit your opponent to emerge victorious!<br><br>

        <strong>Objective</strong><br>
        The aim of the game is to eliminate all enemy units and be the last team standing. Each unit has attributes that define its strength and behavior on the battlefield, including attack, defense, health, and type. Utilize each unit’s abilities wisely to gain the upper hand.<br><br>


        <strong>Game Mechanics</strong><ul>
        <li><strong>Define rules:</strong> Players should set some game rules beforehand: who starts playing first, how many units per turn can each team move, can the units move and shoot, can you use two actions in a single unit to move it two times, special victory conditions, etc
        <li><strong>Select difficulty/deployment level:</strong>  Each level has usually various levels of difficulty. 1 will be easier for the green, 3 will be easier for the orange. This controls how many units are deployed for each team ("deployment level" in the table)
        <li><strong>Taking Turns:</strong> Players alternate turns, moving the allow number of units as specified in the first point "Define rules" by drag and dropping them. Notice the drawn networks and the type of unit to know where to move, but if you hover your mouse, the nodes where your unit can move or attack will be highlighted as a hint.
        <li><strong>Dragging and Dropping Units:</strong><ul>
          <li>Drag a unit to a valid new node to reposition it.
          <li>If the target node is empty, your unit moves to occupy it.
          <li>If a friendly unit occupies the target node, they swap places.
          <li>If the target node has an enemy, combat occurs according to the type of the attacking unit.<br><br>
          </ul>
        </ul>

        <strong>Unit Attributes:</strong><ul>
           <li><strong>Attack:</strong> How much damage (in health points) the unit inflicts when attacking.
           <li><strong>Defense:</strong> How many damage points the unit can substract from incoming attacks.
           <li><strong>Health:</strong> The unit's life points. If this reaches 0, the unit is defeated.
           <li><strong>Type:</strong> Units can be of type "M" (Melee), "A" (Archer), or "F" (Flier), which determine their movement and attack capabilities.<br><br>
        </ul>
        <strong>Types of Units:</strong><ul>
           <li><strong>Melee Units (M) (red ring and network):</strong> Move and attack using the Melee Network (solid red lines). If you drag a melee unit to an enemy, a fight to the death begins, with attacks alternating until one unit is defeated. The attacker strikes first, dealing damage as (attacker's attack - defender's defense), with a minimum of 1 damage. If the attacker wins, it takes the place of the defeated defender.
           <li><strong>Archer Units (A) (green ring and network):</strong> Move using the Melee Network and attacks using both the Melee the Archer Network (dashed green lines). When dragged to an enemy, an archer performs a single shot, dealing damage once with the previous formula without receiving damage in return.
           <li><strong>Flier Units (F) (blue ring and network):</strong> Move and attack like melee units but can use both the Melee and the Flier Network (fine curved blue lines). Fliers can move more freely across the battlefield.<br><br>
        </ul>


        <strong>Strategies</strong><br>
        Use melee units to engage directly and be aggresive, archers for ranged attacks to whittle the enemy down without taking damage, and fliers for superior mobility. Plan carefully and outmaneuver your opponent to win!
    `;
    modal.style.display = "flex";
});

document.getElementById("closeInstructionsModal").addEventListener("click", function() {
    document.getElementById("instructionsModal").style.display = "none";
});

// Map Info Modal
document.getElementById("mapInfoButton").addEventListener("click", function() {
    const modal = document.getElementById("mapInfoModal");
    const mapInfoText = document.getElementById("mapInfoText");

    mapInfoText.innerHTML = `
        Welcome to Greystone Pass! The evil Lich King's army is marching towards the Valley of Dragons and all efforts to stop them by the Order of the Dragon Knights have been in vain.<br><br>

        Gather your knights at the Greystone Pass to ambush the advancing army before they can reach castle Tarn. Protect your knights in the peaks (light grey) and attack where the enemy is most vulnerable. Beware the Lich King, because it can cast deadly ranged magic attacks!<br><br>

        Optional victory condition: don't let more than 3 units (apart from the Lich King) reach the south end of the map.<br><br>

        Hardcore victory condition: don't let any unit other than the Lich King reach the south end of the map.
    `;
    modal.style.display = "flex";
});

document.getElementById("closeMapInfoModal").addEventListener("click", function() {
    document.getElementById("mapInfoModal").style.display = "none";
});


