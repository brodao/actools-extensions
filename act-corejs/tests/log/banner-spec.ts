import actLogger from "../../src/logger";
const serializer = require("@brodao/act-jest-snapshot-console");

expect.addSnapshotSerializer(serializer);

const { wrap } = serializer;

describe("Testa a apresentação ou não do 'splash' completo", () => {
	test("Apresenta o 'splash'", () => {
		actLogger.config.showSplash = true;

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

	test("Apresenta um 'splash' simples de identificação", () => {
		actLogger.config.showSplash = false;

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
});
