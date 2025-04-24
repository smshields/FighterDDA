class CharacterActionLog{

    constructor(playerNumber, characterName, actionType){
        this.playerNumber = playerNumber;
        this.characterName = characterName;
        this.actionType = actionType;
        this.outcomes = [];

    }

}

module.exports = CharacterActionLog;