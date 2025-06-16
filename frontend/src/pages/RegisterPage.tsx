// importing the necessary stuff
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// main register page component
const RegisterPage = () => {
  // states for username, pass, message which will have to be re-rendered
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  
  // event handler for when the user hits submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // sending http req to the backend asynchronously
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });
      
      // res.json() returns a promise, so calling it asynchronously
      const data = await res.json();
      
      // modifying the state based on the received response
      if (res.ok) {
        setMessage("Registration successful! You can now log in.");
        setUsername("");
        setPassword("");
      } else {
        setMessage(data.error || "Registration failed");
      }
    } catch (err) {
      setMessage("Something went wrong");
      console.error(err);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      { /* Main form element */ }
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          {/* username field */}
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your username"
          />
        </div>
        <div>
          {/* password field */}
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
          Register
        </Button>
        {message && (
          <div className="text-sm text-center text-red-500 mt-2">{message}</div>
        )}
      </form>
    </div>
  );
};

export default RegisterPage;
