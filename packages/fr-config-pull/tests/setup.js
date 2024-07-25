import { fs } from "memfs";
import mock from "mock-require";

mock("fs", fs);
mock("fs/promises", fs.promises);
