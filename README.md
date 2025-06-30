# FighterDDA

An engine to evaluate Dynamic Difficulty Adjustment across different personas of game balancing.

# Getting Started


Bash is recommended (E.G. Linux, Mac, or WSL).

1. Install Node.JS and NPM on your machine. 
2. Clone repository into directory of your choosing.
3. Navigate via CLI to said directory.
4. Run "npm install" to install all dependencies.
5. Use "node main.js" to run a simulation.

To change system modes, you can change constants in the Constants.js - control modes are commented by each setting. you can also change settings in main.js in the simulation initialization.

## Visualisation

The code for producing visualisations of DDA encounters is written in Python and is currently found at tools/RunClustering.py and requires both sklearn and matplotlib packages


# Usage Notes

## DDA Testing and Log Generation

1. JSON logs detailing each simulation will be saved to the "output" folder. The folder name is the timestamp. Each sub-folder indicates what game in the simulation it refers to. The name of the file is the seed used for generation.
2. Major constants that determine simulation behavior can be found in "utils/Constants.js". Please feel free to change these as desired to see what differences you see.

## Visualisation

1. The visualisation process needs DDA encounters to process. It expects these to be stored in the 'output' folder, which each sub folder within output representing a collection of DDA encounters from a single system config. This can be redirected at a different folder by changing the parameter 'runs_folder' at line 27
2. To run a default visualisation run update the 'out_folder_name' parameter at line 28 to the desired output name and run the class. A folder in tools/visuals will be created and populated with expressive range visualisations of every metric pair in 'fight_descriptor_metrics' and visualisations of the first two principal components from applying PCA to the metrics in 'fight_type_metrics', each color coded by both the source folder from /output/ and from the cluster produced by applying K-means to 'fight_type_metric' values for each encounter
3. The metrics used can be adjusted to any others found in the JSON files for each encounter, though you may have to update the value of K, stored at line 29, based on the ideal number of clusters suggested by the elbow plot that is produced by each run
   

# Feature Requests/Bug Fixes

Please feel free to message me directly, add to my issues board on Github, send a carrier pigeon, etc. for any new features/bugfixes you desire.
