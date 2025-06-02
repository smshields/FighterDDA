/** Defines starting parameters for system.
 * 
 * TODO - Refactoring:
 * - New file: Config - most parameter inputs should move to it's own file(s)
 *
 * 
 * TODO - Features:
 * - Put logging messages here
 * - Dynamic Clamps - we should be able to calculate a lot of clamp values based off of base character settings
 * */
class Constants {

    static RNG_SEED = 123; //Seed for reproduction
    static OUTPUT_DIRECTORY = './output';
    static MAX_GAME_LENGTH_SECONDS = 1800; //Approximation, 1 timeStep is 1 second, 1 Action is 6 seconds, players take actions concurrently so divide by 2

    //Logging Setup
    static CONSOLE_LOGGING_ENABLED = true; //Are we logging to console
    static JSON_LOGGING_ENABLED = true; //Are we logging to JSON
    static HALT_ON_ERROR = false;
    static ERROR_CONSOLE_FORMATTING = "\x1b[31m%s\x1b[0m";
    static DIRECTOR_CONSOLE_FORMATTING = "\x1b[36m%s\x1b[0m";
    static ACTION_CONSOLE_FORMATTING = "\x1b[34m%s\x1b[0m";
    static CHARACTER_KILLED_CONSOLE_FORMATTING = "\x1b[35m%s\x1b[0m";
    static GAME_OVER_CONSOLE_FORMATTING = "\x1b[32m%s\x1b[0m";

    //Action Queue Configuration
    static ACTION_EXECUTION_INTERVAL = 3; //determines how many timesteps to wait before executing an action

    //Director Configuration
    static DIRECTOR_ACTION_TYPES = ['buff', 'nerf', 'heal', 'damage', 'environment buff', 'environment nerf'];
    static BALANCE_MODE = 'difficulty'; //determines type of balancing - inclusion/difficulty
    static DIRECTOR_ACTION_INTERVAL = 6; //Number of timeSteps between each director action   
    //ALLOWED RANGE: 25 - 250 (maps from 3 to 30 minutes)
    static TARGET_ACTIONS = 1; //determines the target amount of actions for difficulty
    static CLAMP_STAT_CHANGE = false; //allows us to clamp how much something is buffed/nerfed
    static MAX_BUFF_AMOUNT = 30; //clamps maximum buff
    static MAX_NERF_AMOUNT = 30; //clamps minimum buff
    static DIFFICULTY_BALANCE_MODE = 'environment'; //player = adjust player character stats for difficulty condition, environment = adjust scalars
    static HP_DAMAGE_ADJUSTMENT_SCALAR = .5;

    //Player AI Configuration
    static DEFAULT_PLAYER_AI = 'optimal'; //determines AI of player if not specified
    static PLAYER_1_AI = 'optimal'; //determines AI type of player 1 - optimal, random, suboptimal
    static PLAYER_2_AI = 'optimal'; //determines AI type of player 2 - optimal, random, suboptimal
    static PLAYER_1_AI_RANDOMNESS = true; //true = weighted random, false = always top of array
    static PLAYER_2_AI_RANDOMNESS = true;
    static LOW_HEALTH_THRESHOLD = 0.3; //determines when we consider a character to be at low health
    static RANDOM_PLAYER_AI_MODE = 'random';
    static GRIEFER_PLAYER_AI_MODE = 'griefer';
    static OPTIMAL_PLAYER_AI_MODE = 'optimal';
    

    //Names of action types
    static ATTACK_ACTION_TYPE = 'attack';
    static MULTI_ATTACK_ACTION_TYPE = 'multi_attack';
    static DEFEND_ACTION_TYPE = 'defend';
    static MAGIC_ATTACK_ACTION_TYPE = 'magic_attack';
    static MULTI_MAGIC_ATTACK_ACTION_TYPE = 'multi_magic_attack';
    static HEAL_ACTION_TYPE = 'heal';
    static MULTI_HEAL_ACTION_TYPE = 'multi_heal';

    //Stat scaling configuration - TODO: config/constant changes
    //move dynamic scalar management/storage to gamestate

    static BASE_SINGLE_TARGET_SCALAR = .4;
    static SINGLE_TARGET_SCALAR = .4; //Scales single-target damage
    
    static MIN_SINGLE_TARGET_SCALAR = .1;
    static MAX_SINGLE_TARGET_SCALAR = 5;

    static BASE_MULTI_TARGET_SCALAR = 0.1;
    static MULTI_TARGET_SCALAR = 0.1; //Scales multi-target damage
    
    static MIN_MULTI_TARGET_SCALAR = .025;
    static MAX_MULTI_TARGET_SCALAR = 1.25;



    static BASE_HEAL_SCALAR = 1.2;
    static HEAL_SCALAR = 1.2; //scales healing
    
    static MIN_HEAL_SCALAR = .1;
    static MAX_HEAL_SCALAR = 5;

    static BASE_MULTI_HEAL_SCALAR = 0.3;
    static MULTI_HEAL_SCALAR = 0.3; //scales multi-target healing
    
    static MIN_MULTI_HEAL_SCALAR = 0.025;
    static MAX_MULTI_HEAL_SCALAR = 1.25;

    static DEFENSE_SCALAR = 1.25; //determines how much defend boosts defense

    static SPEED_SCALAR = 0.1; //scales how fast speed adds to action meter

    static DIRECTOR_CHANGE_SCALAR = .5;


    //Damage Clamp configuration
    static MAX_POSSIBLE_RAW_DAMAGE = 90;
    static MIN_POSSIBLE_RAW_DAMAGE = -90;
    static MAX_POSSIBLE_DAMAGE = 100;
    static MIN_POSSIBLE_DAMAGE = 1;
    static MAX_POSSIBLE_RAW_HEAL = 100;
    static MIN_POSSIBLE_RAW_HEAL = 10;
    static MAX_HP = 100;
    static MIN_HP = 0;

    //Character Initialization Configuration
    static STAT_FUZZINESS = 20; //scales range of random add/subtract during chracter stat initialization

    //Warrior Configuration

    //TODO: Double check base stats
    static WARRIOR_NAME = 'warrior';
    static WARRIOR_HP_MIN = 50;
    static WARRIOR_HP_MAX = 100;
    static WARRIOR_HP_BASE = 80;

    static WARRIOR_ATTACK_MIN = 50;
    static WARRIOR_ATTACK_MAX = 100;
    static WARRIOR_ATTACK_BASE = 80;

    static WARRIOR_MAGIC_ATTACK_MIN = 10;
    static WARRIOR_MAGIC_ATTACK_MAX = 50;
    static WARRIOR_MAGIC_ATTACK_BASE = 20;

    static WARRIOR_DEFENSE_MIN = 50;
    static WARRIOR_DEFENSE_MAX = 100;
    static WARRIOR_DEFENSE_BASE = 80;

    static WARRIOR_MAGIC_DEFENSE_MIN = 10;
    static WARRIOR_MAGIC_DEFENSE_MAX = 50;
    static WARRIOR_MAGIC_DEFENSE_BASE = 20;

    static WARRIOR_SPEED_MIN = 20;
    static WARRIOR_SPEED_MAX = 80;
    static WARRIOR_SPEED_BASE = 50;

    static WARRIOR_LUCK_MIN = 10;
    static WARRIOR_LUCK_MAX = 60;
    static WARRIOR_LUCK_BASE = 30;

    //Mage Configuration
    static MAGE_NAME = 'mage';

    static MAGE_HP_MIN = 50;
    static MAGE_HP_MAX = 100;
    static MAGE_HP_BASE = 80;

    static MAGE_ATTACK_MIN = 10;
    static MAGE_ATTACK_MAX = 50;
    static MAGE_ATTACK_BASE = 20;

    static MAGE_MAGIC_ATTACK_MIN = 50;
    static MAGE_MAGIC_ATTACK_MAX = 100;
    static MAGE_MAGIC_ATTACK_BASE = 80;

    static MAGE_DEFENSE_MIN = 10;
    static MAGE_DEFENSE_MAX = 50;
    static MAGE_DEFENSE_BASE = 20;

    static MAGE_MAGIC_DEFENSE_MIN = 50;
    static MAGE_MAGIC_DEFENSE_MAX = 100;
    static MAGE_MAGIC_DEFENSE_BASE = 80;

    static MAGE_SPEED_MIN = 20;
    static MAGE_SPEED_MAX = 80;
    static MAGE_SPEED_BASE = 50;

    static MAGE_LUCK_MIN = 10;
    static MAGE_LUCK_MAX = 60;
    static MAGE_LUCK_BASE = 30;

    //Priest Configuration
    static PRIEST_NAME = 'priest';

    static PRIEST_HP_MIN = 20;
    static PRIEST_HP_MAX = 80;
    static PRIEST_HP_BASE = 50;

    static PRIEST_ATTACK_MIN = 10;
    static PRIEST_ATTACK_MAX = 40;
    static PRIEST_ATTACK_BASE = 20;

    static PRIEST_MAGIC_ATTACK_MIN = 10;
    static PRIEST_MAGIC_ATTACK_MAX = 40;
    static PRIEST_MAGIC_ATTACK_BASE = 20;

    static PRIEST_DEFENSE_MIN = 50;
    static PRIEST_DEFENSE_MAX = 100;
    static PRIEST_DEFENSE_BASE = 80;

    static PRIEST_MAGIC_DEFENSE_MIN = 50;
    static PRIEST_MAGIC_DEFENSE_MAX = 100;
    static PRIEST_MAGIC_DEFENSE_BASE = 80;

    static PRIEST_SPEED_MIN = 10;
    static PRIEST_SPEED_MAX = 60;
    static PRIEST_SPEED_BASE = 30;

    static PRIEST_LUCK_MIN = 10;
    static PRIEST_LUCK_MAX = 60;
    static PRIEST_LUCK_BASE = 30;

    //Rogue Configuration
    static ROGUE_NAME = 'rogue';

    static ROGUE_HP_MIN = 40;
    static ROGUE_HP_MAX = 80;
    static ROGUE_HP_BASE = 60;

    static ROGUE_ATTACK_MIN = 10;
    static ROGUE_ATTACK_MAX = 60;
    static ROGUE_ATTACK_BASE = 40;

    static ROGUE_MAGIC_ATTACK_MIN = 10;
    static ROGUE_MAGIC_ATTACK_MAX = 60;
    static ROGUE_MAGIC_ATTACK_BASE = 40;

    static ROGUE_DEFENSE_MIN = 10;
    static ROGUE_DEFENSE_MAX = 60;
    static ROGUE_DEFENSE_BASE = 40;

    static ROGUE_MAGIC_DEFENSE_MIN = 10;
    static ROGUE_MAGIC_DEFENSE_MAX = 60;
    static ROGUE_MAGIC_DEFENSE_BASE = 40;

    static ROGUE_SPEED_MIN = 50;
    static ROGUE_SPEED_MAX = 100;
    static ROGUE_SPEED_BASE = 80;

    static ROGUE_LUCK_MIN = 50;
    static ROGUE_LUCK_MAX = 100;
    static ROGUE_LUCK_BASE = 80;

    static generateNewSeed() {
        this.RNG_SEED = Math.random();
    }



}

module.exports = Constants;