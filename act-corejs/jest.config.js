module.exports = {
	testEnvironment: "node",
	moduleFileExtensions: ["ts", "js", "json"],
	testMatch: ["**/tests/**/*.ts", "**/*.test.ts"],
	transform: { "\\.ts$": "ts-jest/preprocessor" },
	coverageReporters: ["lcov", "text-summary"],
	collectCoverage: !!process.env.CI,
	collectCoverageFrom: ["src/**/*.ts"],
	coverageThreshold: {
		global: {
			branches: 60,
			functions: 60,
			lines: 60,
			statements: 60,
		},
	},
};
