# FighterDDA

An engine to evaluate Dynamic Difficulty Adjustment across different personas of game balancing.

# Getting Started

Bash is recommended (E.G. Linux, Mac, or WSL).

1. Install Node.JS and NPM on your machine. 
2. Clone repository into directory of your choosing.
3. Navigate via CLI to said directory.
4. Run "npm install" to install all dependencies.
5. Use "node main.js" to run a simulation.

# Usage Notes

1. JSON logs detailing each simulation will be saved to the "output" folder. The folder name is the timestamp. Each sub-folder indicates what game in the simulation it refers to. The name of the file is the seed used for generation. NOTE: I've gotten the structure correct, but I'm still seeing bad data being output - I'll update when I fix this issue.
2. Major constants that determine simulation behavior can be found in "utils/Constants.js". Please feel free to change these as desired to see what differences you see (this may not be effective for data analysis until I fix logging output)
3. The 'Inclusion' mode is currently not working - once I fix logging issues I will tackle this next.

# Feature Requests/Bug Fixes

Please feel free to message me directly, add to my issues board on Github, send a carrier pigeon, etc. for any new features/bugfixes you desire.