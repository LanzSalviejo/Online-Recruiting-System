import React from "react";

// Button Component
export function Button({
  type = "button",
  variant = "primary",
  className = "",
  disabled = false,
  onClick,
  children,
}) {
  const baseClasses =
    "px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    link: "bg-transparent text-blue-600 hover:underline p-0",
  };

  const disabledClasses = disabled
    ? "opacity-50 cursor-not-allowed"
    : "cursor-pointer";

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${disabledClasses} ${className}`;

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// Card Component
export function Card({ title, children, className = "", footer = null }) {
  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
      )}
      <div className="px-4 py-5 sm:p-6">{children}</div>
      {footer && (
        <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
}

// Form Input Component
export function FormInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  required = false,
  placeholder = "",
  error = "",
  className = "",
}) {
  return (
    <div className={`mb-4 ${className}`}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className={`block w-full px-3 py-2 border ${
          error ? "border-red-500" : "border-gray-300"
        } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// Alert Component
export function Alert({ type = "info", message, onClose }) {
  const alertClasses = {
    info: "bg-blue-50 border-blue-400 text-blue-700",
    success: "bg-green-50 border-green-400 text-green-700",
    warning: "bg-yellow-50 border-yellow-400 text-yellow-700",
    error: "bg-red-50 border-red-400 text-red-700",
  };

  return (
    <div
      className={`${alertClasses[type]} px-4 py-3 rounded relative border mb-4`}
      role="alert"
    >
      <span className="block sm:inline">{message}</span>
      {onClose && (
        <span
          className="absolute top-0 bottom-0 right-0 px-4 py-3"
          onClick={onClose}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </span>
      )}
    </div>
  );
}

// Sidebar Component
export function Sidebar({ user, onLogout }) {
  return (
    <div className="w-64 bg-blue-800 text-white p-4 h-screen flex flex-col">
      <div className="text-xl font-bold mb-8">Online Recruiting</div>

      <nav className="space-y-2 flex-1">
        {user?.accountType === "APPLICANT" && (
          <>
            <a
              href="/applicant/dashboard"
              className="block p-2 hover:bg-blue-700 rounded"
            >
              Dashboard
            </a>
            <a
              href="/applicant/jobs"
              className="block p-2 hover:bg-blue-700 rounded"
            >
              Job Listings
            </a>
            <a
              href="/applicant/applications"
              className="block p-2 hover:bg-blue-700 rounded"
            >
              My Applications
            </a>
          </>
        )}

        {user?.accountType === "HR" && (
          <>
            <a
              href="/hr/dashboard"
              className="block p-2 hover:bg-blue-700 rounded"
            >
              Dashboard
            </a>
            <a href="/hr/jobs" className="block p-2 hover:bg-blue-700 rounded">
              Job Postings
            </a>
            <a
              href="/hr/applications"
              className="block p-2 hover:bg-blue-700 rounded"
            >
              Applications
            </a>
            <a
              href="/hr/jobs/create"
              className="block p-2 hover:bg-blue-700 rounded"
            >
              Create Job
            </a>
          </>
        )}

        {user?.accountType === "ADMIN" && (
          <>
            <a
              href="/admin/dashboard"
              className="block p-2 hover:bg-blue-700 rounded"
            >
              Dashboard
            </a>
            <a
              href="/admin/staff"
              className="block p-2 hover:bg-blue-700 rounded"
            >
              HR Staff
            </a>
            <a
              href="/admin/categories"
              className="block p-2 hover:bg-blue-700 rounded"
            >
              Categories
            </a>
            <a
              href="/admin/reports"
              className="block p-2 hover:bg-blue-700 rounded"
            >
              Reports
            </a>
          </>
        )}
      </nav>

      <div className="mt-auto">
        <div className="flex items-center mb-4">
          <div className="mr-3 h-8 w-8 rounded-full bg-blue-700 flex items-center justify-center text-xs">
            {user?.firstName?.charAt(0)}
            {user?.lastName?.charAt(0)}
          </div>
          <div>
            <div className="font-medium">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs opacity-75">{user?.accountType}</div>
          </div>
        </div>

        <button
          className="w-full p-2 bg-red-600 hover:bg-red-700 rounded text-white"
          onClick={onLogout}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

// Layout component that includes sidebar and main content
export function Layout({ user, children }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        user={user}
        onLogout={() => {
          // Import AuthService dynamically to avoid circular dependency
          import("./services.js").then(({ AuthService }) => {
            AuthService.logout();
          });
        }}
      />

      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
