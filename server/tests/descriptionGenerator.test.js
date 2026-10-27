const http = require("node:http");

jest.mock("../config/passport", () => ({
    initialize: () => (_req, _res, next) => next(),
    authenticate: () => (_req, _res, next) => next(),
}));

jest.mock("../models/Farmer", () => ({
    create: jest.fn(),
    find: jest.fn(),
}));

jest.mock("../models/User", () => ({
    create: jest.fn(),
    findOne: jest.fn(),
}));

jest.mock("../models/WaterResource", () => ({
    create: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
}));

const { app } = require("../index");
const WaterResource = require("../models/WaterResource");
const {
    createLocalDescription,
    generateDescription,
} = require("../services/descriptionGenerator");

const resourceDetails = {
    name: "Kaveri Reservoir",
    type: "Reservoir",
    location: "Tiruchirappalli",
    condition: "Water level is moderate",
};

const llmEnvironmentKeys = [
    "LLM_API_KEY",
    "LLM_API_URL",
    "LLM_MODEL",
];
let originalLlmEnvironment;
let server;
let baseUrl;

beforeAll(async() => {
    server = await new Promise((resolve) => {
        const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    });

    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(() => {
    originalLlmEnvironment = Object.fromEntries(
        llmEnvironmentKeys.map((key) => [key, process.env[key]])
    );
    llmEnvironmentKeys.forEach((key) => delete process.env[key]);
});

afterEach(() => {
    llmEnvironmentKeys.forEach((key) => {
        const value = originalLlmEnvironment[key];
        if (value === undefined) {
            delete process.env[key];
        } else {
            process.env[key] = value;
        }
    });

    jest.restoreAllMocks();
});

afterAll(async() => {
    await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    });
});

function postJson(path, body) {
    return new Promise((resolve, reject) => {
        const requestBody = JSON.stringify(body);
        const request = http.request(`${baseUrl}${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(requestBody),
            },
        }, (response) => {
            let responseBody = "";
            response.setEncoding("utf8");
            response.on("data", (chunk) => {
                responseBody += chunk;
            });
            response.on("end", () => {
                resolve({
                    status: response.statusCode,
                    body: JSON.parse(responseBody),
                });
            });
        });

        request.on("error", reject);
        request.end(requestBody);
    });
}

test("local description uses supplied details and identifies the local source", async() => {
    const fetchMock = jest.spyOn(global, "fetch");
    const result = await generateDescription(resourceDetails);

    expect(result).toEqual({
        description: "Kaveri Reservoir is a reservoir located in Tiruchirappalli. Current condition: Water level is moderate.",
        source: "local",
    });
    expect(fetchMock).not.toHaveBeenCalled();
});

test("local description omits the condition when none was supplied", () => {
    expect(createLocalDescription({
        name: "Community well",
        type: "Well",
        location: "North field",
    })).toBe("Community well is a well located in North field.");
});

test("configured LLM receives private credentials and resource facts", async() => {
    process.env.LLM_API_KEY = "test-server-only-key";
    process.env.LLM_MODEL = "test-model";
    process.env.LLM_API_URL = "https://llm.example.test/v1/chat/completions";
    jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async() => ({
            choices: [{ message: { content: "A reservoir near the city." } }],
        }),
    });

    const result = await generateDescription(resourceDetails);

    expect(result).toEqual({
        description: "A reservoir near the city.",
        source: "llm",
    });
    expect(fetch).toHaveBeenCalledWith(
        "https://llm.example.test/v1/chat/completions",
        expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
                Authorization: "Bearer test-server-only-key",
            }),
        })
    );
    const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
    expect(requestBody.model).toBe("test-model");
    expect(JSON.parse(requestBody.messages[1].content)).toEqual({
        name: resourceDetails.name,
        type: resourceDetails.type,
        location: resourceDetails.location,
        condition: resourceDetails.condition,
    });
});

test("configured LLM rejects provider HTTP errors without revealing credentials", async() => {
    process.env.LLM_API_KEY = "private-test-key";
    jest.spyOn(global, "fetch").mockResolvedValue({
        ok: false,
        status: 429,
    });

    const error = await generateDescription(resourceDetails).catch((requestError) => requestError);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Description provider returned HTTP 429.");
    expect(error.message).not.toContain("private-test-key");
});

test("configured LLM reports network failures clearly", async() => {
    process.env.LLM_API_KEY = "private-test-key";
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("network unavailable"));

    await expect(generateDescription(resourceDetails)).rejects.toThrow(
        "Unable to reach the description provider."
    );
});

test("POST /api/ai/description rejects missing required details", async() => {
    const result = await postJson("/api/ai/description", {
        name: "Kaveri Reservoir",
        type: "Reservoir",
    });

    expect(result.status).toBe(400);
    expect(result.body).toEqual({
        message: "Name, type and location are required to suggest a description.",
    });
});

test("POST /api/ai/description handles an empty request body", async() => {
    const result = await postJson("/api/ai/description", {});

    expect(result.status).toBe(400);
    expect(result.body.message).toMatch(/Name, type and location are required/);
});

test("POST /api/ai/description labels the local fallback in its response", async() => {
    const result = await postJson("/api/ai/description", resourceDetails);

    expect(result.status).toBe(200);
    expect(result.body).toEqual({
        description: "Kaveri Reservoir is a reservoir located in Tiruchirappalli. Current condition: Water level is moderate.",
        source: "local",
    });
});

test("POST /api/ai/description reports invalid provider responses as errors", async() => {
    process.env.LLM_API_KEY = "private-test-key";
    jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async() => ({ choices: [] }),
    });

    const result = await postJson("/api/ai/description", resourceDetails);

    expect(result.status).toBe(502);
    expect(result.body).toEqual({
        message: "Description provider returned no suggestion.",
    });
});

test("creating a resource still saves its current condition", async() => {
    const resourceInput = {
        ...resourceDetails,
        farmer: "farmer-123",
    };
    const savedResource = { _id: "resource-123", ...resourceInput };
    WaterResource.create.mockResolvedValue(savedResource);

    const result = await postJson("/api/water-resources", resourceInput);

    expect(result.status).toBe(201);
    expect(WaterResource.create).toHaveBeenCalledWith(resourceInput);
    expect(result.body.data.condition).toBe(resourceDetails.condition);
});
