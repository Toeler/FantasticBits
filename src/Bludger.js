const Entity = require('./Entity');

class Bludger extends Entity {
	constructor(inputs) {
		super(inputs);
	}

	get radius() {
		return 200;
	}
}

module.exports = Bludger;