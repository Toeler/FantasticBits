const GameState = require('./GameState');
const Wizard = require('./Wizard');
const Snaffle = require('./Snaffle');
const Bludger = require('./Bludger');

/*** MAIN LOGIC BEGINS HERE ***/

const ENTITY = {
	MY_WIZARD: 'WIZARD',
	OPPONENT_WIZARD: 'OPPONENT_WIZARD',
	SNAFFLE: 'SNAFFLE',
	BLUDGER: 'BLUDGER'
};

GameState.myTeamId = parseInt(readline());

while (true) {
	const start = new Date();

	GameState.myWizards = [];
	GameState.opponentWizards = [];
	GameState.snaffles = [];
	GameState.bludgers = [];

    const entityCount = parseInt(readline());
    for (var i = 0; i < entityCount; i++) {
        var inputs = readline().split(' ');
        var entityType = inputs[1];
        
		switch (entityType) {
			case ENTITY.MY_WIZARD: {
				GameState.myWizards.push(new Wizard(inputs));
				break;
			}
			case ENTITY.OPPONENT_WIZARD: {
				GameState.opponentWizards.push(new Wizard(inputs));
				break;
			}
			case ENTITY.SNAFFLE: {
				GameState.snaffles.push(new Snaffle(inputs));
				break;
			}
			case ENTITY.BLUDGER: {
				GameState.bludgers.push(new Bludger(inputs));
				break;
			}
		}
    }

	GameState.tick();

	printErr(`Turn took ${new Date() - start}ms`);
}