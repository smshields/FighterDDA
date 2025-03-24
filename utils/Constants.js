class Constants {

    static RNG_SEED = 210583;

    static MULTI_TARGET_SCALAR = 0.1; //Scales multi-target damage
    static SINGLE_TARGET_SCALAR = 0.4; //Scales single-target damage
    static HEAL_SCALAR = 0.2; //scales healing 
    static MULTI_HEAL_SCALAR = 0.05; //scales multi-target healing
    static SPEED_SCALAR = 0.1; //scales how fast speed adds to action meter
    static DEFENSE_SCALAR = 1.25; //determines how much defend boosts defense

    static MAX_BUFF_AMOUNT = 30; //clamps maximum buff
    static MAX_NERF_AMOUNT = 30; //clamps minimum buff

    static DIFFICULTY_ADJUSTMENT_SCALAR = 0.001; //scales difficulty scalar against balance direction/magnitude

    static STAT_FUZZINESS = 20; //scales how much to add/subtract during chracter stat initialization

    //Sets base, min, max stats of all character types
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
    static WARRIOR_BASE = 20;

    static WARRIOR_SPEED_MIN = 20;
    static WARRIOR_SPEED_MAX = 80;
    static WARRIOR_SPEED_BASE = 50;

    static WARRIOR_LUCK_MIN = 10;
    static WARRIOR_LUCK_MAX = 60;
    static WARRIOR_LUCK_BASE = 30;

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