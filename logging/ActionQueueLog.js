const CharacterActionLog = require('./CharacterActionLog');
const Logger = require('./Logger');


/**Creates a JSON parseable log from an existing actionQueue*/
class ActionQueueLog {

    constructor(actionQueue) {

    	this.actionQueueLog = [];
        this.logger = new Logger();


        for (let action of actionQueue) {
            //check if director or player action
            if (action.actor.playerNumber !== 'AI Director') {
                this.actionQueueLog.push(new CharacterActionLog(action));
            } else {
                //Shouldn't be reached
                this.logger.logError("ActionQueueLog - constructor: Unexpectedly logged director action from actionQueue!");
            }
        }
    }

    toJSON(){
        let jsonLog = [];
        for(let action of this.actionQueueLog){
            jsonLog.push(action.toJSON());
        }
        return jsonLog;
    }


}

module.exports = ActionQueueLog;