import { useState } from 'react';
import PropTypes from 'prop-types';

function PasswordInput({
  autoComplete,
  id,
  inputClassName = 'block w-full rounded-lg border border-slate-300 px-3 py-2',
  maxLength,
  minLength,
  onChange,
  required,
  value
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative mt-1">
      <input
        autoComplete={autoComplete}
        className={`${inputClassName} pr-16`}
        id={id}
        maxLength={maxLength}
        minLength={minLength}
        onChange={onChange}
        required={required}
        type={visible ? 'text' : 'password'}
        value={value}
      />
      <button
        type="button"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 px-3 text-sm font-semibold text-pink-700 hover:text-pink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

PasswordInput.propTypes = {
  autoComplete: PropTypes.string,
  id: PropTypes.string,
  inputClassName: PropTypes.string,
  maxLength: PropTypes.number,
  minLength: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  value: PropTypes.string.isRequired
};

export default PasswordInput;
