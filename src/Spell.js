class Spell {
	constructor(target) {
		this.target = target;
	}

	toString() {
		return `${this.name} ${this.target.id}`;
	}
}

class Obliviate extends Spell {
	get name() {
		return 'OBLIVIATE';
	}
}
Obliviate.cost = 3;
Spell.Obliviate = Obliviate;

class Petrificus extends Spell {
	get name() {
		return 'PETRIFICUS';
	}
}
Petrificus.cost = 10;
Spell.Petrificus = Petrificus;

class Accio extends Spell {
	get name() {
		return 'ACCIO';
	}
}
Accio.cost = 20;
Spell.Accio = Accio;

class Flipendo extends Spell {
	get name() {
		return 'FLIPENDO';
	}
}
Flipendo.cost = 20;
Spell.Flipendo = Flipendo;

module.exports = Spell;