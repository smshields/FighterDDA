// generate_graph.js
const fs = require('fs');
const path = require('path');

function generateGraphHTML(inputJsonPath, outputHtmlPath) {
    try {
        if (!fs.existsSync(inputJsonPath)) {
            console.error(`Error: Input JSON file not found at ${inputJsonPath}`);
            process.exit(1);
        }

        const jsonDataString = fs.readFileSync(inputJsonPath, 'utf8');
        const jsonData = JSON.parse(jsonDataString); 

        const graphLogicScriptContent = fs.readFileSync(path.join(__dirname, 'graph_logic.js'), 'utf8');
        
        const styleContent = `
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background-color: #6c757d; 
            color: #333; 
        }
        h1 { 
            text-align: center; 
            color: #ffffff; 
            margin-bottom: 30px;
        }
        .container { 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
        }
        /* No .controls div in generated report */
        #plotlyGraph { 
            width: 95%; 
            max-width: 1000px; 
            height: 600px; 
            background-color: #fff; 
            border-radius: 8px; 
            box-shadow: 0 4px 8px rgba(0,0,0,0.15); 
            margin-bottom:20px;
        }
        .info-sections { 
            display: flex; 
            flex-wrap: wrap; 
            justify-content: space-around; 
            width: 95%; 
            max-width: 1000px; 
        }
        .info-box { 
            background-color: #fff; 
            padding: 20px; 
            margin:10px; 
            border-radius: 8px; 
            box-shadow: 0 4px 8px rgba(0,0,0,0.15); 
            flex: 1; 
            min-width: 300px; 
            box-sizing: border-box;
        }
        .info-box h3 { 
            margin-top: 0; 
            margin-bottom: 15px;
            color: #3498db; 
            text-align: center; 
            font-weight: bold;   
        }
        .info-box ul { 
            list-style-type: none; 
            padding: 0; 
        }
        .info-box li { 
            margin-bottom: 10px; 
            line-height: 1.6; 
            display: flex; 
            justify-content: space-between; 
            border-bottom: 1px solid #eee; 
            padding-bottom: 10px;
        }
        .info-box li:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        .info-box li .key { 
            color: #555; 
            font-weight: bold;
            padding-right: 10px;
            text-align: left;
        }
        .info-box li .value {
            text-align: right;
            flex-grow: 1;
        }
         #hoverDefaultText {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100px; 
            font-weight: bold;
            font-size: 1.1em;
            color: #777;
        }
        p.error-message { color: red; font-weight: bold; text-align: center; }
        pre.error-stack { color: red; font-size: 0.8em; white-space: pre-wrap; background-color: #ffebeb; padding: 10px; border-radius: 4px; }
        `;

        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game Log Visualization Report</title>
    <script src="https://cdn.plot.ly/plotly-2.24.1.min.js"></script>
    <style>${styleContent}</style>
</head>
<body>
    <h1>Game Log Visualization Report</h1>
    <p style="text-align:center; color: #f0f0f0;"><em>Generated from: ${path.basename(inputJsonPath)}</em></p>

    <div class="container">
        <div id="plotlyGraph"></div>
        <div class="info-sections">
             <div id="hoverData" class="info-box">
                <h3><b>Hover Details</b></h3>
                <p id="hoverDefaultText">Hover to Inspect Data</p>
                <ul id="hoverInfoList"></ul>
            </div>
            <div id="summaryData" class="info-box">
                <h3><b>Summary</b></h3>
                 <p>Processing data...</p>
            </div>
        </div>
    </div>

    <script>
        const embeddedData = ${JSON.stringify(jsonData)};
    </script>
    <script>
        ${graphLogicScriptContent}
    </script>
</body>
</html>`;

        fs.writeFileSync(outputHtmlPath, htmlContent, 'utf8');
        console.log(`Successfully generated graph report: ${outputHtmlPath}`);

    } catch (error) {
        console.error(`Error generating HTML report: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

const args = process.argv.slice(2);
let inputFile, outputFile;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && i + 1 < args.length) {
        inputFile = args[i + 1];
    } else if (args[i] === '--output' && i + 1 < args.length) {
        outputFile = args[i + 1];
    }
}

if (!inputFile || !outputFile) {
    console.log("Usage: node generate_graph.js --input <path_to_json_file> --output <path_to_output_html_file>");
    process.exit(1);
}

generateGraphHTML(path.resolve(inputFile), path.resolve(outputFile));