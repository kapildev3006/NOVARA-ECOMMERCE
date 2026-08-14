import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const testAPI = async () => {
  // Start server
  const server = spawn("npm", ["run", "dev"], { cwd: path.join(__dirname, ".."), shell: true });
  
  // Give server time to start
  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    console.log("1. Testing Register");
    const regRes = await fetch("http://localhost:5000/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "Test User", email: "testauth@example.com", password: "password123" })
    });
    const regData = await regRes.json();
    console.log("Register:", regData.success);
    
    let cookies = regRes.headers.get("set-cookie") || "";
    let refreshTokenCookie = cookies.split(";")[0]; // naive extraction
    const accessToken = regData.data?.accessToken;

    console.log("2. Testing Me");
    const meRes = await fetch("http://localhost:5000/api/v1/auth/me", {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    const meData = await meRes.json();
    console.log("Me:", meData.success, meData.data?.user?.email);

    console.log("3. Testing Refresh");
    const refRes = await fetch("http://localhost:5000/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Cookie": refreshTokenCookie }
    });
    const refData = await refRes.json();
    console.log("Refresh:", refData.success);
    
    console.log("4. Testing Logout");
    const outRes = await fetch("http://localhost:5000/api/v1/auth/logout", {
      method: "POST",
      headers: { "Cookie": refreshTokenCookie }
    });
    const outData = await outRes.json();
    console.log("Logout:", outData.success);

  } catch(e) {
    console.error(e);
  } finally {
    server.kill();
    process.exit(0);
  }
};

testAPI();
