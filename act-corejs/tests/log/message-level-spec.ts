import actLogger from "../../src/logger";
const serializer = require("@brodao/act-jest-snapshot-console");

expect.addSnapshotSerializer(serializer);

const { wrap } = serializer;

test("Informação simples", () => {
	expect(wrap(() => actLogger.gray("Informação simples"))).toMatchSnapshot();
});

test("Informação com vários agumentos", () => {
	expect(
		wrap(() => actLogger.gray("Informação com argumentos A:%s, A:%s, A:%s ", "arg 1", "arg 2", "arg 3"))
	).toMatchSnapshot();
});

test("Aviso simples", () => {
	expect(wrap(() => actLogger.warn("Aviso simples"))).toMatchSnapshot();
});

test("Aviso com vários agumentos", () => {
	expect(wrap(() => actLogger.warn("Aviso com argumentos", "arg 1", "arg 2", "arg 3"))).toMatchSnapshot();
});

test("Erro simples", () => {
	expect(wrap(() => actLogger.error("Erro simples"))).toMatchSnapshot();
});

test("Erro com vários agumentos", () => {
	expect(wrap(() => actLogger.error("Erro com argumentos", "arg 1", "arg 2", "arg 3"))).toMatchSnapshot();
});

test("Verbose simples", () => {
	actLogger.config.verboseEnable = true;

	expect(wrap(() => actLogger.verbose("Verbose simples"))).toMatchSnapshot();
});

test("Verbose com vários agumentos", () => {
	actLogger.config.verboseEnable = true;

	expect(
		wrap(() =>
			actLogger.verbose("Informação com argumentos", {
				"key 1": "arg 1",
				"key 2": "arg 2",
				"key 3": 3,
			})
		)
	).toMatchSnapshot();
});

test("Verbose desligado", () => {
	actLogger.config.verboseEnable = false;

	expect(wrap(() => actLogger.verbose("Verbose desligado"))).toMatchSnapshot();
});

test("Log com argumentos {}", () => {
	expect(wrap(() => actLogger.gray("Log com argumentos {0}, {1}, {2}", "arg 1", "arg 2", 3))).toMatchSnapshot();
});
