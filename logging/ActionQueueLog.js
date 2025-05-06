const CharacterActionLog = require('./CharacterActionLog');
const DirectorActionLog = require('./DirectorActionLog');


/**Creates a JSON parseable log from an existing actionQueue*/
class ActionQueueLog {

    constructor(actionQueue) {

    	this.actionQueueLog = [];


        for (let action of actionQueue) {
            //check if director or player action
            if (action.actor.playerNumber !== 'AI Director') {
                this.actionQueueLog.push(new CharacterActionLog(action));
            } else {
                this.actionQueueLog.push(new DirectorActionLog(action));
            }
        }

    }

    toJSON(){}

}

module.exports = ActionQueueLog;