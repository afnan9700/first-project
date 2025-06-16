// importing the necessary stuff
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// main login page component
const LoginPage = () => {
  // states for username, pass, message which will have to be re-rendered
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // event handler for when the user hits submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // sending http req to the backend asynchronously
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // makes the browser attach cookies to the request
        body: JSON.stringify({ username, password })
      });

      // res.json() returns a promise, so calling it asynchronously
      const data = await res.json();

      if (res.ok) {
        setMessage("Login successful!");
        // optionally redirect here or update state
      } else {
        setMessage(data.message || "Login failed.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your username"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
          />
        </div>
        <Button type="submit" className="w-full">
          Login
        </Button>
        {message && (
          <div className="text-sm text-center text-red-500 mt-2">{message}</div>
        )}
      </form>
    </div>
  );
};

export default LoginPage;
