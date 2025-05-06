class TargetOutcomeLog {

	constructor(target, action, previousHP = null, previousDefense = null, previousMagicDefense = null){
		//action/target details
		this.controller = target.playerNumber;
		this.characterName = target.name;
		this.actionType = action.action.type;

		//for heal action
		this.previousHP = previousHP;
		this.currentHP = target.stats.currentHP;
		this.hpChange = this.currentHP - this.previousHP;

		//For defend action
		this.previousDefense = previousDefense;
		this.previousMagicDefense = previousMagicDefense;
		this.defense = target.stats.Defense;
		this.magicDefense = target.stats.MagicDefense;
		this.defenseChange = this.defense - this.previousDefense;
		this.magicDefenseChange = this.magicDefense - this.previousMagicDefense;
	
		//Killed Character
		this.defeated = (this.currentHP <= 0);
	}
}

module.exports = TargetOutcomeLog;