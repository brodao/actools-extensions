import actLogger from "../../src/logger";
const serializer = require("@brodao/act-jest-snapshot-console");

expect.addSnapshotSerializer(serializer);

const { wrap } = serializer;

describe("Console em texto puro", () => {
	beforeEach(() => {
		actLogger.config.raw = true;
	});

	afterEach(() => {
		actLogger.config.raw = false;
	});

	test("Apresenta o 'splash'", () => {
		expect(
			wrap(() =>
				actLogger.showBanner({
					name: "test_show_banner",
					version: "99.99.99",
					description: "Show Banner",
				})
			)
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
});
