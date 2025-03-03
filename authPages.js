import React, { useState } from "react";
import { FormInput, Alert, Button } from "./components";
import { AuthService } from "./services";

// Login Page
export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setError("");
      setLoading(true);

      const response = await AuthService.login(email, password);

      // Redirect based on user type
      const user = response.user;
      if (user.accountType === "APPLICANT") {
        window.location.href = "/applicant/dashboard";
      } else if (user.accountType === "HR") {
        window.location.href = "/hr/dashboard";
      } else if (user.accountType === "ADMIN") {
        window.location.href = "/admin/dashboard";
      }
    } catch (error) {
      setError(error.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <a
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              register for a new account
            </a>
          </p>
        </div>

        {error && <Alert type="error" message={error} />}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <FormInput
            id="email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <FormInput
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// Registration Page
export function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    dateOfBirth: "",
    street: "",
    city: "",
    postalCode: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.phoneNumber ||
      !formData.dateOfBirth
    ) {
      setError("Please fill in all required fields");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Remove confirmPassword from the data sent to API
      const { confirmPassword, ...registrationData } = formData;

      await AuthService.register({
        ...registrationData,
        accountType: "APPLICANT", // All registrations are for applicants
      });

      // Redirect to dashboard
      window.location.href = "/applicant/dashboard";
    } catch (error) {
      setError(error.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full mx-auto space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create a new account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <a
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              sign in to your existing account
            </a>
          </p>
        </div>

        {error && <Alert type="error" message={error} />}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <FormInput
              id="firstName"
              label="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />

            <FormInput
              id="lastName"
              label="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              required
            />

            <FormInput
              id="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="sm:col-span-2"
            />

            <FormInput
              id="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <FormInput
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <FormInput
              id="phoneNumber"
              label="Phone Number"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />

            <FormInput
              id="dateOfBirth"
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
            />

            <FormInput
              id="street"
              label="Street Address"
              value={formData.street}
              onChange={handleChange}
              className="sm:col-span-2"
            />

            <FormInput
              id="city"
              label="City"
              value={formData.city}
              onChange={handleChange}
            />

            <FormInput
              id="postalCode"
              label="Postal Code"
              value={formData.postalCode}
              onChange={handleChange}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </Button>
        </form>
      </div>
    </div>
  );
}
