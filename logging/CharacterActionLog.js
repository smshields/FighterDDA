const ActionTargetLog = require('./ActionTargetLog');

/**Contains action details needed to properly construct JSON logs.
 * 
 * TODO - REFACTORING:
 * - ActionTarget should be its own class
 * 
 * */
class CharacterActionLog{

    constructor(action){        
        this.controller = action.actor.playerNumber;
        this.characterName = action.actor.name;
        this.actionType = action.action.type;
        this.targets = [];

        for(let target of action.targets){
            this.targets.push(new ActionTargetLog(target.playerNumber, target.name));
        }

    }

}

module.exports = CharacterActionLog;