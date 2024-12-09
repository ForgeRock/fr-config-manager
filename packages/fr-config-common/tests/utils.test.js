const fs = require("fs");
const {
  saveJsonToFile,
  esvToEnv,
  escapePlaceholders,
  unescapePlaceholders,
  journeyNodeNeedsScript,
  replaceAllInJson,
} = require("../src/utils");

jest.mock("fs");

describe("replaceAllInJson", () => {
  test("replaces all occurrences of search strings with corresponding replacements", () => {
    const content = {
      name: "John Doe",
      address: "https://www.example.com/abc/def",
      bio: { test: "John https://www.example.com/abc/123 at Example Corp." },
    };

    const replacements = [
      { search: "John Doe", replacement: "Jane Smith" },
      { search: "https://www.example.com", replacement: "${URL}" },
    ];

    const expected = {
      name: "Jane Smith",
      address: "${URL}/abc/def",
      bio: { test: "John ${URL}/abc/123 at Example Corp." },
    };

    const result = replaceAllInJson(content, replacements);
    expect(result).toEqual(expected);
  });

  test("handles no replacements", () => {
    const content = {
      name: "John Doe",
      address: "123 Main St",
      bio: "John Doe is a software engineer at Example Corp.",
    };

    const replacements = [];

    const result = replaceAllInJson(content, replacements);
    expect(result).toEqual(content);
  });

  test("handles empty content", () => {
    const content = {};

    const replacements = [{ search: "John Doe", replacement: "Jane Smith" }];

    const result = replaceAllInJson(content, replacements);
    expect(result).toEqual(content);
  });
});

describe("esvToEnv", () => {
  test("converts esv to env format", () => {
    expect(esvToEnv("example-service")).toBe("EXAMPLE_SERVICE");
  });
});

describe("escapePlaceholders", () => {
  test("escapes placeholders in content", () => {
    const content = "abc ${value}";
    const expected = "abc \\${value}";
    expect(escapePlaceholders(content)).toEqual(expected);
  });
});

describe("unescapePlaceholders", () => {
  test("unescapes placeholders in content", () => {
    const content = "\\\\${value}";
    const expected = "${value}";
    expect(unescapePlaceholders(content)).toEqual(expected);
  });
});

describe("journeyNodeNeedsScript", () => {
  test("returns true if node has script and useScript is not false", () => {
    const node = { script: "some script" };
    expect(journeyNodeNeedsScript(node)).toBe(true);
  });

  test("returns false if node does not have script", () => {
    const node = {};
    expect(journeyNodeNeedsScript(node)).toBe(false);
  });

  test("returns false if node has useScript set to false", () => {
    const node = { script: "some script", useScript: false };
    expect(journeyNodeNeedsScript(node)).toBe(false);
  });
});

describe("saveJsonToFile", () => {
  test("saves JSON to file", () => {
    const data = { key: "value" };
    const filename = "test.json";
    const jsonData = JSON.stringify(data, null, 2);

    saveJsonToFile(data, filename, false);

    expect(fs.writeFile).toHaveBeenCalledWith(
      filename,
      jsonData,
      expect.any(Function)
    );
  });

  test("logs JSON to stdout if --stdout option is present", () => {
    const data = { key: "value" };
    const jsonData = JSON.stringify(data, null, 2);
    process.argv.push("--stdout");

    console.log = jest.fn();

    saveJsonToFile(data, "test.json", false);

    expect(console.log).toHaveBeenCalledWith(jsonData);

    process.argv.pop();
  });
});
