import React, { useImperativeHandle, useRef } from 'react';

/**
 * `@expo/ui/community/picker` replacement for Electron.
 *
 * The Android picker opens a native dialog; a plain <select> is the closest
 * browser equivalent. It is styled here so the Watch screen does not show an
 * unstyled OS dropdown in the middle of the app UI.
 */

type PickerProps = {
  children?: React.ReactNode;
  selectedValue?: string | number;
  onValueChange?: (value: any) => void;
  style?: any;
};

export type PickerRef = Pick<HTMLSelectElement, 'focus' | 'blur'>;

const PickerBase = React.forwardRef<PickerRef, PickerProps>(
  ({ children, selectedValue, onValueChange, style }, ref) => {
    const selectRef = useRef<HTMLSelectElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        const select = selectRef.current;
        if (!select) return;
        select.focus();
        if (typeof select.showPicker === 'function') {
          select.showPicker();
        }
      },
      blur: () => selectRef.current?.blur(),
    }));

    return (
      <span
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          width: '100%',
          minWidth: 180,
        }}>
        <select
          ref={selectRef}
          value={selectedValue as any}
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
            width: '100%',
            padding: '9px 34px 9px 12px',
            border: '1px solid #47474f',
            borderRadius: 8,
            background: '#26262b',
            color: '#f2f2f2',
            fontSize: 13,
            fontWeight: 500,
            fontFamily: '"Segoe UI", system-ui, sans-serif',
            lineHeight: 1.3,
            cursor: 'pointer',
            outline: 'none',
            transition: 'border-color 120ms ease, background 120ms ease',
            ...style,
          }}
          onFocus={event => {
            event.currentTarget.style.borderColor = '#4dd0e1';
            event.currentTarget.style.background = '#2d2d33';
          }}
          onBlur={event => {
            event.currentTarget.style.borderColor = '#47474f';
            event.currentTarget.style.background = '#26262b';
          }}
          onChange={event => onValueChange?.((event.target as HTMLSelectElement).value)}>
          {children}
        </select>
        <svg
          viewBox="0 0 24 24"
          width={18}
          height={18}
          fill="#bdbdbd"
          aria-hidden="true"
          style={{ position: 'absolute', right: 9, pointerEvents: 'none' }}>
          <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
        </svg>
      </span>
    );
  },
);

const Picker = PickerBase as any;
Picker.displayName = 'Picker';
Picker.Item = ({ label, value }: { label: string; value: any }) => (
  <option value={value} style={{ background: '#26262b', color: '#f2f2f2' }}>
    {label}
  </option>
);

export { Picker };
