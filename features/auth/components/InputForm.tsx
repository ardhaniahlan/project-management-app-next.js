import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
}

export const InputForm = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    return (
      <div className="flex flex-col space-y-1 mb-3.5">
        <label className="text-xs font-medium text-gray-700">{label}</label>

        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-400 w-4 h-4 [&>svg]:w-4 [&>svg]:h-4">
              {icon}
            </span>
          )}

           <input
            ref={ref}
            type={inputType}
            className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2 bg-white border ${
              error
                ? 'border-red-400 focus:ring-red-100 focus:border-red-400'
                : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400'
            } rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 transition-all`}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>

        {error && <span className="text-xs text-red-500 mt-0.5">{error}</span>}
      </div>
    );
  },
);

InputForm.displayName = "Input";
