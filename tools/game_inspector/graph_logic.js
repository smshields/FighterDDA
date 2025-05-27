// graph_logic.js
// (Ensure Plotly is loaded before this script)

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('jsonFileInput');
    const graphDiv = document.getElementById('plotlyGraph');
    const summaryDiv = document.getElementById('summaryData');
    const hoverDiv = document.getElementById('hoverData');
    const hoverDefaultText = document.getElementById('hoverDefaultText');

    let targetXValue = 0;
    // currentGraphData is not strictly needed anymore with this structure but can be kept for future complex updates
    // let currentGraphData = null; 

    if (fileInput) { // For direct HTML usage
        fileInput.addEventListener('change', handleFileSelect);
    } else if (typeof embeddedData !== 'undefined') { // For generated HTML
        try {
            initGraphWithData(embeddedData);
        } catch (e) {
            displayError("Error processing embedded data: " + e.message, e);
        }
    }

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    initGraphWithData(jsonData);
                } catch (err) {
                    displayError("Error parsing JSON file: " + err.message, err);
                }
            };
            reader.onerror = (e) => {
                displayError("Error reading file: " + e.target.error.name);
            };
            reader.readAsText(file);
        }
    }

    function round(value, decimals = 2) {
        if (value === null || typeof value === 'undefined' || isNaN(parseFloat(value))) return value;
        return Number(Math.round(parseFloat(value) + 'e' + decimals) + 'e-' + decimals).toFixed(decimals);
    }

    function initGraphWithData(jsonData) {
        summaryDiv.innerHTML = '<h3><b>Summary</b></h3><p>Processing data...</p>'; // Clear previous summary/errors
        if(hoverDefaultText) hoverDefaultText.style.display = 'flex'; // Show default hover text
        const hoverInfoList = document.getElementById('hoverInfoList');
        if(hoverInfoList) hoverInfoList.innerHTML = '';


        try {
            const processedGraphData = parseJsonData(jsonData);
            if (processedGraphData) {
                renderGraph(processedGraphData);
                displaySummary(jsonData.endLog, jsonData.initialLog.targetActions, jsonData.timeStepLogs[jsonData.timeStepLogs.length -1].timeStep);
            }
        } catch (e) {
            displayError("Error initializing graph with data: " + e.message, e);
            console.error(e);
        }
    }

    function parseJsonData(jsonData) {
        if (!jsonData || !jsonData.initialLog || !jsonData.timeStepLogs || !jsonData.endLog) {
            throw new Error("Invalid JSON structure: Missing initialLog, timeStepLogs, or endLog.");
        }

        targetXValue = parseFloat(jsonData.initialLog.targetActions);
        if (isNaN(targetXValue)) {
            throw new Error("Invalid targetActions value in initialLog.");
        }

        const player1Data = { x: [], y: [], customdata: [], name: 'Player 1', type: 'scatter', mode: 'lines+markers', line: { color: 'red' }, marker: { size: 5 } };
        const player2Data = { x: [], y: [], customdata: [], name: 'Player 2', type: 'scatter', mode: 'lines+markers', line: { color: 'blue' }, marker: { size: 5 } };

        let lastTotalActions = -Infinity;

        jsonData.timeStepLogs.forEach(log => {
            const currentTimeStep = parseInt(log.timeStep);
            const currentTotalActions = parseInt(log.totalActions);

            if (isNaN(currentTotalActions)) {
                console.warn(`Skipping log at timeStep ${currentTimeStep} due to invalid totalActions: ${log.totalActions}`);
                return; 
            }

            if (currentTotalActions > lastTotalActions) {
                lastTotalActions = currentTotalActions;

                // Player 1
                if (log.player1 && typeof log.player1.currentHP !== 'undefined') {
                    player1Data.x.push(currentTotalActions);
                    player1Data.y.push(round(log.player1.currentHP));
                    player1Data.customdata.push({
                        'Time Step': currentTimeStep,
                        'Player': 'Player 1',
                        'Current HP': round(log.player1.currentHP),
                        'Total Damage Dealt': round(log.player1.totalDamageOut),
                        'HP Ratio': round(log.player1.hpRatio, 3)
                    });
                } else {
                    console.warn(`Missing player1.currentHP at timeStep ${currentTimeStep} for totalActions ${currentTotalActions}`);
                }

                // Player 2
                // Adhering to the new instruction: log.player2.currentHP
                if (log.player2 && typeof log.player2.currentHP !== 'undefined') {
                    player2Data.x.push(currentTotalActions);
                    player2Data.y.push(round(log.player2.currentHP));
                    player2Data.customdata.push({
                        'Time Step': currentTimeStep,
                        'Player': 'Player 2',
                        'Current HP': round(log.player2.currentHP),
                        'Total Damage Dealt': round(log.player2.totalDamageDealt), // Assuming this path exists
                        'HP Ratio': round(log.player2.hpRatio, 3) // Assuming this path exists
                    });
                } else if (log.player2 && typeof log.player2.player2CurrentTotalHealth !== 'undefined'){
                     // Fallback to sample JSON structure if specific currentHP is not present
                    console.warn(`Using player2.player2CurrentTotalHealth as fallback for player2.currentHP at timeStep ${currentTimeStep} for totalActions ${currentTotalActions}`);
                    player2Data.x.push(currentTotalActions);
                    player2Data.y.push(round(log.player2.player2CurrentTotalHealth));
                    player2Data.customdata.push({
                        'Time Step': currentTimeStep,
                        'Player': 'Player 2',
                        'Current HP': round(log.player2.player2CurrentTotalHealth),
                        'Total Damage Dealt': round(log.player2.player2TotalDamageDealt),
                        'HP Ratio': round(log.player2.player2CurrentHPRatio, 3)
                    });
                }
                 else {
                    console.warn(`Missing player2.currentHP (and fallback) at timeStep ${currentTimeStep} for totalActions ${currentTotalActions}`);
                }
            }
        });
        
        return {
            traces: [player1Data, player2Data],
            targetX: targetXValue
        };
    }

    function renderGraph(plotData) {
        const traces = plotData.traces;

        traces.push({
            x: [plotData.targetX],
            y: [0],
            mode: 'markers',
            name: 'Target Game Length', // Updated label
            marker: { symbol: 'triangle-up', size: 15, color: 'black' }, // Updated marker
            hoverinfo: 'skip'
        });

        const layout = {
            title: '<b>Total Player Current HP Over Actions</b>', // Bolded
            xaxis: { title: '<b>Number of Player Actions</b>', automargin: true }, // Bolded
            yaxis: { title: '<b>Current HP</b>', automargin: true, zeroline: true }, // Bolded
            hovermode: 'closest',
            legend: { x: 1.02, y: 1, xanchor: 'left' },
            shapes: [
                {
                    type: 'line',
                    x0: plotData.targetX,
                    y0: 0,
                    x1: plotData.targetX,
                    y1: 1,
                    yref: 'paper',
                    line: { color: 'darkgrey', width: 2, dash: 'dash' }
                }
            ],
            autosize: true,
            paper_bgcolor: '#e0e0e0', // Slightly lighter than body for graph area if needed
            plot_bgcolor: '#ffffff'   // Graph plot area background
        };

        Plotly.newPlot(graphDiv, traces, layout, { responsive: true }).then(gd => {
            gd.on('plotly_hover', (eventData) => {
                if (eventData.points.length > 0) {
                    const point = eventData.points[0];
                    const curveNumber = point.curveNumber;
                    
                    if (traces[curveNumber].name === 'Target Game Length') {
                        Plotly.Fx.hover(graphDiv, []);
                        if(hoverDefaultText) hoverDefaultText.style.display = 'flex';
                        const hoverInfoList = document.getElementById('hoverInfoList');
                        if(hoverInfoList) hoverInfoList.innerHTML = '';

                        const currentShapes = gd.layout.shapes.filter(s => s.name !== 'slopeLine');
                        Plotly.relayout(graphDiv, {shapes: currentShapes});
                        return;
                    }

                    if(hoverDefaultText) hoverDefaultText.style.display = 'none';
                    const hoverInfoList = document.getElementById('hoverInfoList');
                    if(!hoverInfoList) return;

                    hoverInfoList.innerHTML = ''; // Clear previous items

                    const customInfo = point.customdata;
                    for (const key in customInfo) {
                        const li = document.createElement('li');
                        const keySpan = document.createElement('span');
                        keySpan.className = 'key';
                        keySpan.textContent = `${key}:`;
                        const valueSpan = document.createElement('span');
                        valueSpan.className = 'value';
                        valueSpan.textContent = customInfo[key];
                        li.appendChild(keySpan);
                        li.appendChild(valueSpan);
                        hoverInfoList.appendChild(li);
                    }

                    const hoveredX = parseFloat(point.x); // This is totalActions
                    const hoveredY = parseFloat(point.y);
                    let slope = 'N/A';
                    let newShapes = gd.layout.shapes.filter(s => s.name !== 'slopeLine'); 
                                        
                    if (hoveredX <= targetXValue) {
                         if (Math.abs(hoveredX - targetXValue) > 1e-9) { // Avoid division by zero
                            slope = round((hoveredY - 0) / (hoveredX - targetXValue));
                        } else {
                            slope = (hoveredY === 0) ? '0.00 (On Target)' : 'Vertical';
                        }
                        
                        newShapes.push({
                            type: 'line',
                            x0: hoveredX,
                            y0: hoveredY,
                            x1: targetXValue,
                            y1: 0,
                            line: { color: 'grey', width: 1, dash: 'dot' },
                            layer: 'below',
                            name: 'slopeLine'
                        });
                    }
                    
                    const slopeLi = document.createElement('li');
                    const slopeKeySpan = document.createElement('span');
                    slopeKeySpan.className = 'key';
                    slopeKeySpan.textContent = 'Target Action Slope:';
                    const slopeValueSpan = document.createElement('span');
                    slopeValueSpan.className = 'value';
                    slopeValueSpan.textContent = slope;
                    slopeLi.appendChild(slopeKeySpan);
                    slopeLi.appendChild(slopeValueSpan);
                    hoverInfoList.appendChild(slopeLi);
                    
                    Plotly.relayout(graphDiv, { shapes: newShapes });
                }
            });

            gd.on('plotly_unhover', () => {
                if(hoverDefaultText) hoverDefaultText.style.display = 'flex';
                const hoverInfoList = document.getElementById('hoverInfoList');
                if(hoverInfoList) hoverInfoList.innerHTML = '';

                const currentShapes = gd.layout.shapes.filter(s => s.name !== 'slopeLine');
                Plotly.relayout(graphDiv, {shapes: currentShapes});
            });
        });
    }

    function displaySummary(endLog, targetActions, totalTimeStepsFromLogs) {
        const estimatedPlaytime = (3 * parseFloat(endLog.totalActions)) + parseFloat(totalTimeStepsFromLogs);
        
        let summaryHtml = '<h3><b>Summary</b></h3><ul>';
        const summaryItems = {
            'Loser': `Player ${endLog.loser}`,
            'Total Number of Time Steps': endLog.totalTimeSteps,
            'Total Number of Actions': endLog.totalActions,
            'Total Damage Exchanged': round(endLog.totalDamageOut),
            'Number of Lead Changes By Ratio': endLog.numLeadChangesByRatio,
            'Number of Lead Changes By Value': endLog.numLeadChangesByValue,
            'Player 1 to Player 2 Action Ratio': round(endLog.player1To2ActionRatio, 3),
            'Winning Player Remaining HP': round(endLog.winningPlayerRemainingHP),
            'Number of Director Changes': endLog.numDirectorChanges,
            'Average Director Buff': round(endLog.directorStatChangeAverageBuff),
            'Average Director Nerf': round(endLog.directorStatChangeAverageNerf),
            'Estimated Playtime (Seconds)': round(estimatedPlaytime, 0)
        };

        for (const key in summaryItems) {
            summaryHtml += `<li><span class="key">${key}:</span><span class="value">${summaryItems[key]}</span></li>`;
        }
        summaryHtml += '</ul>';
        summaryDiv.innerHTML = summaryHtml;
    }

    function displayError(message, errorObj = null) {
        let errorMessage = `<h3><b>Error</b></h3><p class="error-message">${message}</p>`;
        if (errorObj && errorObj.stack) {
            errorMessage += `<pre class="error-stack">${errorObj.stack}</pre>`;
        }
        summaryDiv.innerHTML = errorMessage; 
        graphDiv.innerHTML = '';
        if(hoverDefaultText) hoverDefaultText.style.display = 'flex';
        const hoverInfoList = document.getElementById('hoverInfoList');
        if(hoverInfoList) hoverInfoList.innerHTML = '';
        console.error(message, errorObj);
    }
});