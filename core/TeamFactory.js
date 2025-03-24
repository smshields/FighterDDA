const Character = require('./Character'); // Assuming Character is in a separate file
const Constants = require('../utils/Constants');   // Assuming Constants is in a separate file

class TeamFactory {
  /**
   * Creates a team of characters.
   * @param {number} playerNumber The player number for the team.
   * @returns {object} An object containing the team's characters.
   */
  createTeam(playerNumber) {
    return {
      characters: [
        new Character(playerNumber, "warrior", {
          HP: Constants.WARRIOR_HP_BASE,
          Attack: Constants.WARRIOR_ATTACK_BASE,
          Defense: Constants.WARRIOR_DEFENSE_BASE,
          MagicAttack: Constants.WARRIOR_MAGIC_ATTACK_BASE,
          MagicDefense: Constants.WARRIOR_MAGIC_DEFENSE_BASE,
          Speed: Constants.WARRIOR_SPEED_BASE,
          Luck: Constants.WARRIOR_LUCK_BASE
        }, [{
          type: 'attack',
          scalar: Constants.SINGLE_TARGET_SCALAR,
          multiTarget: false
        }, {
          type: 'multi_attack',
          scalar: Constants.MULTI_TARGET_SCALAR,
          multiTarget: true
        }, {
          type: 'defend',
          scalar: 0,
          multiTarget: false
        }]),
        new Character(playerNumber, "mage", {
          HP: Constants.MAGE_HP_BASE,
          Attack: Constants.MAGE_ATTACK_BASE,
          Defense: Constants.MAGE_DEFENSE_BASE,
          MagicAttack: Constants.MAGE_MAGIC_ATTACK_BASE,
          MagicDefense: Constants.MAGE_MAGIC_DEFENSE_BASE,
          Speed: Constants.MAGE_SPEED_BASE,
          Luck: Constants.MAGE_LUCK_BASE
        }, [{
          type: 'magic_attack',
          scalar: Constants.SINGLE_TARGET_SCALAR,
          multiTarget: false
        }, {
          type: 'multi_magic_attack',
          scalar: Constants.MULTI_TARGET_SCALAR,
          multiTarget: true
        }, {
          type: 'defend',
          scalar: 0,
          multiTarget: false
        }]),
        new Character(playerNumber, "priest", {
          HP: Constants.PRIEST_HP_BASE,
          Attack: Constants.PRIEST_ATTACK_BASE,
          Defense: Constants.PRIEST_DEFENSE_BASE,
          MagicAttack: Constants.PRIEST_MAGIC_ATTACK_BASE,
          MagicDefense: Constants.PRIEST_MAGIC_DEFENSE_BASE,
          Speed: Constants.PRIEST_SPEED_BASE,
          Luck: Constants.PRIEST_LUCK_BASE
        }, [{
          type: 'heal',
          scalar: Constants.HEAL_SCALAR,
          multiTarget: false
        }, {
          type: 'multi_heal',
          scalar: Constants.MULTI_HEAL_SCALAR,
          multiTarget: true
        }, {
          type: 'attack',
          scalar: Constants.SINGLE_TARGET_SCALAR,
          multiTarget: false
        }, {
          type: 'magic_attack',
          scalar: Constants.SINGLE_TARGET_SCALAR,
          multiTarget: false
        }, {
          type: 'defend',
          scalar: 0,
          multiTarget: false
        }]),
        new Character(playerNumber, "rogue", {
          HP: Constants.ROGUE_HP_BASE,
          Attack: Constants.ROGUE_ATTACK_BASE,
          Defense: Constants.ROGUE_DEFENSE_BASE,
          MagicAttack: Constants.ROGUE_MAGIC_ATTACK_BASE,
          MagicDefense: Constants.ROGUE_MAGIC_DEFENSE_BASE,
          Speed: Constants.ROGUE_SPEED_BASE,
          Luck: Constants.ROGUE_LUCK_BASE
        }, [{
          type: 'attack',
          scalar: Constants.SINGLE_TARGET_SCALAR,
          multiTarget: false
        }, {
          type: 'multi_attack',
          scalar: Constants.MULTI_TARGET_SCALAR,
          multiTarget: true
        }, {
          type: 'defend',
          scalar: 0,
          multiTarget: false
        }])
      ]
    };
  }
}

module.exports = TeamFactory; // Optionally export the class