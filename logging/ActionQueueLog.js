const Logger = require('./Logger');
const CharacterActionLog = require('./CharacterActionLog');



/**Creates a JSON parseable log from an existing actionQueue*/
class ActionQueueLog {

    constructor(actionQueue) {

        this.actionQueueLog = [];

        //TODO: Handle if we accidentally see AI Director in actionQueue 
        for (let action of actionQueue) {
            //check if director or player action
            if (action.actor.playerNumber !== 'AI Director') {
                this.actionQueueLog.push(new CharacterActionLog(action));
            } 
        }
    }

    toJSON() {
        let jsonLog = [];
        for (let action of this.actionQueueLog) {
            jsonLog.push(action.toJSON());
        }
        return jsonLog;
    }


}

module.exports = ActionQueueLog;