//TODO: Move logging messages here.

class Constants {

    static RNG_SEED = Math.random(); //Seed for reproduction

    static CONSOLE_LOGGING_ENABLED = true; //Are we logging to console
    static JSON_LOGGING_ENABLED = true; //Are we logging to JSON
    static HALT_ON_ERROR = false;

    static BALANCE_MODE = 'difficulty'; //determines type of balancing - inclusion/difficulty
    

    static DEFAULT_PLAYER_AI = 'optimal'; //determines AI of player if not specified
    static PLAYER_1_AI = 'optimal'; //determines AI type of player 1 - optimal, random, suboptimal
    static PLAYER_2_AI = 'optimal'; //determines AI type of player 2 - optimal, random, suboptimal
    static PLAYER_1_AI_RANDOMNESS = 1; //determines chance of diverging from ranked choices (1 = always pick highest ranked)
    static PLAYER_2_AI_RANDOMNESS = 1;
    static PLAYER_1_AI_INVERT_DECISION = false; //switches AI to pick lowest rank option
    static PLAYER_2_AI_INVERT_DECISION = false;


    static MULTI_TARGET_SCALAR = 0.25; //Scales multi-target damage
    static SINGLE_TARGET_SCALAR = 1; //Scales single-target damage
    static HEAL_SCALAR = 0.1; //scales healing 
    static MULTI_HEAL_SCALAR = 0.025; //scales multi-target healing
    static SPEED_SCALAR = 0.1; //scales how fast speed adds to action meter
    static DEFENSE_SCALAR = 1.25; //determines how much defend boosts defense

    //TODO: We should dynamically calculate this based off of min attack/defense?
    static MAX_POSSIBLE_RAW_DAMAGE = 90;
    static MIN_POSSIBLE_RAW_DAMAGE = -90;
    static MAX_POSSIBLE_DAMAGE = 100;
    static MIN_POSSIBLE_DAMAGE = 1;

    //TODO: We should dynamically calculate this based off of defense averages?
    static MAX_POSSIBLE_RAW_HEAL = 100;
    static MIN_POSSIBLE_RAW_HEAL = 10;

    //TODO: We can use these to dynamicall calculate other values.
    static MAX_HP = 100;
    static MIN_HP = 0;

    static ACTION_EXECUTION_INTERVAL = 3; //determines how many timesteps to wait before executing an action

    //TODO: Make this dynamic based on magnitude of balancing needed?
    static DIRECTOR_ACTION_INTERVAL = 30; //Number of timeSteps between each director action

    static CLAMP_STAT_CHANGE = false; //allows us to clamp how much something is buffed/nerfed
    static MAX_BUFF_AMOUNT = 30; //clamps maximum buff
    static MAX_NERF_AMOUNT = 30; //clamps minimum buff

    static TARGET_ACTIONS = 60; //determines the target amount of actions for difficulty
    
    static STAT_FUZZINESS = 20; //scales range of random add/subtract during chracter stat initialization

    static LOW_HEALTH_THRESHOLD = 0.3; //determines when we consider a character to be at low health

    //Sets base, min, max stats of all character types
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

    static PRIEST_NAME = 'priest';

    static PRIEST_HP_MIN = 20;
    static PRIEST_HP_MAX = 80;
    static PRIEST_HP_BASE = 50;

    static PRIEST_ATTACK_MIN = 10;
    static PRIEST_ATTACK_MAX = 20;
    static PRIEST_ATTACK_BASE = 50;

    static PRIEST_MAGIC_ATTACK_MIN = 10;
    static PRIEST_MAGIC_ATTACK_MAX = 20;
    static PRIEST_MAGIC_ATTACK_BASE = 50;

    static PRIEST_DEFENSE_MIN = 50;
    static PRIEST_DEFENSE_MAX = 100;
    static PRIEST_DEFENSE_BASE = 80;

    static PRIEST_MAGIC_DEFENSE_MIN = 50;
    static PRIEST_MAGIC_DEFENSE_MAX = 100;
    static PRIEST_MAGIC_DEFENSE_BASE = 80;

    static PRIEST_SPEED_MIN = 10;
    static PRIEST_SPEED_MAX = 30;
    static PRIEST_SPEED_BASE = 60;

    static PRIEST_LUCK_MIN = 10;
    static PRIEST_LUCK_MAX = 30;
    static PRIEST_LUCK_BASE = 60;

    static ROGUE_NAME = 'rogue';

    static ROGUE_HP_MIN = 20;
    static ROGUE_HP_MAX = 50;
    static ROGUE_HP_BASE = 80;

    static ROGUE_ATTACK_MIN = 10;
    static ROGUE_ATTACK_MAX = 60;
    static ROGUE_ATTACK_BASE = 30;

    static ROGUE_MAGIC_ATTACK_MIN = 10;
    static ROGUE_MAGIC_ATTACK_MAX = 60;
    static ROGUE_MAGIC_ATTACK_BASE = 30;

    static ROGUE_DEFENSE_MIN = 10;
    static ROGUE_DEFENSE_MAX = 60;
    static ROGUE_DEFENSE_BASE = 30;

    static ROGUE_MAGIC_DEFENSE_MIN = 10;
    static ROGUE_MAGIC_DEFENSE_MAX = 60;
    static ROGUE_MAGIC_DEFENSE_BASE = 30;

    static ROGUE_SPEED_MIN = 50;
    static ROGUE_SPEED_MAX = 100;
    static ROGUE_SPEED_BASE = 80;

    static ROGUE_LUCK_MIN = 50;
    static ROGUE_LUCK_MAX = 100;
    static ROGUE_LUCK_BASE = 80;

}

module.exports = Constants;