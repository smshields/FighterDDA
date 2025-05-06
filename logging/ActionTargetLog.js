/**Contains information on what player controls a given target.*/
class ActionTargetLog{
    constructor(playerNumber, targetName){
        this.controller = playerNumber
        this.targetName = targetName;

    }

    toJSON(){}
}

module.exports = ActionTargetLog;