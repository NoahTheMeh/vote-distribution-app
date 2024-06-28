import React, { useState } from 'react';

const Slider = ({ min, max, step, initialValue, onChange, label }) => {
    const [value, setValue] = useState(initialValue);

    const handleChange = (event) => {
        const newValue = event.target.value;
        setValue(newValue);
        if (onChange) {
            onChange(newValue);
        }
    };

    return (
        <div>
            {label && <label>{label}</label>}
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={handleChange}
                style={{ width: '300px' }} // Adjust the width to make the slider longer
            />
            <span>{value}</span>
        </div>
    );
};

export default Slider;
