import actLogger from "../../src/logger";
const serializer = require("@brodao/act-jest-snapshot-console");

expect.addSnapshotSerializer(serializer);

const { wrap } = serializer;

test("Mensagem aninhada", () => {
	expect(
		wrap(() => {
			actLogger.gray("Mensagem aninhada");
			actLogger.nested("Linha 1");
			actLogger.nested("Linha 2");
			actLogger.gray("Mensagem desaninhada");
		})
	).toMatchSnapshot();
});
