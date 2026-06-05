import app from "../dist/server.cjs";

const expressApp = app.default || app;

export default expressApp;
