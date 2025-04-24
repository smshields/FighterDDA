const Logger = require('./Logger');

class ActionOutcomeLog {

	constructor(targetName, amount = null, prevCurrentHP = null, currentHP = null, prevDefense = null, defense = null, prevMagicDefense = null, magicDefense = null) {
		this.logger = new Logger();

		this.targetName = targetName;
		this.amount = amount;
		if (currentHP) {
			this.currentHP = currentHP;
		}
		if (defense || magicDefense) {
			this.defense = defense;
			this.magicDefense = magicDefense;
		}

		if(!currentHP && !prevCurrentHP && !defense && !magicDefense){
			//TODO: Improve the traceability of this error.
			this.logger.logError(`Invalid action log specified for ${targetName}!`);
		}

	}

}

module.exports = ActionOutcomeLog;