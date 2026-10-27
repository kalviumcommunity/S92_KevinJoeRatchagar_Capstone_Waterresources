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
const User = require("../models/User");

let server;
let baseUrl;

beforeAll(async() => {
    server = await new Promise((resolve) => {
        const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    });

    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async() => {
    await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    });
});

async function requestJson(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    return {
        status: response.status,
        body: await response.json(),
    };
}

test("GET / returns the AquaShare API status", async() => {
    const result = await requestJson("/");

    expect(result).toEqual({
        status: 200,
        body: { message: "AquaShare API is running" },
    });
});

test("GET /api/health reports a healthy server", async() => {
    const result = await requestJson("/api/health");

    expect(result).toEqual({
        status: 200,
        body: {
            status: "OK",
            message: "Server is healthy",
        },
    });
});

test("GET /api/water-resources returns the count and resources", async() => {
    const resources = [{ name: "Community well", type: "well" }];
    WaterResource.find.mockResolvedValue(resources);

    const result = await requestJson("/api/water-resources");

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ count: 1, data: resources });
    expect(WaterResource.find).toHaveBeenCalledTimes(1);
});

test("POST /api/water-resources creates and returns a valid resource", async() => {
    const resourceInput = {
        name: "Community well",
        type: "well",
        location: "North field",
        description: "Shared source",
        farmer: "farmer-123",
    };
    const savedResource = { _id: "resource-123", ...resourceInput };
    WaterResource.create.mockResolvedValue(savedResource);

    const result = await requestJson("/api/water-resources", {
        method: "POST",
        body: JSON.stringify(resourceInput),
    });

    expect(result.status).toBe(201);
    expect(result.body).toEqual({
        message: "Water resource created successfully",
        data: savedResource,
    });
    expect(WaterResource.create).toHaveBeenCalledWith(resourceInput);
});

test.each([
    ["name", { type: "well", location: "North field" }],
    ["type", { name: "Community well", location: "North field" }],
    ["location", { name: "Community well", type: "well" }],
])("POST /api/water-resources rejects a missing %s", async(_field, body) => {
    const result = await requestJson("/api/water-resources", {
        method: "POST",
        body: JSON.stringify(body),
    });

    expect(result.status).toBe(400);
    expect(result.body).toEqual({
        message: "Name, type and location are required",
    });
    expect(WaterResource.create).not.toHaveBeenCalled();
});

test("POST /api/auth/register rejects incomplete registration data", async() => {
    const result = await requestJson("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name: "AquaShare user", email: "user@example.test" }),
    });

    expect(result.status).toBe(400);
    expect(result.body).toEqual({
        message: "Name, email and password are required",
    });
    expect(User.findOne).not.toHaveBeenCalled();
});

test("POST /api/auth/login rejects missing credentials", async() => {
    const result = await requestJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "user@example.test" }),
    });

    expect(result.status).toBe(400);
    expect(result.body).toEqual({
        message: "Email and password are required",
    });
    expect(User.findOne).not.toHaveBeenCalled();
});

test("PUT /api/water-resources/:id rejects requests without authorization", async() => {
    const result = await requestJson("/api/water-resources/resource-123", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated well" }),
    });

    expect(result.status).toBe(401);
    expect(result.body).toEqual({
        message: "Authorization header missing",
    });
    expect(WaterResource.findByIdAndUpdate).not.toHaveBeenCalled();
});
