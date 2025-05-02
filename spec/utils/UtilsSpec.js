const Utils = require("../../utils/Utils");
const Constants = require("../../utils/Constants");
const Character = require("../../core/Character");


describe("Map", function() {

	it("should map a number from a large range to a small one", function() {
		let value = Utils.map(0, -10, 10, 0, 1);
		expect(value).toBe(0.5);
	});

	it("should map a number from a small range to a large one", function() {
		let value = Utils.map(0.5, 0, 1, -10, 10);
		expect(value).toBe(0);
	});
});

describe("MapAttackStatToDamage", function() {

	//Testing done without stat fuzziness
	//create character 1
	let character1 = new Character(
		1,
		Constants.WARRIOR_NAME, {}, [{}]
	);

	character1.stats.Attack = 80;
	character1.stats.Defense = 80;

	//create character 2
	let character2 = new Character(
		2,
		Constants.MAGE_NAME, {}, [{}]
	);

	character2.stats.Attack = 20;
	character2.stats.Defense = 20;

	it("should map attack/defense stats of two characters (Warrior > Mage) to damage potential", function() {
		let value = Utils.mapAttackStatToDamage(character1, character2, Constants.SINGLE_TARGET_SCALAR);
		expect(value).toBe(69.75 * Constants.SINGLE_TARGET_SCALAR);
	});

	it("should map attack/defense stats of two characters (Mage > Warrior) to damage potential", function() {
		let value = Utils.mapAttackStatToDamage(character2, character1, Constants.SINGLE_TARGET_SCALAR);
		expect(value).toBe(3.75 * Constants.SINGLE_TARGET_SCALAR);
	});
});

describe("MapMagicAttackStatToDamage", function() {

	//Testing done without stat fuzziness
	//create character 1
	let character1 = new Character(
		1,
		Constants.MAGE_NAME, {}, [{}]
	);

	character1.stats.MagicAttack = 80;
	character1.stats.MagicDefense = 80;

	//create character 2
	let character2 = new Character(
		2,
		Constants.WARRIOR_NAME, {}, [{}]
	);

	character2.stats.MagicAttack = 20;
	character2.stats.MagicDefense = 20;

	it("should map attack/defense stats of two characters (Warrior > Mage) to damage potential", function() {
		let value = Utils.mapMagicAttackStatToDamage(character1, character2, Constants.SINGLE_TARGET_SCALAR);
		expect(value).toBe(69.75 * Constants.SINGLE_TARGET_SCALAR);
	});

	it("should map attack/defense stats of two characters (Mage > Warrior) to damage potential", function() {
		let value = Utils.mapMagicAttackStatToDamage(character2, character1, Constants.SINGLE_TARGET_SCALAR);
		expect(value).toBe(3.75 * Constants.SINGLE_TARGET_SCALAR);
	});
});

describe("Clamp", function() {
	let clampValue = 0;
	let min = 1;
	let max = 10;

	it("should return the value", function() {
		clampValue = 5;
		let value = Utils.clamp(clampValue, min, max);
		expect(value).toBe(5);
	});

	it("should return the minimum", function() {
		clampValue = -5;
		let value = Utils.clamp(clampValue, min, max);
		expect(value).toBe(1);
	});

	it("should return the maximum", function() {
		clampValue = 15;
		let value = Utils.clamp(clampValue, min, max);
		expect(value).toBe(10);
	});
});