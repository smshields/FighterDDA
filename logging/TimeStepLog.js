class TimeStepLog {

	constructor(currentTimeStep) {
		this.timeStep = this.timeStep; //done
		this.totalActions = 0; 
		this.totalCurrentHP = 0;
		this.actionsInQueue = [];
		this.actionsExecuted = [];
		this.directorActions = [];
		this.player1 = {
			player1TotalActions: 0,
			player1CurrentTotalHealth: 0,
			player1CurrentHPRatio: 0,
			player1TotalDamageDealt: 0,
			player1TotalDamageTaken: 0,
			characters: {
				warrior: {
					currentHP: 0,
					attack: 0,
					magicAttack: 0,
					defense: 0,
					magicDefense: 0,
					speed: 0,
					luck: 0,
					actionsTaken: 0,
					damageDealt: 0,
					damageTaken: 0
				},
				mage: {
					currentHP: 0,
					attack: 0,
					magicAttack: 0,
					defense: 0,
					magicDefense: 0,
					speed: 0,
					luck: 0,
					actionsTaken: 0,
					damageDealt: 0,
					damageTaken: 0
				},
				priest: {
					currentHP: 0,
					attack: 0,
					magicAttack: 0,
					defense: 0,
					magicDefense: 0,
					speed: 0,
					luck: 0,
					actionsTaken: 0,
					damageDealt: 0,
					damageTaken: 0
				},
				rogue: {
					currentHP: 0,
					attack: 0,
					magicAttack: 0,
					defense: 0,
					magicDefense: 0,
					speed: 0,
					luck: 0,
					actionsTaken: 0,
					damageDealt: 0,
					damageTaken: 0
				}
			}
		};
		this.player2 = {
			player2TotalActions: 0,
			player2CurrentTotalHealth: 0,
			player2CurrentHPRatio: 0,
			player2TotalDamageDealt: 0,
			player2TotalDamageTaken: 0,
			characters: {
				warrior: {
					currentHP: 0,
					attack: 0,
					magicAttack: 0,
					defense: 0,
					magicDefense: 0,
					speed: 0,
					luck: 0,
					actionsTaken: 0,
					damageDealt: 0,
					damageTaken: 0
				},
				mage: {
					currentHP: 0,
					attack: 0,
					magicAttack: 0,
					defense: 0,
					magicDefense: 0,
					speed: 0,
					luck: 0,
					actionsTaken: 0,
					damageDealt: 0,
					damageTaken: 0
				},
				priest: {
					currentHP: 0,
					attack: 0,
					magicAttack: 0,
					defense: 0,
					magicDefense: 0,
					speed: 0,
					luck: 0,
					actionsTaken: 0,
					damageDealt: 0,
					damageTaken: 0
				},
				rogue: {
					currentHP: 0,
					attack: 0,
					magicAttack: 0,
					defense: 0,
					magicDefense: 0,
					speed: 0,
					luck: 0,
					actionsTaken: 0,
					damageDealt: 0,
					damageTaken: 0
				}
			}
		};
	}
}

module.exports = TimeStepLog;